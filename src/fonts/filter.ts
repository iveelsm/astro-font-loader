import type { FontConfig } from "../types.ts";

/**
 * Creates a filter function from a FontConfig's variant definitions.
 *
 * Returns true for filenames that match any variant's name (case-insensitive)
 * and have a file extension matching the variant's formats (defaults to ["woff2"]).
 */
export function createVariantFilter(fontConfig: FontConfig): (filename: string) => boolean {
	return (filename: string) => {
		const lowerFilename = filename.toLowerCase();
		return fontConfig.variants.some((variant) => {
			const nameMatch = lowerFilename.includes(variant.name.toLowerCase());
			const formats = variant.formats ?? ["woff2"];
			const ext = lowerFilename.split(".").pop() ?? "";
			const formatMatch = formats.includes(ext);
			return nameMatch && formatMatch;
		});
	};
}
