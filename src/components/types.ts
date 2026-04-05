export interface PreloadConfig {
	/** Filter function to select which fonts to preload. */
	filter: (filename: string) => boolean;
	/** Optional media query for the preload link (e.g., "(min-width: 641px)"). */
	media?: string;
}
