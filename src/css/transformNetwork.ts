import type { FontInfo } from "../fonts/fontInfo.ts";

/**
 * Transforms absolute font URLs in CSS to point to the local output directory.
 *
 * Replaces each absolute URL that matches a downloaded font's sourceUrl with
 * a local path of the form `/{outputDir}/{filename}`.
 *
 * @param {string} css - CSS string containing @font-face rules with absolute URLs.
 * @param {string} outputDir - The output directory name for font files.
 * @param {FontInfo[]} downloadedFonts - Array of downloaded fonts with sourceUrl set.
 * @returns {string} The CSS with absolute URLs replaced by local paths.
 */
export function transformNetworkCss(
	css: string,
	outputDir: string,
	downloadedFonts: FontInfo[],
): string {
	let result = css;
	for (const font of downloadedFonts) {
		if (font.sourceUrl) {
			const escapedUrl = font.sourceUrl.replace(
				/[.*+?^${}()|[\]\\]/g,
				"\\$&",
			);
			const urlRegex = new RegExp(
				`url\\(["']?${escapedUrl}["']?\\)`,
				"g",
			);
			result = result.replace(
				urlRegex,
				`url("/${outputDir}/${font.filename}")`,
			);
		}
	}
	return result;
}
