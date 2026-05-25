import { existsSync, readFileSync } from "node:fs";

import type { FontsPackageInfo } from "../fonts/index.ts";
import { filterCssFontFaces } from "./filter.ts";
import { transformCss } from "./transform.ts";

/**
 * Options for getting CSS for @font-face
 */
export type GetFontsCssOptions = {
	/** Filter function to select font files by filename. */
	filter?: (filename: string) => boolean;
	/** Output directory name. */
	outputDirectory: string;
};

/**
 * Minifies a CSS string by removing comments, extra whitespace, and newlines.
 *
 * @param css - The CSS string to minify.
 * @returns The minified CSS string.
 */
function minifyCss(css: string): string {
	return css
		.replace(/\/\*[\s\S]*?\*\//g, "")
		.replace(/\s+/g, " ")
		.replace(/\s*([{}:;,])\s*/g, "$1")
		.replace(/;}/g, "}")
		.trim();
}

/**
 * Loads, filters, and transforms the CSS for font-face rules from a font package.
 *
 * Reads the CSS file specified in the font package information, applies an optional filter to @font-face rules,
 * and transforms the CSS for output. Returns an empty string if no font package information is provided or the CSS file does not exist.
 *
 * @param {GetFontsCssOptions} [options={}] - Options including filter and output directory.
 * @param {FontsPackageInfo | null} fontPackageInformation - Information about the font package, including the CSS file path.
 * @returns {string} The processed and minified CSS string, or an empty string if the CSS file is missing or no package info is provided.
 */
export function getFontsCss(
	options: GetFontsCssOptions,
	fontPackageInformation: FontsPackageInfo | null,
): string {
	const { filter, outputDirectory } = options;
	if (
		!fontPackageInformation ||
		!existsSync(fontPackageInformation.cssPath)
	) {
		return "";
	}

	let rawCss = readFileSync(fontPackageInformation.cssPath, "utf-8");
	rawCss = filterCssFontFaces(rawCss, filter);
	const transformedCss = transformCss(rawCss, outputDirectory, filter);
	return minifyCss(transformedCss);
}
