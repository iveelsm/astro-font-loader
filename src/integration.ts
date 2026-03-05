import type { AstroIntegration } from "astro";

import { astroBuildDone } from "./astroBuild.ts";
import { astroConfigSetup } from "./astroConfig.ts";
import type { FontInfo } from "./fonts/fontInfo.ts";

/**
 * A URL that returns CSS containing @font-face rules with absolute font URLs.
 * Use this for services like Google Fonts that serve CSS with embedded font references.
 *
 * @example { type: "css", url: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700" }
 */
export type CssFontSource = {
	type: "css";
	/** URL that returns CSS containing @font-face rules. */
	url: string;
};

/**
 * Direct font file URLs paired with user-provided CSS.
 * Use this when you have explicit font file URLs and want to supply your own @font-face rules.
 *
 * @example { type: "direct", fonts: ["https://example.com/fonts/MyFont.woff2"], css: "@font-face { ... }" }
 */
export type DirectFontSource = {
	type: "direct";
	/** Array of direct URLs to font files (.woff2, .woff, .ttf, etc.). */
	fonts: string[];
	/** Raw CSS string containing @font-face rules that reference these fonts. */
	css: string;
};

/**
 * A network font source, either a CSS URL or direct font file URLs.
 */
export type FontUrlSource = CssFontSource | DirectFontSource;

/**
 * Options for integrating fonts into a build process.
 *
 * Allows specifying font packages (NPM) and/or network URLs to load,
 * a filter function to select which font files to include,
 * and the output directory name for copied fonts.
 * At least one of `packages` or `urls` must be provided.
 * If no filter is provided, all fonts are included. The output directory defaults to "fonts".
 */
export type FontsIntegrationOptions = {
	/**
	 * Array of font package names to load from NPM.
	 * Each package should export fonts in a standard structure with a src/index.css file.
	 * @example ['@iveelsm/fonts', '@fontsource/roboto']
	 */
	packages?: string[];
	/**
	 * Array of network font sources to download at build time.
	 * Fonts are downloaded and provisioned into the build output alongside NPM package fonts.
	 */
	urls?: FontUrlSource[];
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
	/**
	 * Directory to cache downloaded network fonts.
	 * Defaults to "node_modules/.cache/astro-font-loader" relative to the project root.
	 */
	cacheDir?: string;
};

/**
 * Creates an Astro integration for font loading and transformation.
 *
 * Sets up hooks for Astro's config and build phases to process font files and CSS, using provided options for filtering and output directory.
 *
 * @param {FontsIntegrationOptions} options - Options for font sources, filtering, and output directory.
 * @returns {AstroIntegration} The Astro integration object for font loading.
 */
export function fontsIntegration(
	options: FontsIntegrationOptions,
): AstroIntegration {
	const {
		packages = [],
		urls = [],
		filter,
		outputDir = "fonts",
		cacheDir,
	} = options;

	let availableFonts: FontInfo[] = [];

	return {
		name: "astro-font-loader",
		hooks: {
			"astro:config:setup": async ({ config, logger }) => {
				const result = await astroConfigSetup(
					logger,
					packages,
					urls,
					outputDir,
					filter,
					config.root,
					cacheDir,
				);
				availableFonts = result.availableFonts;
			},
			"astro:build:done": ({ dir, logger }) => {
				astroBuildDone(dir, logger, outputDir, availableFonts);
			},
		},
	};
}
