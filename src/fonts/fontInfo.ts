/**
 * Information about a single font file.
 * @property {string} filename - The name of the font file.
 * @property {string} sourcePath - The absolute path to the font file on disk.
 * @property {string} relativePath - The path to the font file relative to the package or project.
 */
export type FontInfo = {
	filename: string;
	sourcePath: string;
	relativePath: string;
};

/**
 * Information about a font package, including directory and CSS file location.
 * @property {string} fontsDir - The directory containing font files.
 * @property {string} cssPath - The path to the CSS file for the font package.
 */
export type FontsPackageInfo = {
	fontsDir: string;
	cssPath: string;
};
