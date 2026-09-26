// SPDX-License-Identifier: AGPL-3.0-or-later

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {describe, test} from 'node:test';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const sourcePath = fileURLToPath(new URL('./NativeArtifactName.ts', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');
const transformedSource = esbuild.transformSync(source, {
	loader: 'ts',
	format: 'cjs',
	platform: 'node',
	target: 'node20',
}).code;

function loadModule() {
	const module = {exports: {}};
	const context = vm.createContext({
		module,
		exports: module.exports,
		console,
	});
	vm.runInContext(transformedSource, context, {filename: sourcePath});
	return module.exports;
}

describe('nativeVoiceEngineFileName', () => {
	test('maps Windows to the msvc artifact name', () => {
		const {nativeVoiceEngineFileName} = loadModule();

		assert.equal(nativeVoiceEngineFileName('win32', 'x64'), 'webrtc-sender.win32-x64-msvc.node');
		assert.equal(nativeVoiceEngineFileName('win32', 'arm64'), 'webrtc-sender.win32-arm64-msvc.node');
	});

	test('maps macOS to the darwin artifact name', () => {
		const {nativeVoiceEngineFileName} = loadModule();

		assert.equal(nativeVoiceEngineFileName('darwin', 'x64'), 'webrtc-sender.darwin-x64.node');
		assert.equal(nativeVoiceEngineFileName('darwin', 'arm64'), 'webrtc-sender.darwin-arm64.node');
	});

	test('maps Linux to the gnu artifact name', () => {
		const {nativeVoiceEngineFileName} = loadModule();

		assert.equal(nativeVoiceEngineFileName('linux', 'x64'), 'webrtc-sender.linux-x64-gnu.node');
	});

	test('returns an empty name for unsupported platforms', () => {
		const {nativeVoiceEngineFileName} = loadModule();

		assert.equal(nativeVoiceEngineFileName('freebsd', 'x64'), '');
	});
});
