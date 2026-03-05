import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";

import type { FontInfo, NetworkFontInfo } from "./fontInfo.ts";

const FONT_EXTENSION_REGEX = /\.(woff2?|ttf|otf|eot)$/i;
const DOWNLOAD_TIMEOUT_MS = 30_000;

/**
 * Extracts absolute font file URLs from CSS @font-face rules.
 *
 * Matches url() references containing https:// URLs that end with a recognized font extension.
 *
 * @param {string} css - CSS string containing @font-face rules with absolute URLs.
 * @returns {string[]} Array of font file URLs found in the CSS.
 */
export function extractFontUrlsFromCss(css: string): string[] {
	const urls: string[] = [];
	const regex = /url\(["']?(https?:\/\/[^"')]+)["']?\)/g;
	let match: RegExpExecArray | null;
	while ((match = regex.exec(css)) !== null) {
		const url = match[1];
		if (FONT_EXTENSION_REGEX.test(url)) {
			urls.push(url);
		}
	}
	return urls;
}

/**
 * Derives a stable, filesystem-safe filename from a URL.
 *
 * Uses the URL's path basename when it has a recognized font extension.
 * Falls back to a hash-based name for opaque URLs.
 *
 * @param {string} url - The font file URL.
 * @returns {string} A filename suitable for the local filesystem.
 */
export function deriveFilenameFromUrl(url: string): string {
	const urlObj = new URL(url);
	const pathBasename = basename(urlObj.pathname);
	if (FONT_EXTENSION_REGEX.test(pathBasename)) {
		return pathBasename;
	}
	const hash = createHash("sha256").update(url).digest("hex").slice(0, 12);
	const ext = extname(urlObj.pathname) || ".woff2";
	return `font-${hash}${ext}`;
}

/**
 * Downloads a single font file to the cache directory.
 *
 * Skips the download if the file already exists in the cache.
 *
 * @param {string} url - The URL of the font file to download.
 * @param {string} cacheDir - The local directory to cache downloaded fonts.
 * @returns {Promise<FontInfo>} Font information with sourcePath pointing to the cached file.
 */
export async function downloadFont(
	url: string,
	cacheDir: string,
): Promise<FontInfo> {
	const filename = deriveFilenameFromUrl(url);
	const cachedPath = join(cacheDir, filename);

	if (!existsSync(cachedPath)) {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			DOWNLOAD_TIMEOUT_MS,
		);
		try {
			const response = await fetch(url, { signal: controller.signal });
			if (!response.ok) {
				throw new Error(
					`Failed to download font from ${url}: ${response.status} ${response.statusText}`,
				);
			}
			const buffer = Buffer.from(await response.arrayBuffer());
			writeFileSync(cachedPath, buffer);
		} finally {
			clearTimeout(timeoutId);
		}
	}

	return {
		filename,
		sourcePath: cachedPath,
		relativePath: filename,
		sourceUrl: url,
	};
}

/**
 * Fetches CSS from a URL, extracts font file URLs, and downloads them.
 *
 * Sends a modern User-Agent header so services like Google Fonts return woff2 format.
 *
 * @param {string} cssUrl - URL that returns CSS containing @font-face rules.
 * @param {string} cacheDir - Local directory to cache downloaded fonts.
 * @param {(filename: string) => boolean} [filter] - Optional filter to select fonts by filename.
 * @returns {Promise<NetworkFontInfo>} The fetched CSS and downloaded font information.
 */
export async function fetchCssFontSource(
	cssUrl: string,
	cacheDir: string,
	filter?: (filename: string) => boolean,
): Promise<NetworkFontInfo> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
	let css: string;
	try {
		const response = await fetch(cssUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; AstroFontLoader/1.0; +https://github.com/iveelsm/astro-font-loader)",
			},
		});
		if (!response.ok) {
			throw new Error(
				`Failed to fetch CSS from ${cssUrl}: ${response.status} ${response.statusText}`,
			);
		}
		css = await response.text();
	} finally {
		clearTimeout(timeoutId);
	}

	const fontUrls = extractFontUrlsFromCss(css);
	const fonts: FontInfo[] = [];

	for (const fontUrl of fontUrls) {
		const fontInfo = await downloadFont(fontUrl, cacheDir);
		if (!filter || filter(fontInfo.filename)) {
			fonts.push(fontInfo);
		}
	}

	return { fonts, css };
}

/**
 * Downloads explicit font file URLs and pairs them with user-provided CSS.
 *
 * @param {string[]} fontUrls - Array of direct URLs to font files.
 * @param {string} css - User-provided CSS containing @font-face rules.
 * @param {string} cacheDir - Local directory to cache downloaded fonts.
 * @param {(filename: string) => boolean} [filter] - Optional filter to select fonts by filename.
 * @returns {Promise<NetworkFontInfo>} The provided CSS and downloaded font information.
 */
export async function fetchDirectFontSource(
	fontUrls: string[],
	css: string,
	cacheDir: string,
	filter?: (filename: string) => boolean,
): Promise<NetworkFontInfo> {
	const fonts: FontInfo[] = [];

	for (const fontUrl of fontUrls) {
		const fontInfo = await downloadFont(fontUrl, cacheDir);
		if (!filter || filter(fontInfo.filename)) {
			fonts.push(fontInfo);
		}
	}

	return { fonts, css };
}
