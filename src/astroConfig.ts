import { getAvailableFonts } from "./fonts/available";

import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { filterCssFontFaces } from "./css/filter";
import { transformCss } from "./css/transform";
import { getFontsPackageInfo } from "./fonts";


function astroConfigSetup({ logger }){
	const fontsInfo = getFontsPackageInfo();

	if (!fontsInfo) {
		logger.warn(
			"@iveelsm/fonts package not found. Fonts will not be copied.",
		);
		return;
	}

	const availableFonts = getAvailableFonts(fontsInfo.fontsDir);

	if (filter) {
		availableFonts = availableFonts.filter((font) =>
			filter(font.filename),
		);
	}

	logger.info(
		`Found ${availableFonts.length} font file(s) to copy`,
	);

	// Read and transform CSS
	if (existsSync(fontsInfo.cssPath)) {
		let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
		// First filter out unwanted @font-face blocks
		rawCss = filterCssFontFaces(rawCss, filter);
		// Then transform the remaining URLs
		transformedCss = transformCss(rawCss, outputDir, filter);
	}
}
