import { createHash } from "node:crypto";
import { existsSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

import { matchCssFontFaces } from "../css/filter.ts";
import { minifyCss } from "../css/get.ts";
import { transformCssUrls } from "../css/transform.ts";
import { extensionFromUrl, fontFilename } from "../css/url.ts";
import type { FontInfo } from "../fonts/fontInfo.ts";
import type { FontVariant, NetworkProvider } from "../types.ts";
import type { FontProvider, FontProviderResult } from "./index.ts";

/**
 * Timeout applied to each request when the source does not set one.
 */
const DEFAULT_TIMEOUT = 10_000;

/**
 * Cache directory used when the source does not name one. Sitting under
 * node_modules keeps downloaded fonts out of version control by default.
 */
const DEFAULT_CACHE_DIRECTORY = join("node_modules", ".astro-font-loader");

/**
 * Headers sent with every request unless overridden by the source.
 *
 * Font hosts routinely content-negotiate on User-Agent — Google Fonts serves
 * TrueType rather than woff2 to clients it does not recognize — so presenting a
 * browser User-Agent is what gets modern formats back.
 */
const DEFAULT_HEADERS: Record<string, string> = {
	"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
};

/**
 * In-process caches keyed by request, so the variants of a family, and the pages
 * rendering them, share one fetch rather than one apiece. Fonts additionally
 * survive across processes and builds through the on-disk cache below.
 */
const stylesheetRequests = new Map<string, Promise<string>>();
const fontRequests = new Map<string, Promise<string>>();

/**
 * Distinguishes the temporary file of each download, since the on-disk cache can
 * be shared by concurrent builds and by Astro's separate module instances.
 */
let writes = 0;

/**
 * Shortens a URL to a stable digest, used to namespace cache entries and to
 * disambiguate font files whose names would otherwise collide.
 */
function urlDigest(url: string): string {
	return createHash("sha256").update(url).digest("hex").slice(0, 12);
}

/**
 * Fetches a URL with the source's headers and timeout applied.
 *
 * Throws with the reason on transport failures and error responses alike, so
 * callers can surface why a font is missing instead of silently dropping it.
 */
async function request(url: string, source: NetworkProvider): Promise<Response> {
	let response: Response;

	try {
		response = await fetch(url, {
			headers: { ...DEFAULT_HEADERS, ...source.headers },
			signal: AbortSignal.timeout(source.timeout ?? DEFAULT_TIMEOUT),
		});
	} catch (error) {
		throw new Error(`request to ${url} failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
	}

	if (!response.ok) {
		throw new Error(`request to ${url} returned ${response.status} ${response.statusText}`.trimEnd());
	}

	return response;
}

/**
 * Fetches the stylesheet for a source, reusing the result across calls.
 */
function fetchStylesheet(source: NetworkProvider): Promise<string> {
	const key = `${source.url}\n${JSON.stringify(source.headers ?? {})}`;

	let pending = stylesheetRequests.get(key);
	if (!pending) {
		pending = request(source.url, source).then((response) => response.text());
		stylesheetRequests.set(key, pending);
	}

	return pending;
}

/**
 * Downloads a font to its cache path, writing through a temporary file so an
 * interrupted build cannot leave a truncated font behind to be reused.
 */
async function download(url: string, destination: string, source: NetworkProvider): Promise<string> {
	if (existsSync(destination)) {
		return destination;
	}

	const response = await request(url, source);
	const body = new Uint8Array(await response.arrayBuffer());
	if (body.byteLength === 0) {
		throw new Error(`font at ${url} was empty`);
	}

	const temporary = `${destination}.${process.pid}.${writes++}.partial`;
	mkdirSync(dirname(destination), { recursive: true });

	try {
		writeFileSync(temporary, body);
		renameSync(temporary, destination);
	} catch (error) {
		rmSync(temporary, { force: true });
		throw error;
	}

	return destination;
}

/**
 * Resolves a font URL to a path on disk, downloading it if it is not cached yet.
 *
 * Cache paths are namespaced by a digest of the URL so that a changed URL is a
 * fresh download and fonts sharing a filename never overwrite each other.
 */
function cacheFont(url: string, filename: string, cacheDirectory: string, source: NetworkProvider): Promise<string> {
	const destination = join(cacheDirectory, urlDigest(url), filename);

	let pending = fontRequests.get(destination);
	if (!pending) {
		pending = download(url, destination, source);
		fontRequests.set(destination, pending);
	}

	return pending;
}

/**
 * Resolves the directory downloaded fonts are cached in.
 */
function resolveCacheDirectory(source: NetworkProvider, root?: URL | string): string {
	if (source.cacheDirectory && isAbsolute(source.cacheDirectory)) {
		return source.cacheDirectory;
	}

	const rootPath = root instanceof URL ? fileURLToPath(root) : (root ?? process.cwd());
	return join(rootPath, source.cacheDirectory ?? DEFAULT_CACHE_DIRECTORY);
}

/**
 * Creates the naming scheme for a source's downloaded fonts.
 *
 * Names come from the URL so output paths stay predictable enough to hardcode in
 * `Link` headers. Since the build flattens every font into one directory,
 * distinct URLs that share a filename — per-subset directories, most commonly —
 * get a digest prefix on all but the first.
 */
function createNamer() {
	const assigned = new Map<string, string>();
	const taken = new Set<string>();

	return (url: string, format: string): string => {
		const existing = assigned.get(url);
		if (existing) {
			return existing;
		}

		const base = fontFilename(url) || "font";
		let filename = extensionFromUrl(base) ? base : `${base}.${format}`;
		if (taken.has(filename)) {
			filename = `${urlDigest(url)}-${filename}`;
		}

		assigned.set(url, filename);
		taken.add(filename);
		return filename;
	};
}

/**
 * Resolves a URL from the stylesheet against the stylesheet's own location.
 */
function absoluteUrl(url: string, base: URL): string | null {
	try {
		return new URL(url, base).href;
	} catch {
		return null;
	}
}

/**
 * Creates a font provider that resolves fonts from a stylesheet hosted at a URL.
 *
 * The stylesheet is fetched at build time, the @font-face rules matching each
 * variant are kept, and the fonts they reference are downloaded so the build can
 * serve them from its own output directory.
 *
 * Returns null if the source URL is not a valid http(s) URL.
 */
export function createNetworkProvider(source: NetworkProvider, root?: URL | string): FontProvider | null {
	let base: URL;

	try {
		base = new URL(source.url);
	} catch {
		return null;
	}

	if (base.protocol !== "http:" && base.protocol !== "https:") {
		return null;
	}

	const cacheDirectory = resolveCacheDirectory(source, root);
	const nameFor = createNamer();

	return {
		async resolveVariant(variant: FontVariant, outputDirectory: string): Promise<FontProviderResult> {
			const stylesheet = await fetchStylesheet(source);
			const matched = matchCssFontFaces(stylesheet, variant.name, [variant]);

			// Names are assigned up front so that downloading in parallel below
			// cannot make the naming depend on which request finishes first.
			const targets = [];
			for (const { url, format } of matched.sources) {
				const absolute = absoluteUrl(url, base);
				if (absolute) {
					targets.push({ url, absolute, filename: nameFor(absolute, format) });
				}
			}

			if (targets.length === 0) {
				return { css: "", fonts: [] };
			}

			const fonts: FontInfo[] = await Promise.all(
				targets.map(async ({ absolute, filename }) => ({
					filename,
					sourcePath: await cacheFont(absolute, filename, cacheDirectory, source),
					relativePath: filename,
				})),
			);

			const rewrites = new Map(targets.map(({ url, filename }) => [url, `/${outputDirectory}/${filename}`]));
			const css = transformCssUrls(matched.css, (url) => rewrites.get(url) ?? null);

			return { css: minifyCss(css), fonts };
		},
	};
}
