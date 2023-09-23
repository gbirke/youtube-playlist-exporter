import van from "./libs/van-1.2.1.min.js"

const { p } = van.tags;

const appStatus = van.state({ message: '', severity: null });

const Status = () => {
	const classes = ['status'];
	if (appStatus.val.severity) {
		classes.push(`status-${appStatus.val.severity}`);
	}
	if (appStatus.val.message === '') {
		classes.push('hidden');
	}
	return p({class: classes.join(' ')}, appStatus.val.message);
}

van.add(document.getElementById('status'), Status);

function setStatusMessage(message, severity) {
	appStatus.val = { message, severity };
}

function renderPlaylistResult(response) {
	if (!response) {
		setStatusMessage('Content script returned empty response', 'error');
	}
	if (response.status === 'ERROR') {
		setStatusMessage(response.message, 'error');
		return;
	}
	var playlistArea = document.getElementById('playlist');
	let text = ''
	response.items.forEach(function(item) {
		text += `- [${item.title}](${item.url})\n`;
	});
	playlistArea.value = text;
}

document.getElementById('export').addEventListener('click', function() {
	// TODO add loading indicator
	// TODO allow collection of playlist data from multiple tabs
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {type: 'getPlaylistData'}, renderPlaylistResult);
	});
});

chrome.runtime.onMessage.addListener(function(request) {
	switch (request.type) {
		case 'status':
			setStatusMessage(request.message, request.severity??null);
			break;
	}
});

