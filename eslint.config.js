import eslint from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default [
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		ignores: ["dist/", "node_modules/", "*.md"],
	},
	{
		files: ["**/*.ts", "**/*.js"],
		plugins: {
			perfectionist,
		},
		rules: {
			"perfectionist/sort-imports": [
				"error",
				{
					type: "natural",
					order: "asc",
					newlinesBetween: 1,
					groups: [
						"style",
						"side-effect-style",
						"builtin",
						"external",
						"import",
					],
				},
			],
		},
		settings: {
			perfectionist: {
				type: "line-length",
				partitionByComment: true,
			},
		},
	},
];
