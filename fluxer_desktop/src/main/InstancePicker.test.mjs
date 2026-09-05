// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {describe, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const sourcePath = fileURLToPath(new URL('./InstancePickerHtml.ts', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');
const transformedSource = esbuild.transformSync(source, {
	loader: 'ts',
	format: 'cjs',
	platform: 'node',
	target: 'node20',
}).code;

function loadInstancePickerHtml() {
	const module = {exports: {}};
	const context = vm.createContext({
		module,
		exports: module.exports,
		console,
	});
	vm.runInContext(transformedSource, context, {filename: sourcePath});
	return module.exports;
}

describe('buildInstancePickerHtml', () => {
	test('embeds the current instance origin', () => {
		const {buildInstancePickerHtml} = loadInstancePickerHtml();

		const html = buildInstancePickerHtml('https://web.fluxer.app');

		assert.ok(html.includes('https://web.fluxer.app'));
	});

	test('escapes the current instance origin', () => {
		const {buildInstancePickerHtml} = loadInstancePickerHtml();

		const html = buildInstancePickerHtml('<script>alert(1)</script>');

		assert.ok(!html.includes('<script>alert(1)'));
		assert.ok(html.includes('&lt;script&gt;'));
	});

	test('contains the instance url input and connect controls', () => {
		const {buildInstancePickerHtml} = loadInstancePickerHtml();

		const html = buildInstancePickerHtml('https://web.fluxer.app');

		assert.ok(html.includes('id="instance-url"'));
		assert.ok(html.includes('id="connect"'));
		assert.ok(html.includes('id="cancel"'));
		assert.ok(html.includes('switchInstanceUrl'));
		assert.ok(html.includes('closeInstancePicker'));
	});
});
