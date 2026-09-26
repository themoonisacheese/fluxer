// SPDX-License-Identifier: AGPL-3.0-or-later

export function nativeVoiceEngineFileName(platform: NodeJS.Platform, arch: string): string {
	if (platform === 'darwin') return `webrtc-sender.darwin-${arch}.node`;
	if (platform === 'win32') return `webrtc-sender.win32-${arch}-msvc.node`;
	if (platform === 'linux') return `webrtc-sender.linux-${arch}-gnu.node`;
	return '';
}
