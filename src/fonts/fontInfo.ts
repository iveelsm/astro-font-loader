/**
 * Information about a single font file.
 * @property {string} filename - The name of the font file.
 * @property {string} sourcePath - The absolute path to the font file on disk.
 * @property {string} relativePath - The path to the font file relative to the package or project.
 * @property {string} [sourceUrl] - The original URL the font was downloaded from (network fonts only).
 */
export type FontInfo = {
	filename: string;
	sourcePath: string;
	relativePath: string;
	sourceUrl?: string;
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

/**
 * Information about a resolved network font source.
 * @property {FontInfo[]} fonts - Downloaded fonts with sourcePath pointing to cache.
 * @property {string} css - Raw CSS content (already fetched or user-provided).
 */
export type NetworkFontInfo = {
	fonts: FontInfo[];
	css: string;
};
