chrome.action.onClicked.addListener(async function(tab) {
	await chrome.tabs.sendMessage(tab.id, {type: 'getPlaylistData'}, function(response) {
		console.log("got playlist items", response);
	});
});
