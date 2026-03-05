import { getAvailableFonts } from "./available.ts";
import type {
	FontInfo,
	FontsPackageInfo,
	NetworkFontInfo,
} from "./fontInfo.ts";
import {
	deriveFilenameFromUrl,
	downloadFont,
	extractFontUrlsFromCss,
	fetchCssFontSource,
	fetchDirectFontSource,
} from "./network.ts";
import { getFontsPackageInfo } from "./package.ts";

export type { FontInfo, FontsPackageInfo, NetworkFontInfo };

export {
	getFontsPackageInfo,
	getAvailableFonts,
	extractFontUrlsFromCss,
	deriveFilenameFromUrl,
	downloadFont,
	fetchCssFontSource,
	fetchDirectFontSource,
};
