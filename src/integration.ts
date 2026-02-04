import { AstroIntegration } from "astro";
import { FontsIntegrationOptions } from "./integrationOptions";
import { FontInfo } from "./fonts/fontInfo";
import { getAvailableFonts } from "./fonts/available";

import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { filterCssFontFaces } from "./css/filter";
import { transformCss } from "./css/transform";

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
				fontsInfo = getFontsPackageInfo();

				if (!fontsInfo) {
					logger.warn(
						"@iveelsm/fonts package not found. Fonts will not be copied.",
					);
					return;
				}

				availableFonts = getAvailableFonts(fontsInfo.fontsDir);

				if (filter) {
					availableFonts = availableFonts.filter((font) =>
						filter(font.filename),
					);
				}

				logger.info(
					`Found ${availableFonts.length} font file(s) to copy`,
				);

				if (existsSync(fontsInfo.cssPath)) {
					let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
					rawCss = filterCssFontFaces(rawCss, filter);
					transformedCss = transformCss(rawCss, outputDir, filter);
				}
			},
			"astro:build:done": ({ dir, logger }) => {
				if (!fontsInfo || availableFonts.length === 0) {
					return;
				}

				const outputPath = fileURLToPath(new URL(outputDir, dir));

				if (!existsSync(outputPath)) {
					mkdirSync(outputPath, { recursive: true });
				}

				for (const font of availableFonts) {
					const destPath = join(outputPath, font.filename);
					try {
						copyFileSync(font.sourcePath, destPath);
						logger.info(`Copied ${font.filename}`);
					} catch (error) {
						logger.error(
							`Failed to copy ${font.filename}: ${error}`,
						);
					}
				}

				logger.info(
					`Copied ${availableFonts.length} font file(s) to ${outputDir}/`,
				);
			},
		},
	};
}
