import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { filterCssFontFaces } from "../../src/css/filter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");
const loadFixture = (name: string) =>
	readFileSync(join(fixturesDir, name), "utf-8").trim();

describe("filterCssFontFaces", () => {
	const sampleCss = loadFixture("sample.css");

	it("should return original CSS when no filter is provided", () => {
		const result = filterCssFontFaces(sampleCss);
		assert.strictEqual(result, sampleCss);
	});

	it("should return original CSS when filter is undefined", () => {
		const result = filterCssFontFaces(sampleCss, undefined);
		assert.strictEqual(result, sampleCss);
	});

	it("should filter out font-face blocks that don't match the filter", () => {
		const filter = (filename: string) => filename.includes("Roboto");
		const result = filterCssFontFaces(sampleCss, filter);

		assert.ok(result.includes("Roboto-Regular.woff2"));
		assert.ok(result.includes("Roboto-Bold.woff2"));
		assert.ok(!result.includes("OpenSans"));
	});

	it("should keep only font-face blocks matching the filter", () => {
		const filter = (filename: string) =>
			filename === "OpenSans-Regular.woff2";
		const result = filterCssFontFaces(sampleCss, filter);

		assert.ok(result.includes("OpenSans-Regular.woff2"));
		assert.ok(!result.includes("Roboto"));
	});

	it("should return empty string when no fonts match the filter", () => {
		const filter = () => false;
		const result = filterCssFontFaces(sampleCss, filter);

		assert.ok(!result.includes("@font-face"));
	});

	it("should handle CSS with no font-face blocks", () => {
		const css = loadFixture("no-font-face.css");
		const filter = () => true;
		const result = filterCssFontFaces(css, filter);

		assert.strictEqual(result, css);
	});

	it("should handle empty CSS", () => {
		const emptyCss = loadFixture("empty.css");
		const result = filterCssFontFaces(emptyCss, () => true);
		assert.strictEqual(result, emptyCss);
	});
});
