import { existsSync, readFileSync } from "node:fs";

import type { FontsPackageInfo } from "../fonts/index.ts";
import type { FontVariant } from "../types.ts";
import { matchCssFontFaces } from "./filter.ts";
import { transformCss } from "./transform.ts";

/**
 * Options for getting CSS for @font-face
 */
export type GetFontsCssOptions = {
	/** The CSS font-family name to match. */
	name: string;
	/** Variants to match by weight and style. */
	variants: FontVariant[];
	/** Output directory name. */
	outputDirectory: string;
};

/**
 * Result of CSS processing, including matched CSS and font filenames.
 */
export type GetFontsCssResult = {
	css: string;
	filenames: string[];
};

/**
 * Minifies a CSS string by removing comments, extra whitespace, and newlines.
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
 * Loads, matches, and transforms the CSS for @font-face rules from a font package.
 *
 * Matches @font-face blocks by font-family name, weight, and style against the provided variants.
 * Returns the processed CSS and the list of matched font filenames.
 */
export function getFontsCss(options: GetFontsCssOptions, fontPackageInformation: FontsPackageInfo | null): GetFontsCssResult {
	const { name, variants, outputDirectory } = options;
	if (!fontPackageInformation || !existsSync(fontPackageInformation.cssPath)) {
		return { css: "", filenames: [] };
	}

	const rawCss = readFileSync(fontPackageInformation.cssPath, "utf-8");
	const matched = matchCssFontFaces(rawCss, name, variants);
	const transformedCss = transformCss(matched.css, outputDirectory);
	return { css: minifyCss(transformedCss), filenames: matched.filenames };
}
