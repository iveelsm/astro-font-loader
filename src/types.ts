/**
 * Top-level configuration for the font loader integration.
 */
export type FontLoaderConfig = {
	outputDirectory: string;
	fonts: FontConfig[];
};

/**
 * Configuration for a single font family.
 */
export type FontConfig = {
	family: string;
	source: FontSource;
	variants: FontVariant[];
};

/**
 * Font source provider. Currently only supports package providers,
 * but will be extended with local and network providers.
 */
export type FontSource = PackageProvider;

/**
 * Resolves font files from an installed npm package.
 */
export type PackageProvider = {
	type: "package";
	package: string;
	/** Path to the CSS file relative to the package root. Defaults to "src/index.css". */
	styleFile?: string;
};

/**
 * A specific font variant to load.
 */
export type FontVariant = {
	/** The CSS font-family name to match in @font-face rules (case-insensitive). */
	name: string;
	/** Font weight as a single value or a [min, max] range for variable fonts. */
	weight: number | [number, number];
	/** Font styles to match, e.g. ["normal", "italic"]. */
	styles: string[];
	/** File formats to include. Defaults to ["woff2"]. */
	formats?: string[];
};
