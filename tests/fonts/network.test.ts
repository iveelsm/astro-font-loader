import assert from "node:assert";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it, mock } from "node:test";

import {
	deriveFilenameFromUrl,
	downloadFont,
	extractFontUrlsFromCss,
	fetchCssFontSource,
	fetchDirectFontSource,
} from "../../src/fonts/network";

describe("extractFontUrlsFromCss", () => {
	it("should extract absolute font URLs from CSS", () => {
		const css = `
@font-face {
	src: url("https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.woff2") format("woff2");
}`;
		const urls = extractFontUrlsFromCss(css);
		assert.deepStrictEqual(urls, [
			"https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.woff2",
		]);
	});

	it("should extract multiple font URLs", () => {
		const css = `
@font-face { src: url("https://example.com/a.woff2"); }
@font-face { src: url("https://example.com/b.woff"); }
@font-face { src: url("https://example.com/c.ttf"); }`;
		const urls = extractFontUrlsFromCss(css);
		assert.strictEqual(urls.length, 3);
		assert.ok(urls.includes("https://example.com/a.woff2"));
		assert.ok(urls.includes("https://example.com/b.woff"));
		assert.ok(urls.includes("https://example.com/c.ttf"));
	});

	it("should ignore non-font URLs", () => {
		const css = `
@font-face { src: url("https://example.com/style.css"); }
body { background: url("https://example.com/bg.png"); }`;
		const urls = extractFontUrlsFromCss(css);
		assert.strictEqual(urls.length, 0);
	});

	it("should handle URLs without quotes", () => {
		const css = `@font-face { src: url(https://example.com/font.woff2); }`;
		const urls = extractFontUrlsFromCss(css);
		assert.deepStrictEqual(urls, ["https://example.com/font.woff2"]);
	});

	it("should handle single-quoted URLs", () => {
		const css = `@font-face { src: url('https://example.com/font.woff2'); }`;
		const urls = extractFontUrlsFromCss(css);
		assert.deepStrictEqual(urls, ["https://example.com/font.woff2"]);
	});

	it("should ignore relative URLs", () => {
		const css = `@font-face { src: url("./fonts/Roboto.woff2"); }`;
		const urls = extractFontUrlsFromCss(css);
		assert.strictEqual(urls.length, 0);
	});

	it("should return empty array for CSS with no URLs", () => {
		const css = `body { font-family: sans-serif; }`;
		const urls = extractFontUrlsFromCss(css);
		assert.deepStrictEqual(urls, []);
	});

	it("should handle all supported font extensions", () => {
		const css = `
@font-face { src: url("https://example.com/a.woff2"); }
@font-face { src: url("https://example.com/b.woff"); }
@font-face { src: url("https://example.com/c.ttf"); }
@font-face { src: url("https://example.com/d.otf"); }
@font-face { src: url("https://example.com/e.eot"); }`;
		const urls = extractFontUrlsFromCss(css);
		assert.strictEqual(urls.length, 5);
	});
});

describe("deriveFilenameFromUrl", () => {
	it("should use URL basename for recognizable font extensions", () => {
		const url =
			"https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.woff2";
		assert.strictEqual(deriveFilenameFromUrl(url), "Roboto-Regular.woff2");
	});

	it("should use URL basename for woff files", () => {
		const url = "https://example.com/fonts/MyFont.woff";
		assert.strictEqual(deriveFilenameFromUrl(url), "MyFont.woff");
	});

	it("should use URL basename for ttf files", () => {
		const url = "https://example.com/fonts/MyFont.ttf";
		assert.strictEqual(deriveFilenameFromUrl(url), "MyFont.ttf");
	});

	it("should fall back to hash-based name for opaque URLs", () => {
		const url =
			"https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK";
		const filename = deriveFilenameFromUrl(url);
		assert.ok(filename.startsWith("font-"));
		assert.ok(filename.length > 6);
	});

	it("should produce stable filenames for the same URL", () => {
		const url = "https://example.com/some-opaque-path";
		const first = deriveFilenameFromUrl(url);
		const second = deriveFilenameFromUrl(url);
		assert.strictEqual(first, second);
	});

	it("should handle URLs with query strings", () => {
		const url = "https://example.com/fonts/MyFont.woff2?v=123";
		// basename will be "MyFont.woff2?v=123" which won't match font extension
		// so it falls back to hash
		const filename = deriveFilenameFromUrl(url);
		assert.ok(filename.length > 0);
	});
});

describe("downloadFont", () => {
	let cacheDir: string;
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		cacheDir = join(tmpdir(), `font-download-test-${Date.now()}`);
		mkdirSync(cacheDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(cacheDir, { recursive: true, force: true });
		globalThis.fetch = originalFetch;
	});

	it("should download a font file to the cache directory", async () => {
		const fakeBody = new Uint8Array([0, 1, 2, 3]);
		globalThis.fetch = mock.fn(async () => {
			return new Response(fakeBody, { status: 200 });
		}) as typeof fetch;

		const url = "https://example.com/fonts/TestFont.woff2";
		const result = await downloadFont(url, cacheDir);

		assert.strictEqual(result.filename, "TestFont.woff2");
		assert.strictEqual(result.sourceUrl, url);
		assert.ok(existsSync(result.sourcePath));
		assert.deepStrictEqual(
			readFileSync(result.sourcePath),
			Buffer.from(fakeBody),
		);
	});

	it("should skip download if file already cached", async () => {
		const url = "https://example.com/fonts/Cached.woff2";
		const cachedPath = join(cacheDir, "Cached.woff2");
		writeFileSync(cachedPath, "existing-content");

		let fetchCalled = false;
		globalThis.fetch = mock.fn(async () => {
			fetchCalled = true;
			return new Response("new", { status: 200 });
		}) as typeof fetch;

		const result = await downloadFont(url, cacheDir);

		assert.strictEqual(result.filename, "Cached.woff2");
		assert.strictEqual(fetchCalled, false);
		assert.strictEqual(
			readFileSync(result.sourcePath, "utf-8"),
			"existing-content",
		);
	});

	it("should throw on HTTP error responses", async () => {
		globalThis.fetch = mock.fn(async () => {
			return new Response("Not Found", {
				status: 404,
				statusText: "Not Found",
			});
		}) as typeof fetch;

		await assert.rejects(
			() => downloadFont("https://example.com/missing.woff2", cacheDir),
			/Failed to download font.*404/,
		);
	});

	it("should set sourceUrl on returned FontInfo", async () => {
		globalThis.fetch = mock.fn(async () => {
			return new Response(new Uint8Array([1]), { status: 200 });
		}) as typeof fetch;

		const url = "https://example.com/fonts/Test.woff2";
		const result = await downloadFont(url, cacheDir);
		assert.strictEqual(result.sourceUrl, url);
	});
});

describe("fetchCssFontSource", () => {
	let cacheDir: string;
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		cacheDir = join(tmpdir(), `font-css-test-${Date.now()}`);
		mkdirSync(cacheDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(cacheDir, { recursive: true, force: true });
		globalThis.fetch = originalFetch;
	});

	it("should fetch CSS and download referenced fonts", async () => {
		const cssContent = `@font-face { src: url("https://example.com/fonts/Roboto.woff2"); }`;
		const fontBody = new Uint8Array([0, 1, 2, 3]);

		globalThis.fetch = mock.fn(async (url: string | URL | Request) => {
			const urlStr = url instanceof Request ? url.url : url.toString();
			if (urlStr.endsWith(".woff2")) {
				return new Response(fontBody, { status: 200 });
			}
			return new Response(cssContent, { status: 200 });
		}) as typeof fetch;

		const result = await fetchCssFontSource(
			"https://fonts.googleapis.com/css2?family=Roboto",
			cacheDir,
		);

		assert.strictEqual(result.css, cssContent);
		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "Roboto.woff2");
		assert.ok(existsSync(result.fonts[0].sourcePath));
	});

	it("should apply filter to downloaded fonts", async () => {
		const cssContent = `
@font-face { src: url("https://example.com/Roboto-Regular.woff2"); }
@font-face { src: url("https://example.com/Roboto-Bold.woff2"); }`;

		globalThis.fetch = mock.fn(async (url: string | URL | Request) => {
			const urlStr = url instanceof Request ? url.url : url.toString();
			if (urlStr.endsWith(".woff2")) {
				return new Response(new Uint8Array([1]), { status: 200 });
			}
			return new Response(cssContent, { status: 200 });
		}) as typeof fetch;

		const filter = (filename: string) => filename.includes("Regular");
		const result = await fetchCssFontSource(
			"https://example.com/fonts.css",
			cacheDir,
			filter,
		);

		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "Roboto-Regular.woff2");
	});

	it("should throw on CSS fetch failure", async () => {
		globalThis.fetch = mock.fn(async () => {
			return new Response("Error", {
				status: 500,
				statusText: "Server Error",
			});
		}) as typeof fetch;

		await assert.rejects(
			() => fetchCssFontSource("https://example.com/bad.css", cacheDir),
			/Failed to fetch CSS.*500/,
		);
	});
});

describe("fetchDirectFontSource", () => {
	let cacheDir: string;
	const originalFetch = globalThis.fetch;

	beforeEach(() => {
		cacheDir = join(tmpdir(), `font-direct-test-${Date.now()}`);
		mkdirSync(cacheDir, { recursive: true });
	});

	afterEach(() => {
		rmSync(cacheDir, { recursive: true, force: true });
		globalThis.fetch = originalFetch;
	});

	it("should download explicit font URLs", async () => {
		globalThis.fetch = mock.fn(async () => {
			return new Response(new Uint8Array([1, 2]), { status: 200 });
		}) as typeof fetch;

		const css = `@font-face { src: url("https://example.com/MyFont.woff2"); }`;
		const result = await fetchDirectFontSource(
			["https://example.com/MyFont.woff2"],
			css,
			cacheDir,
		);

		assert.strictEqual(result.css, css);
		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "MyFont.woff2");
	});

	it("should apply filter to direct font downloads", async () => {
		globalThis.fetch = mock.fn(async () => {
			return new Response(new Uint8Array([1]), { status: 200 });
		}) as typeof fetch;

		const result = await fetchDirectFontSource(
			[
				"https://example.com/FontA.woff2",
				"https://example.com/FontB.woff2",
			],
			"",
			cacheDir,
			(filename) => filename === "FontA.woff2",
		);

		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "FontA.woff2");
	});
});
