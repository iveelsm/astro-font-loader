import { existsSync, readFileSync } from "node:fs";

import type { AstroIntegrationLogger } from "astro";

import { filterCssFontFaces } from "./css/filter.ts";
import { transformCss } from "./css/transform.ts";
import { getAvailableFonts } from "./fonts/available.ts";
import { createVariantFilter } from "./fonts/filter.ts";
import type { FontInfo, FontsPackageInfo } from "./fonts/fontInfo.ts";
import { getFontsPackageInfo } from "./fonts/index.ts";
import type { FontConfig } from "./types.ts";

/**
 * Result of the configuration setup for font loading.
 */
export type ConfigSetupResult = {
	fontsInfoList: FontsPackageInfo[];
	availableFonts: FontInfo[];
	transformedCss: string;
};

/**
 * Sets up font configuration for the Astro integration.
 *
 * Resolves font packages, collects available fonts, applies variant-derived filtering, and transforms CSS.
 */
export function astroConfigSetup(
	logger: AstroIntegrationLogger,
	fonts: FontConfig[],
	outputDirectory: string,
	root?: URL,
): ConfigSetupResult {
	const fontsInfoList: FontsPackageInfo[] = [];
	let availableFonts: FontInfo[] = [];
	let transformedCss = "";

	if (!fonts || fonts.length === 0) {
		logger.warn("No fonts specified. Fonts will not be copied.");
		return { fontsInfoList: [], availableFonts, transformedCss };
	}

	for (const fontConfig of fonts) {
		const { source } = fontConfig;
		const fontsInfo = getFontsPackageInfo(source.package, root, source.styleFile);
		if (!fontsInfo) {
			logger.warn(`${source.package} package not found. Skipping ${fontConfig.family}.`);
			continue;
		}

		fontsInfoList.push(fontsInfo);
		const filter = createVariantFilter(fontConfig);
		let packageFonts = getAvailableFonts(fontsInfo.fontsDir);
		packageFonts = packageFonts.filter((font) => filter(font.filename));

		availableFonts = availableFonts.concat(packageFonts);
		if (existsSync(fontsInfo.cssPath)) {
			let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
			rawCss = filterCssFontFaces(rawCss, filter);
			transformedCss += transformCss(rawCss, outputDirectory, filter);
		}

		logger.info(
			`Loaded ${packageFonts.length} font file(s) for ${fontConfig.family} from ${source.package}`,
		);
	}

	logger.info(`Found ${availableFonts.length} total font file(s) to copy`);

	return { fontsInfoList, availableFonts, transformedCss };
}
