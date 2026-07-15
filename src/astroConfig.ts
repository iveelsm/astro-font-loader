import type { AstroIntegrationLogger } from "astro";

import type { FontInfo } from "./fonts/fontInfo.ts";
import { createFontProvider } from "./providers/index.ts";
import type { FontConfig } from "./types.ts";

/**
 * Result of the configuration setup for font loading.
 */
export type ConfigSetupResult = {
	availableFonts: FontInfo[];
};

/**
 * Sets up font configuration for the Astro integration.
 *
 * Resolves font providers and collects available fonts by matching CSS metadata.
 */
export function astroConfigSetup(
	logger: AstroIntegrationLogger,
	fonts: FontConfig[],
	outputDirectory: string,
	root?: URL,
): ConfigSetupResult {
	let availableFonts: FontInfo[] = [];

	if (!fonts || fonts.length === 0) {
		logger.warn("No fonts specified. Fonts will not be copied.");
		return { availableFonts };
	}

	for (const fontConfig of fonts) {
		const provider = createFontProvider(fontConfig.source, root);
		if (!provider) {
			logger.warn(`Could not resolve font source for ${fontConfig.family}. Skipping.`);
			continue;
		}

		for (const variant of fontConfig.variants) {
			const result = provider.resolveVariant(variant, outputDirectory);
			availableFonts = availableFonts.concat(result.fonts);

			logger.info(`Loaded ${result.fonts.length} font file(s) for ${fontConfig.family} (${variant.name})`);
		}
	}

	logger.info(`Found ${availableFonts.length} total font file(s) to copy`);

	return { availableFonts };
}
