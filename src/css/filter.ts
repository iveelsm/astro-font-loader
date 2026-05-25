import { basename } from "node:path";

import type { FontVariant } from "../types.ts";

/**
 * Parses a @font-face block and extracts its metadata.
 */
function parseFontFace(block: string) {
	const familyMatch = block.match(/font-family:\s*["']([^"']+)["']/);
	const weightMatch = block.match(/font-weight:\s*(\d+(?:\s+\d+)?)/);
	const styleMatch = block.match(/font-style:\s*(\w+)/);
	const urlMatches = [...block.matchAll(/url\(["']?\.\/([^"')]+)["']?\)/g)];

	const family = familyMatch?.[1] ?? "";
	const style = styleMatch?.[1] ?? "normal";

	let weight: number | [number, number] = 400;
	if (weightMatch) {
		const parts = weightMatch[1].split(/\s+/).map(Number);
		weight = parts.length === 2 ? [parts[0], parts[1]] : parts[0];
	}

	const filenames = urlMatches.map((m) => basename(m[1]));

	return { family, weight, style, filenames };
}

/**
 * Checks if a CSS font-weight matches a variant weight.
 *
 * A single weight matches if equal. A range matches if any overlap exists.
 */
function weightMatches(
	cssWeight: number | [number, number],
	variantWeight: number | [number, number],
): boolean {
	const [cssMin, cssMax] = Array.isArray(cssWeight) ? cssWeight : [cssWeight, cssWeight];
	const [varMin, varMax] = Array.isArray(variantWeight) ? variantWeight : [variantWeight, variantWeight];
	return cssMin <= varMax && varMin <= cssMax;
}

/**
 * Result of matching @font-face blocks against font variants.
 */
export type CssMatchResult = {
	css: string;
	filenames: string[];
};

/**
 * Filters @font-face blocks by matching their font-family, font-weight, and font-style
 * against the provided variant definitions.
 *
 * Returns the matched CSS blocks and the font filenames they reference.
 */
export function matchCssFontFaces(
	css: string,
	name: string,
	variants: FontVariant[],
): CssMatchResult {
	const filenameSet = new Set<string>();
	const formats = new Set(variants.flatMap((v) => v.formats ?? ["woff2"]));

	const filtered = css.replace(/@font-face\s*\{[^}]*\}/g, (block) => {
		const parsed = parseFontFace(block);

		if (parsed.family.toLowerCase() !== name.toLowerCase()) {
			return "";
		}

		const matches = variants.some(
			(v) =>
				weightMatches(parsed.weight, v.weight) &&
				v.styles.includes(parsed.style),
		);

		if (!matches) {
			return "";
		}

		for (const filename of parsed.filenames) {
			const ext = filename.split(".").pop()?.toLowerCase() ?? "";
			if (formats.has(ext)) {
				filenameSet.add(filename);
			}
		}

		return block;
	});

	return { css: filtered, filenames: [...filenameSet] };
}
