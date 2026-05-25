import assert from "node:assert";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";

import { getAvailableFonts } from "../../src/fonts/available";

describe("getAvailableFonts", () => {
	let testDir: string;

	beforeEach(() => {
		testDir = join(tmpdir(), `font-test-${Date.now()}`);
		mkdirSync(testDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(testDir, { recursive: true, force: true });
	});

	it("should return empty array when src directory does not exist", () => {
		const result = getAvailableFonts(testDir);
		assert.deepStrictEqual(result, []);
	});

	it("should find font files in the src directory", () => {
		const srcDir = join(testDir, "src");
		mkdirSync(srcDir, { recursive: true });
		writeFileSync(join(srcDir, "test.woff2"), "");
		writeFileSync(join(srcDir, "test.ttf"), "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 2);
		assert.ok(result.some((f) => f.filename === "test.woff2"));
		assert.ok(result.some((f) => f.filename === "test.ttf"));
	});

	it("should find font files in subdirectories", () => {
		const srcDir = join(testDir, "src");
		const robotoDir = join(srcDir, "Roboto");
		mkdirSync(robotoDir, { recursive: true });
		writeFileSync(join(robotoDir, "Roboto-Regular.woff2"), "");
		writeFileSync(join(robotoDir, "Roboto-Bold.woff2"), "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 2);
		assert.ok(result.some((f) => f.filename === "Roboto-Regular.woff2"));
		assert.ok(result.some((f) => f.filename === "Roboto-Bold.woff2"));
	});

	it("should include correct relative paths for fonts in subdirectories", () => {
		const srcDir = join(testDir, "src");
		const robotoDir = join(srcDir, "Roboto");
		mkdirSync(robotoDir, { recursive: true });
		writeFileSync(join(robotoDir, "Roboto-Regular.woff2"), "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].relativePath, "Roboto/Roboto-Regular.woff2");
	});

	it("should include correct relative paths for fonts in root src", () => {
		const srcDir = join(testDir, "src");
		mkdirSync(srcDir, { recursive: true });
		writeFileSync(join(srcDir, "font.woff2"), "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].relativePath, "font.woff2");
	});

	it("should only include valid font file extensions", () => {
		const srcDir = join(testDir, "src");
		mkdirSync(srcDir, { recursive: true });
		writeFileSync(join(srcDir, "font.woff2"), "");
		writeFileSync(join(srcDir, "font.woff"), "");
		writeFileSync(join(srcDir, "font.ttf"), "");
		writeFileSync(join(srcDir, "font.otf"), "");
		writeFileSync(join(srcDir, "font.eot"), "");
		writeFileSync(join(srcDir, "font.css"), "");
		writeFileSync(join(srcDir, "font.txt"), "");
		writeFileSync(join(srcDir, "README.md"), "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 5);
		const filenames = result.map((f) => f.filename);
		assert.ok(filenames.includes("font.woff2"));
		assert.ok(filenames.includes("font.woff"));
		assert.ok(filenames.includes("font.ttf"));
		assert.ok(filenames.includes("font.otf"));
		assert.ok(filenames.includes("font.eot"));
		assert.ok(!filenames.includes("font.css"));
		assert.ok(!filenames.includes("font.txt"));
	});

	it("should handle case-insensitive font extensions", () => {
		const srcDir = join(testDir, "src");
		mkdirSync(srcDir, { recursive: true });
		writeFileSync(join(srcDir, "font.WOFF2"), "");
		writeFileSync(join(srcDir, "font.TTF"), "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 2);
	});

	it("should include correct source paths", () => {
		const srcDir = join(testDir, "src");
		mkdirSync(srcDir, { recursive: true });
		const fontPath = join(srcDir, "test.woff2");
		writeFileSync(fontPath, "");

		const result = getAvailableFonts(testDir);

		assert.strictEqual(result.length, 1);
		assert.strictEqual(result[0].sourcePath, fontPath);
	});
});
