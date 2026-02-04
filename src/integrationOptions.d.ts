
/**
 * Options for integrating fonts into a build process.
 *
 * Allows specifying a filter function to select which font files to include and the output directory name for copied fonts.
 * If no filter is provided, all fonts are included. The output directory defaults to "fonts".
 *
 * @property {(filename: string) => boolean} [filter] - Optional filter function to select font files by filename.
 * @property {string} [outputDir] - Optional output directory name within the build folder. Defaults to "fonts".
 */
export type FontsIntegrationOptions = {
	/**
	 * Filter function to select which font files to copy.
	 * Receives the font filename and should return true to include the font.
	 * If not provided, all fonts are copied.
	 */
	filter?: (filename: string) => boolean;
	/**
	 * Output directory name within the build folder.
	 * Defaults to "fonts"
	 */
	outputDir?: string;
};
