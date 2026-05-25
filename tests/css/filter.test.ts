import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { matchCssFontFaces } from "../../src/css/filter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), "utf-8").trim();

describe("matchCssFontFaces", () => {
	const sampleCss = loadFixture("sample.css");

	it("should match by font-family and weight", () => {
		const result = matchCssFontFaces(sampleCss, "Roboto", [
			{ name: "Roboto", weight: 400, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 1);
		assert.ok(result.filenames.includes("Roboto-Regular.woff2"));
		assert.ok(result.css.includes("Roboto-Regular.woff2"));
		assert.ok(!result.css.includes("Roboto-Bold.woff2"));
	});

	it("should match multiple weights", () => {
		const result = matchCssFontFaces(sampleCss, "Roboto", [
			{ name: "Roboto", weight: 400, styles: ["normal"] },
			{ name: "Roboto", weight: 700, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 2);
		assert.ok(result.filenames.includes("Roboto-Regular.woff2"));
		assert.ok(result.filenames.includes("Roboto-Bold.woff2"));
	});

	it("should not match different font-family", () => {
		const result = matchCssFontFaces(sampleCss, "Roboto", [
			{ name: "Roboto", weight: 400, styles: ["normal"] },
		]);

		assert.ok(!result.css.includes("OpenSans"));
	});

	it("should return empty when no family matches", () => {
		const result = matchCssFontFaces(sampleCss, "Arial", [
			{ name: "Arial", weight: 400, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 0);
		assert.ok(!result.css.includes("@font-face"));
	});

	it("should be case-insensitive on font-family", () => {
		const result = matchCssFontFaces(sampleCss, "roboto", [
			{ name: "roboto", weight: 700, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 1);
		assert.ok(result.filenames.includes("Roboto-Bold.woff2"));
	});

	it("should handle CSS with no font-face blocks", () => {
		const css = loadFixture("no-font-face.css");
		const result = matchCssFontFaces(css, "Roboto", [
			{ name: "Roboto", weight: 400, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 0);
	});

	it("should handle empty CSS", () => {
		const emptyCss = loadFixture("empty.css");
		const result = matchCssFontFaces(emptyCss, "Roboto", [
			{ name: "Roboto", weight: 400, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 0);
	});

	it("should not match italic when only normal is requested", () => {
		const css = `
@font-face {
	font-family: "Roboto";
	src: url("./Roboto/Roboto-Regular.woff2") format("woff2");
	font-weight: 400;
	font-style: normal;
}
@font-face {
	font-family: "Roboto";
	src: url("./Roboto/Roboto-Italic.woff2") format("woff2");
	font-weight: 400;
	font-style: italic;
}`;
		const result = matchCssFontFaces(css, "Roboto", [
			{ name: "Roboto", weight: 400, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 1);
		assert.ok(result.filenames.includes("Roboto-Regular.woff2"));
		assert.ok(!result.filenames.includes("Roboto-Italic.woff2"));
	});

	it("should match variable font weight ranges", () => {
		const css = `
@font-face {
	font-family: "Variable Font";
	src: url("./Variable-Regular.woff2") format("woff2-variations");
	font-weight: 100 900;
	font-style: normal;
}`;
		const result = matchCssFontFaces(css, "Variable Font", [
			{ name: "Variable Font", weight: [100, 900], styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 1);
		assert.ok(result.filenames.includes("Variable-Regular.woff2"));
	});

	it("should match single weight against variable font range", () => {
		const css = `
@font-face {
	font-family: "Variable Font";
	src: url("./Variable-Regular.woff2") format("woff2-variations");
	font-weight: 100 900;
	font-style: normal;
}`;
		const result = matchCssFontFaces(css, "Variable Font", [
			{ name: "Variable Font", weight: 400, styles: ["normal"] },
		]);

		assert.strictEqual(result.filenames.length, 1);
	});
});
