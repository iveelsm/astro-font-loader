import type { AstroIntegrationLogger } from "astro";
import type { FontInfo } from "./fonts/fontInfo";

import { join } from "node:path";
import { fileURLToPath } from "url";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";

export function astroBuildDone(
	dir: URL,
	logger: AstroIntegrationLogger,
	outputDir: string,
	fontsInfo: { fontsDir: string; cssPath: string } | null,
	availableFonts: FontInfo[],
): void {
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
			logger.error(`Failed to copy ${font.filename}: ${error}`);
		}
	}

	logger.info(`Copied ${availableFonts.length} font file(s) to ${outputDir}/`);
}
