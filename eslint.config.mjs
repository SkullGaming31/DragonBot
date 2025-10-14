import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import { defineConfig } from 'eslint/config';


export default defineConfig([
	{ files: ['**/*.{js,mjs,cjs,ts}'], plugins: { js }, extends: ['js/recommended'] },
	{ files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.node } },
	tseslint.configs.recommended,
	{ files: ['**/*.json'], plugins: { json }, language: 'json/json', extends: ['json/recommended'] },
	{ files: ['**/*.jsonc'], plugins: { json }, language: 'json/jsonc', extends: ['json/recommended'] },
	{ files: ['**/*.md'], plugins: { markdown }, language: 'markdown/gfm', extends: ['markdown/recommended'] },
	{
		rules: {
			'indent': ['error', 'tab', { 'SwitchCase': 1 }],
			'linebreak-style': ['error', 'unix'],
			'quotes': ['error', 'single'],
			'semi': ['error', 'always'],
			'prefer-arrow-callback': 'error',
			'prefer-const': 'error',
			'no-unused-vars': 'warn',
			'no-case-declarations': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'@typescript-eslint/no-require-imports': 'off'
		}
	}
]);