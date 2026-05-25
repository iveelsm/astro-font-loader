import type { AstroIntegration } from "astro";

import { astroBuildDone } from "./astroBuild.ts";
import { astroConfigSetup } from "./astroConfig.ts";
import type { FontInfo } from "./fonts/fontInfo.ts";
import type { FontLoaderConfig } from "./types.ts";

/**
 * Creates an Astro integration for font loading and transformation.
 *
 * Sets up hooks for Astro's config and build phases to process font files and CSS.
 */
export function fontsIntegration(config: FontLoaderConfig): AstroIntegration {
	const { fonts, outputDirectory } = config;

	let availableFonts: FontInfo[] = [];

	return {
		name: "astro-font-loader",
		hooks: {
			"astro:config:setup": ({ config: astroConfig, logger }) => {
				const result = astroConfigSetup(logger, fonts, outputDirectory, astroConfig.root);
				availableFonts = result.availableFonts;
			},
			"astro:build:done": ({ dir, logger }) => {
				astroBuildDone(dir, logger, outputDirectory, availableFonts);
			},
		},
	};
}
