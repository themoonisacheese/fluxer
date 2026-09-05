// SPDX-License-Identifier: AGPL-3.0-or-later

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function buildInstancePickerHtml(currentInstanceOrigin: string): string {
	return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Connect to Instance</title>
<style>
:root {
	color-scheme: dark;
}
* {
	box-sizing: border-box;
}
body {
	margin: 0;
	background: #2b2d31;
	color: #dbdee1;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
	font-size: 14px;
	-webkit-font-smoothing: antialiased;
	user-select: none;
}
main {
	display: flex;
	flex-direction: column;
	gap: 12px;
	padding: 20px;
	width: 100%;
	height: 100vh;
}
h1 {
	margin: 0;
	font-size: 16px;
	font-weight: 600;
	color: #f2f3f5;
	-webkit-app-region: drag;
}
.current {
	margin: 0;
	font-size: 12px;
	color: #949ba4;
	overflow-wrap: anywhere;
}
.current span {
	color: #dbdee1;
}
label {
	font-size: 12px;
	font-weight: 600;
	color: #b5bac1;
	-webkit-app-region: no-drag;
}
input {
	padding: 10px 12px;
	border: 1px solid #1e1f22;
	border-radius: 4px;
	background: #1e1f22;
	color: #f2f3f5;
	font-size: 14px;
	outline: none;
	-webkit-app-region: no-drag;
	user-select: text;
}
input:focus {
	border-color: #5865f2;
}
.status {
	margin: 0;
	font-size: 12px;
	color: #949ba4;
	overflow-wrap: anywhere;
}
.status.error {
	color: #f26d6d;
}
.actions {
	display: flex;
	justify-content: flex-end;
	gap: 8px;
	margin-top: auto;
	-webkit-app-region: no-drag;
}
button {
	padding: 8px 16px;
	border: none;
	border-radius: 4px;
	background: transparent;
	color: #dbdee1;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
}
button:hover {
	text-decoration: underline;
}
button.primary {
	background: #5865f2;
	color: #ffffff;
}
button.primary:hover {
	background: #4752c4;
	text-decoration: none;
}
button:disabled {
	opacity: 0.6;
	cursor: default;
	text-decoration: none;
}
</style>
</head>
<body>
<main>
	<h1>Connect to an instance</h1>
	<p class="current">Current instance: <span>${escapeHtml(currentInstanceOrigin)}</span></p>
	<label for="instance-url">Instance URL</label>
	<input id="instance-url" type="text" placeholder="https://your-instance.example" autocomplete="off" autocapitalize="off" spellcheck="false" />
	<p id="status" class="status" hidden></p>
	<div class="actions">
		<button id="cancel" type="button">Cancel</button>
		<button id="connect" type="button" class="primary">Connect</button>
	</div>
</main>
<script>
(function () {
	var input = document.getElementById('instance-url');
	var connectButton = document.getElementById('connect');
	var cancelButton = document.getElementById('cancel');
	var status = document.getElementById('status');
	function setStatus(message, isError) {
		status.textContent = message;
		status.hidden = false;
		status.classList.toggle('error', isError === true);
	}
	function closePicker() {
		if (window.electron && typeof window.electron.closeInstancePicker === 'function') {
			window.electron.closeInstancePicker();
		}
	}
	function connect() {
		var instanceUrl = input.value.trim();
		if (!instanceUrl) {
			setStatus('Enter an instance URL.', true);
			return;
		}
		if (!window.electron || typeof window.electron.switchInstanceUrl !== 'function') {
			setStatus('Instance switching is unavailable in this build.', true);
			return;
		}
		connectButton.disabled = true;
		cancelButton.disabled = true;
		setStatus('Connecting...', false);
		window.electron
			.switchInstanceUrl({instanceUrl: instanceUrl})
			.then(function () {
				closePicker();
			})
			.catch(function (error) {
				var message = error && error.message ? String(error.message) : 'Failed to connect to instance';
				setStatus(message, true);
				connectButton.disabled = false;
				cancelButton.disabled = false;
			});
	}
	connectButton.addEventListener('click', connect);
	cancelButton.addEventListener('click', closePicker);
	input.addEventListener('keydown', function (event) {
		if (event.key === 'Enter') {
			event.preventDefault();
			connect();
		}
	});
	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape') {
			closePicker();
		}
	});
	input.focus();
})();
</script>
</body>
</html>
`;
}
