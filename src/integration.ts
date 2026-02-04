import type { AstroIntegration } from "astro";

import { astroBuildDone } from "./astroBuild.ts";
import { astroConfigSetup } from "./astroConfig.ts";
import type { FontInfo } from "./fonts/fontInfo.ts";

/**
 * Options for integrating fonts into a build process.
 *
 * Allows specifying font packages to load, a filter function to select which font files to include,
 * and the output directory name for copied fonts.
 * If no filter is provided, all fonts are included. The output directory defaults to "fonts".
 *
 * @property {string[]} [packages] - Array of font package names to load. Required.
 * @property {(filename: string) => boolean} [filter] - Optional filter function to select font files by filename.
 * @property {string} [outputDir] - Optional output directory name within the build folder. Defaults to "fonts".
 */
export type FontsIntegrationOptions = {
	/**
	 * Array of font package names to load.
	 * Each package should export fonts in a standard structure with a src/index.css file.
	 * @example ['@iveelsm/fonts', '@fontsource/roboto']
	 */
	packages: string[];
	/**
	 * Filter function to select which font files to copy.
	 * Receives the font filename and should return true to include the font.
	 * If not provided, all fonts are copied.
	 */
	filter?: (filename: string) => boolean;
	/**
	 * Output directory name within the build folder.
	 * Defaults to "fonts"
	 */
	outputDir?: string;
};

/**
 * Creates an Astro integration for font loading and transformation.
 *
 * Sets up hooks for Astro's config and build phases to process font files and CSS, using provided options for filtering and output directory.
 *
 * @param {FontsIntegrationOptions} [options={}] - Options for filtering font files and specifying the output directory.
 * @returns {AstroIntegration} The Astro integration object for font loading.
 */
export function fontsIntegration(
	options: FontsIntegrationOptions,
): AstroIntegration {
	const { packages, filter, outputDir = "fonts" } = options;

	let availableFonts: FontInfo[] = [];

	return {
		name: "astro-font-loader",
		hooks: {
			"astro:config:setup": ({ config, logger }) => {
				const result = astroConfigSetup(
					logger,
					packages,
					outputDir,
					filter,
					config.root,
				);
				availableFonts = result.availableFonts;
			},
			"astro:build:done": ({ dir, logger }) => {
				astroBuildDone(dir, logger, outputDir, availableFonts);
			},
		},
	};
}
