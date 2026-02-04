import { dirname, join } from "node:path";

import { FontsPackageInfo } from "./fontInfo";

export function getFontsPackageInfo(
	fontsPackage: string,
): FontsPackageInfo | null {
	try {
		const fontsPackagePath = require.resolve(
			`${fontsPackage}/package.json`,
		);
		const fontsDir = dirname(fontsPackagePath);
		const cssPath = join(fontsDir, "src", "index.css");
		return { fontsDir, cssPath };
	} catch {
		return null;
	}
}
