import { existsSync, readFileSync } from "node:fs";

import  type { FontsPackageInfo } from "../fonts";
import { filterCssFontFaces } from "./filter";
import { transformCss } from "./transform";

/**
 * Options for getting fonts CSS.
 */
export type GetFontsCssOptions = {
	/** Optional filter function to select font files by filename. */
	filter?: (filename: string) => boolean;
	/** Optional output directory name. Defaults to "fonts". */
	outputDir?: string;
};

/**
 * Loads, filters, and transforms the CSS for font-face rules from a font package.
 *
 * Reads the CSS file specified in the font package information, applies an optional filter to @font-face rules,
 * and transforms the CSS for output. Returns an empty string if no font package information is provided or the CSS file does not exist.
 *
 * @param {GetFontsCssOptions} [options={}] - Options including filter and output directory.
 * @param {FontsPackageInfo | null} fontPackageInformation - Information about the font package, including the CSS file path.
 * @returns {string} The processed CSS string, or an empty string if the CSS file is missing or no package info is provided.
 */
export function getFontsCss(
	options: GetFontsCssOptions = {},
	fontPackageInformation: FontsPackageInfo | null,
): string {
	const { filter, outputDir = "fonts" } = options;
	if (
		!fontPackageInformation ||
		!existsSync(fontPackageInformation.cssPath)
	) {
		return "";
	}

	let rawCss = readFileSync(fontPackageInformation.cssPath, "utf-8");
	rawCss = filterCssFontFaces(rawCss, filter);
	return transformCss(rawCss, outputDir, filter);
}
