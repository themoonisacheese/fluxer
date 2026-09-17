// SPDX-License-Identifier: AGPL-3.0-or-later

import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getAppUrl} from '@electron/common/DesktopConfig';
import {buildInstancePickerHtml} from '@electron/main/InstancePickerHtml';
import {getMainWindow} from '@electron/main/Window';
import {BrowserWindow, ipcMain} from 'electron';
import log from 'electron-log';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSTANCE_PICKER_WINDOW_TITLE = 'Fluxer | Connect to Instance';
const INSTANCE_PICKER_WINDOW_WIDTH = 440;
const INSTANCE_PICKER_WINDOW_HEIGHT = 260;

let instancePickerWindow: BrowserWindow | null = null;

function getCurrentInstanceOrigin(): string {
	try {
		return new URL(getAppUrl()).origin;
	} catch {
		return getAppUrl();
	}
}

function createInstancePickerWindow(): BrowserWindow {
	const parent = getMainWindow();
	const window = new BrowserWindow({
		width: INSTANCE_PICKER_WINDOW_WIDTH,
		height: INSTANCE_PICKER_WINDOW_HEIGHT,
		useContentSize: true,
		resizable: false,
		minimizable: false,
		maximizable: false,
		fullscreenable: false,
		skipTaskbar: true,
		show: true,
		frame: false,
		title: INSTANCE_PICKER_WINDOW_TITLE,
		backgroundColor: '#2b2d31',
		parent: parent && !parent.isDestroyed() ? parent : undefined,
		webPreferences: {
			preload: path.join(__dirname, '../preload/index.cjs'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: false,
			webSecurity: true,
			spellcheck: false,
		},
	});
	instancePickerWindow = window;
	window.once('closed', () => {
		if (instancePickerWindow === window) {
			instancePickerWindow = null;
		}
	});
	const html = buildInstancePickerHtml(getCurrentInstanceOrigin());
	window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`).catch((error: unknown) => {
		log.warn('Failed to load instance picker window', error);
	});
	return window;
}

export function openInstancePickerWindow(): void {
	if (instancePickerWindow && !instancePickerWindow.isDestroyed()) {
		instancePickerWindow.close();
	}
	createInstancePickerWindow();
}

export function closeInstancePickerWindow(): void {
	if (instancePickerWindow && !instancePickerWindow.isDestroyed()) {
		instancePickerWindow.close();
	}
}

export function registerInstancePickerIpcHandlers(): void {
	ipcMain.handle('open-instance-picker', (): void => {
		openInstancePickerWindow();
	});
	ipcMain.on('close-instance-picker', (event): void => {
		const window = BrowserWindow.fromWebContents(event.sender);
		if (window && window === instancePickerWindow && !window.isDestroyed()) {
			window.close();
		}
	});
}
