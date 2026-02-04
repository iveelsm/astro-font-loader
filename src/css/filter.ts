import { basename } from "node:path";

/**
 * Filters @font-face rules in a CSS string based on a filename filter function.
 *
 * Iterates over all @font-face blocks and removes those for which the filter function returns false
 * for any font file referenced in the block. If no filter is provided, returns the original CSS.
 *
 * @param {string} css - The CSS string containing @font-face rules.
 * @param {(filename: string) => boolean} [filter] - Optional filter function that receives a font filename and returns true to keep the rule, false to remove it.
 * @returns {string} The filtered CSS string with only the allowed @font-face rules.
 */
export function filterCssFontFaces(
	css: string,
	filter?: (filename: string) => boolean,
): string {
	if (!filter) {
		return css;
	}

	return css.replace(/@font-face\s*\{[^}]*\}/g, (match) => {
		const urlMatches = match.matchAll(/url\(["']?\.\/([^"')]+)["']?\)/g);
		for (const urlMatch of urlMatches) {
			const relativePath = urlMatch[1];
			const filename = basename(relativePath);
			if (filter(filename)) {
				return match;
			}
		}
		return "";
	});
}
