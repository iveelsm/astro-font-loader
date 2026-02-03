function astroBuildDone({ dir, logger }) => {
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
	}
