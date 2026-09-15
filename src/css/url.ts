import { basename } from "node:path";

/**
 * Font file extensions this loader knows how to copy and serve.
 */
const FONT_EXTENSIONS = ["woff2", "woff", "ttf", "otf", "eot"];

/**
 * Maps CSS format() hints onto the file extension of the container they describe.
 */
const FORMAT_EXTENSIONS: Record<string, string> = {
	woff2: "woff2",
	woff: "woff",
	truetype: "ttf",
	opentype: "otf",
	"embedded-opentype": "eot",
};

/**
 * Matches a url() token, capturing the URL without its surrounding quotes.
 */
export const CSS_URL_PATTERN = /url\(\s*["']?([^"')]+?)["']?\s*\)/g;

/**
 * Matches a url() token together with the format() hint that follows it, if any.
 */
export const CSS_SRC_PATTERN = /url\(\s*["']?([^"')]+?)["']?\s*\)(?:\s*format\(\s*["']?([^"')]+?)["']?\s*\))?/g;

/**
 * Checks whether a URL already resolves on its own, meaning it carries a scheme,
 * a protocol-relative host, or a root-relative path.
 */
export function isAbsoluteUrl(url: string): boolean {
	return /^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//") || url.startsWith("/");
}

/**
 * Strips the query string and fragment from a URL, leaving just its path.
 */
function urlPath(url: string): string {
	return url.replace(/[?#].*$/, "");
}

/**
 * Derives the font filename for a URL, ignoring any query string or fragment.
 */
export function fontFilename(url: string): string {
	return basename(urlPath(url));
}

/**
 * Extracts the font file extension from a URL, or null when it has none.
 */
export function extensionFromUrl(url: string): string | null {
	const extension = urlPath(url).split(".").pop()?.toLowerCase() ?? "";
	return FONT_EXTENSIONS.includes(extension) ? extension : null;
}

/**
 * Normalizes a CSS format() hint to the file extension of its container,
 * or null when the hint names a format this loader does not handle.
 *
 * Variation formats such as "woff2-variations" describe the same container as
 * the format they are based on.
 */
export function extensionFromFormat(format: string): string | null {
	const base = format
		.trim()
		.toLowerCase()
		.replace(/-variations$/, "");
	return FORMAT_EXTENSIONS[base] ?? (FONT_EXTENSIONS.includes(base) ? base : null);
}
