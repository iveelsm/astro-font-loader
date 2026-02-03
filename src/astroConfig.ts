function astroConfigSetup({ logger }) => {
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
			}
