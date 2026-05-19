import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AstroIntegrationLogger } from "astro";

import { filterCssFontFaces } from "./css/filter.ts";
import { transformCss } from "./css/transform.ts";
import { transformNetworkCss } from "./css/transformNetwork.ts";
import { getAvailableFonts } from "./fonts/available.ts";
import type { FontInfo, FontsPackageInfo } from "./fonts/fontInfo.ts";
import { getFontsPackageInfo } from "./fonts/index.ts";
import { fetchCssFontSource, fetchDirectFontSource } from "./fonts/network.ts";
import type { FontUrlSource } from "./integration.ts";

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
 * Resolves font packages and network URL sources, collects available fonts,
 * applies optional filtering, and transforms CSS.
 *
 * @param {AstroIntegrationLogger} logger - The Astro integration logger for outputting messages.
 * @param {string[]} packages - Array of font package names to load.
 * @param {FontUrlSource[]} urls - Array of network font sources.
 * @param {string} outputDir - The output directory for font files.
 * @param {(filename: string) => boolean} [filter] - Optional filter function to select font files.
 * @param {URL} [root] - Optional root directory to resolve packages from.
 * @param {string} [cacheDir] - Optional cache directory for downloaded fonts.
 * @returns {Promise<ConfigSetupResult>} The result containing font info, available fonts, and transformed CSS.
 */
export async function astroConfigSetup(
	logger: AstroIntegrationLogger,
	packages: string[],
	urls: FontUrlSource[],
	outputDir: string,
	filter?: (filename: string) => boolean,
	root?: URL,
	cacheDir?: string,
): Promise<ConfigSetupResult> {
	const fontsInfoList: FontsPackageInfo[] = [];
	let availableFonts: FontInfo[] = [];
	let transformedCss = "";

	if (packages.length === 0 && urls.length === 0) {
		logger.warn("No font packages or URLs specified. Fonts will not be loaded.");
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

	if (urls.length > 0) {
		const resolvedCacheDir = resolveCacheDir(cacheDir, root);
		mkdirSync(resolvedCacheDir, { recursive: true });

		for (const source of urls) {
			try {
				if (source.type === "css") {
					logger.info(`Fetching font CSS from ${source.url}`);
					const networkInfo = await fetchCssFontSource(
						source.url,
						resolvedCacheDir,
						filter,
					);
					availableFonts = availableFonts.concat(networkInfo.fonts);
					transformedCss += transformNetworkCss(
						filterCssFontFaces(networkInfo.css, filter),
						outputDir,
						networkInfo.fonts,
					);
					logger.info(`Loaded ${networkInfo.fonts.length} font file(s) from ${source.url}`);
				} else {
					logger.info(`Downloading ${source.fonts.length} direct font file(s)`);
					const networkInfo = await fetchDirectFontSource(
						source.fonts,
						source.css,
						resolvedCacheDir,
						filter,
					);
					availableFonts = availableFonts.concat(networkInfo.fonts);
					transformedCss += transformNetworkCss(
						filterCssFontFaces(networkInfo.css, filter),
						outputDir,
						networkInfo.fonts,
					);
					logger.info(`Loaded ${networkInfo.fonts.length} direct font file(s)`);
				}
			} catch (error) {
				logger.error(`Failed to process network font source: ${error}`);
			}
		}
	}

	logger.info(`Found ${availableFonts.length} total font file(s) to copy`);
	return { fontsInfoList, availableFonts, transformedCss };
}

function resolveCacheDir(cacheDir?: string, root?: URL): string {
	if (cacheDir) {
		return cacheDir;
	}

	const rootPath = root ? fileURLToPath(root) : process.cwd();
	return join(rootPath, "node_modules", ".cache", "astro-font-loader");
}
