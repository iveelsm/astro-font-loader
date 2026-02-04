import type { AstroIntegration } from "astro";

import { astroBuildDone } from "./astroBuild";
import { astroConfigSetup } from "./astroConfig";
import type { FontInfo } from "./fonts/fontInfo";
import type { FontsIntegrationOptions } from "./integrationOptions";

/**
 * Creates an Astro integration for font loading and transformation.
 *
 * Sets up hooks for Astro's config and build phases to process font files and CSS, using provided options for filtering and output directory.
 *
 * @param {FontsIntegrationOptions} [options={}] - Options for filtering font files and specifying the output directory.
 * @returns {AstroIntegration} The Astro integration object for font loading.
 */
export function fontsIntegration(
	options: FontsIntegrationOptions = {},
): AstroIntegration {
	const { filter, outputDir = "fonts" } = options;

	let fontsInfo: { fontsDir: string; cssPath: string } | null = null;
	let availableFonts: FontInfo[] = [];
	let transformedCss: string = "";

	return {
		name: "astro-font-loader",
		hooks: {
			"astro:config:setup": ({ logger }) => {
				const result = astroConfigSetup(logger, outputDir, filter);
				fontsInfo = result.fontsInfo;
				availableFonts = result.availableFonts;
				transformedCss = result.transformedCss;
			},
			"astro:build:done": ({ dir, logger }) => {
				astroBuildDone(
					dir,
					logger,
					outputDir,
					fontsInfo,
					availableFonts,
				);
			},
		},
	};
}
