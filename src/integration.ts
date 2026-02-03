export function fontsIntegration(
	options: FontsIntegrationOptions = {},
): AstroIntegration {
	const { filter, outputDir = "fonts" } = options;

	let fontsInfo: { fontsDir: string; cssPath: string } | null = null;
	let availableFonts: FontInfo[] = [];
	let transformedCss: string = "";

	return {
		name: "fonts-integration",
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

				// Read and transform CSS
				if (existsSync(fontsInfo.cssPath)) {
					let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
					// First filter out unwanted @font-face blocks
					rawCss = filterCssFontFaces(rawCss, filter);
					// Then transform the remaining URLs
					transformedCss = transformCss(rawCss, outputDir, filter);
				}
			},
			"astro:build:done": ({ dir, logger }) => {
				if (!fontsInfo || availableFonts.length === 0) {
					return;
				}

				const outputPath = fileURLToPath(new URL(outputDir, dir));

				// Create the fonts directory
				if (!existsSync(outputPath)) {
					mkdirSync(outputPath, { recursive: true });
				}

				// Copy each font file
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
