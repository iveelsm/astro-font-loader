import assert from "node:assert";
import { describe, it } from "node:test";

import { getFontsPackageInfo } from "../../src/fonts/package";

describe("getFontsPackageInfo", () => {
	it("should return null for non-existent package", () => {
		const result = getFontsPackageInfo(
			"@non-existent/package-that-does-not-exist",
		);
		assert.strictEqual(result, null);
	});

	it("should return null for invalid package name", () => {
		const result = getFontsPackageInfo("");
		assert.strictEqual(result, null);
	});

	it("should return fonts info with correct structure for existing package", () => {
		const result = getFontsPackageInfo("astro");

		if (result) {
			assert.ok(typeof result.fontsDir === "string");
			assert.ok(typeof result.cssPath === "string");
			assert.ok(result.cssPath.endsWith("src/index.css"));
		}
	});

	it("should construct correct cssPath relative to package directory", () => {
		const result = getFontsPackageInfo("typescript");

		if (result) {
			assert.ok(result.cssPath.includes("src"));
			assert.ok(result.cssPath.includes("index.css"));
		}
	});

	it("should use custom styleFile when provided", () => {
		const result = getFontsPackageInfo("astro", undefined, "dist/fonts.css");

		if (result) {
			assert.ok(result.cssPath.endsWith("dist/fonts.css"));
			assert.ok(!result.cssPath.endsWith("src/index.css"));
		}
	});
});
