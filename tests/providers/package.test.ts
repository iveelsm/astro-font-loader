import assert from "node:assert";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { createPackageProvider } from "../../src/providers/package";

describe("createPackageProvider", () => {
	let testDir: string;
	let fontsDir: string;
	let srcDir: string;

	beforeEach(() => {
		testDir = join(tmpdir(), `provider-test-${Date.now()}`);
		fontsDir = join(testDir, "node_modules", "test-fonts");
		srcDir = join(fontsDir, "src");
		mkdirSync(srcDir, { recursive: true });

		// Create a minimal package.json so require.resolve works
		writeFileSync(join(fontsDir, "package.json"), JSON.stringify({ name: "test-fonts" }));
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it("should return null for a non-existent package", () => {
		const provider = createPackageProvider({ type: "package", package: "non-existent-font-package" });
		assert.strictEqual(provider, null);
	});

	it("should return a provider for a valid package", () => {
		writeFileSync(join(srcDir, "index.css"), "");

		const provider = createPackageProvider({ type: "package", package: "test-fonts" }, testDir);
		assert.notStrictEqual(provider, null);
		assert.strictEqual(typeof provider?.resolveVariant, "function");
	});

	it("should resolve variant fonts from a package", () => {
		const fontSubDir = join(srcDir, "TestFont");
		mkdirSync(fontSubDir, { recursive: true });
		writeFileSync(join(fontSubDir, "TestFont-Regular.woff2"), "fake-font-data");
		writeFileSync(
			join(srcDir, "index.css"),
			`@font-face {
	font-family: "Test Font";
	font-weight: 400;
	font-style: normal;
	src: url("./TestFont/TestFont-Regular.woff2") format("woff2");
}`,
		);

		const provider = createPackageProvider({ type: "package", package: "test-fonts" }, testDir);
		assert.notStrictEqual(provider, null);

		const result = provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "TestFont-Regular.woff2");
		assert.ok(result.css.length > 0);
	});

	it("should return empty results for unmatched variants", () => {
		writeFileSync(
			join(srcDir, "index.css"),
			`@font-face {
	font-family: "Test Font";
	font-weight: 400;
	font-style: normal;
	src: url("./TestFont-Regular.woff2") format("woff2");
}`,
		);

		const provider = createPackageProvider({ type: "package", package: "test-fonts" }, testDir);
		assert.notStrictEqual(provider, null);

		const result = provider!.resolveVariant({ name: "Other Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 0);
		assert.strictEqual(result.css, "");
	});
});
