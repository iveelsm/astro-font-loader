import { existsSync, readFileSync } from "node:fs";

import type { AstroIntegrationLogger } from "astro";

import { filterCssFontFaces } from "./css/filter.ts";
import { transformCss } from "./css/transform.ts";
import { getAvailableFonts } from "./fonts/available.ts";
import type { FontInfo, FontsPackageInfo } from "./fonts/fontInfo.ts";
import { getFontsPackageInfo } from "./fonts/index.ts";

/**
 * Result of the configuration setup for font loading.
 *
 * @property {Array<FontsPackageInfo>} fontsInfoList - List of font package information objects.
 * @property {FontInfo[]} availableFonts - Array of available font files from all packages.
 * @property {string} transformedCss - The combined and transformed CSS from all packages.
 */
export type ConfigSetupResult = {
	fontsInfoList: FontsPackageInfo[];
	availableFonts: FontInfo[];
	transformedCss: string;
};

/**
 * Sets up font configuration for the Astro integration.
 *
 * Resolves font packages, collects available fonts, applies optional filtering, and transforms CSS.
 *
 * @param {AstroIntegrationLogger} logger - The Astro integration logger for outputting messages.
 * @param {string[]} packages - Array of font package names to load.
 * @param {string} outputDir - The output directory for font files.
 * @param {(filename: string) => boolean} [filter] - Optional filter function to select font files.
 * @param {URL} [root] - Optional root directory to resolve packages from.
 * @returns {ConfigSetupResult} The result containing font info, available fonts, and transformed CSS.
 */
export function astroConfigSetup(
	logger: AstroIntegrationLogger,
	packages: string[],
	outputDir: string,
	filter?: (filename: string) => boolean,
	root?: URL,
): ConfigSetupResult {
	const fontsInfoList: FontsPackageInfo[] = [];
	let availableFonts: FontInfo[] = [];
	let transformedCss = "";

	if (!packages || packages.length === 0) {
		logger.warn("No font packages specified. Fonts will not be copied.");
		return { fontsInfoList: [], availableFonts, transformedCss };
	}

	for (const packageName of packages) {
		const fontsInfo = getFontsPackageInfo(packageName, root);
		if (!fontsInfo) {
			logger.warn(`${packageName} package not found. Skipping.`);
			continue;
		}

		fontsInfoList.push(fontsInfo);
		let packageFonts = getAvailableFonts(fontsInfo.fontsDir);
		if (filter) {
			packageFonts = packageFonts.filter((font) => filter(font.filename));
		}

		availableFonts = availableFonts.concat(packageFonts);
		if (existsSync(fontsInfo.cssPath)) {
			let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
			rawCss = filterCssFontFaces(rawCss, filter);
			transformedCss += transformCss(rawCss, outputDir, filter);
		}

		logger.info(
			`Loaded ${packageFonts.length} font file(s) from ${packageName}`,
		);
	}

	logger.info(`Found ${availableFonts.length} total font file(s) to copy`);

	return { fontsInfoList, availableFonts, transformedCss };
}
