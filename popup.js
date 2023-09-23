function setStatusMessage(message, severity) {
	const statusElement = document.getElementById('status');
	if (message === '') {
		statusElement.classList.add('hidden');
	} else {
		statusElement.innerHTML = message;
		statusElement.classList.remove('hidden');
		if (severity) {
			statusElement.classList.add(`status-${severity}`);
		}
	}
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

