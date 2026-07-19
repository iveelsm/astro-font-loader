import type { FontInfo } from "../fonts/fontInfo.ts";
import type { FontSource, FontVariant } from "../types.ts";
import { createPackageProvider } from "./package.ts";

/**
 * Result of resolving a single font variant from a provider.
 */
export type FontProviderResult = {
	/** Processed CSS containing matched @font-face rules. */
	css: string;
	/** Font files matched for this variant. */
	fonts: FontInfo[];
};

/**
 * A resolved font provider that can supply CSS and font files for variants.
 */
export type FontProvider = {
	/** Resolves a variant to its CSS and matched font files. */
	resolveVariant(variant: FontVariant, outputDirectory: string): FontProviderResult;
};

export { createPackageProvider };

/**
 * Creates a font provider for the given source configuration.
 *
 * Returns null if the source cannot be resolved.
 */
export function createFontProvider(source: FontSource, root?: URL | string): FontProvider | null {
	switch (source.type) {
		case "package":
			return createPackageProvider(source, root);
	}
}
