import type { AstroIntegrationLogger } from "astro";
import type { FontInfo } from "./fonts/fontInfo";

import { existsSync, readFileSync } from "node:fs";

import { getAvailableFonts } from "./fonts/available";
import { getFontsPackageInfo } from "./fonts";
import { filterCssFontFaces } from "./css/filter";
import { transformCss } from "./css/transform";

export type ConfigSetupResult = {
	fontsInfo: { fontsDir: string; cssPath: string } | null;
	availableFonts: FontInfo[];
	transformedCss: string;
};

export function astroConfigSetup(
	logger: AstroIntegrationLogger,
	outputDir: string,
	filter?: (filename: string) => boolean,
): ConfigSetupResult {
	let fontsInfo = getFontsPackageInfo("@iveelsm/fonts");
	let availableFonts: FontInfo[] = [];
	let transformedCss = "";

	if (!fontsInfo) {
		logger.warn(
			"@iveelsm/fonts package not found. Fonts will not be copied.",
		);
		return { fontsInfo: null, availableFonts, transformedCss };
	}

	availableFonts = getAvailableFonts(fontsInfo.fontsDir);

	if (filter) {
		availableFonts = availableFonts.filter((font) => filter(font.filename));
	}

	logger.info(`Found ${availableFonts.length} font file(s) to copy`);

	if (existsSync(fontsInfo.cssPath)) {
		let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
		rawCss = filterCssFontFaces(rawCss, filter);
		transformedCss = transformCss(rawCss, outputDir, filter);
	}

	return { fontsInfo, availableFonts, transformedCss };
}
