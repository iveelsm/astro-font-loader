import { basename } from "node:path";

/**
 * Transforms font-face URLs in a CSS string to point to a specified output directory.
 *
 * Replaces relative font URLs with absolute URLs based on the output directory. Optionally filters font files by filename.
 *
 * @param {string} rawCss - The raw CSS string containing font-face rules.
 * @param {string} outputDir - The output directory to use in the transformed URLs.
 * @param {(filename: string) => boolean} [filter] - Optional filter function to determine which font files to transform.
 * @returns {string} The CSS string with transformed font-face URLs.
 */
export function transformCss(rawCss: string, outputDir: string, filter?: (filename: string) => boolean): string {
	return rawCss.replace(/url\(["']?\.\/([^"')]+)["']?\)/g, (match, relativePath) => {
		const filename = basename(relativePath);
		if (filter && !filter(filename)) {
			return match;
		}
		return `url("/${outputDir}/${filename}")`;
	});
}
