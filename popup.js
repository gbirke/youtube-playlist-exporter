
function renderPlaylistResult(response) {
	if (response.status === 'ERROR') {
		document.getElementById('playlist').innerHTML = 'Error: ' + response.message;
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



