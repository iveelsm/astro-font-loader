import type { AstroIntegrationLogger } from "astro";

import { getFontsCss } from "./css/get.ts";
import type { FontInfo, FontsPackageInfo } from "./fonts/fontInfo.ts";
import { getAvailableFonts } from "./fonts/available.ts";
import { getFontsPackageInfo } from "./fonts/index.ts";
import type { FontConfig } from "./types.ts";

/**
 * Result of the configuration setup for font loading.
 */
export type ConfigSetupResult = {
	fontsInfoList: FontsPackageInfo[];
	availableFonts: FontInfo[];
};

/**
 * Sets up font configuration for the Astro integration.
 *
 * Resolves font packages, collects available fonts by matching CSS metadata.
 */
export function astroConfigSetup(
	logger: AstroIntegrationLogger,
	fonts: FontConfig[],
	outputDirectory: string,
	root?: URL,
): ConfigSetupResult {
	const fontsInfoList: FontsPackageInfo[] = [];
	let availableFonts: FontInfo[] = [];

	if (!fonts || fonts.length === 0) {
		logger.warn("No fonts specified. Fonts will not be copied.");
		return { fontsInfoList: [], availableFonts };
	}

	for (const fontConfig of fonts) {
		const { source } = fontConfig;
		const fontsInfo = getFontsPackageInfo(source.package, root, source.styleFile);
		if (!fontsInfo) {
			logger.warn(`${source.package} package not found. Skipping ${fontConfig.family}.`);
			continue;
		}

		fontsInfoList.push(fontsInfo);

		for (const variant of fontConfig.variants) {
			const result = getFontsCss(
				{ name: variant.name, variants: [variant], outputDirectory },
				fontsInfo,
			);

			const allPackageFonts = getAvailableFonts(fontsInfo.fontsDir);
			const matchedFonts = allPackageFonts.filter((f) =>
				result.filenames.includes(f.filename),
			);
			availableFonts = availableFonts.concat(matchedFonts);

			logger.info(
				`Loaded ${matchedFonts.length} font file(s) for ${fontConfig.family} (${variant.name}) from ${source.package}`,
			);
		}
	}

	logger.info(`Found ${availableFonts.length} total font file(s) to copy`);

	return { fontsInfoList, availableFonts };
}
