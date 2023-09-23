
const PLAYLIST_ITEM_SELECTOR = 'ytd-playlist-video-renderer';
const PLAYLIST_COUNT_SELECTOR = 'ytd-playlist-byline-renderer .metadata-stats yt-formatted-string:first-child span';

function durationToSeconds(duration) {
	const parts = duration.split(':');
	let seconds = 0;
	for (let i = 0; i < parts.length; i++) {
		seconds += parseInt(parts[i]) * Math.pow(60, parts.length - i - 1);
	}
	return seconds;
}

function extractIdFromUrl(url) {
	const parts = url.split('?');
	if (parts.length < 2) {
		return null;
	}
	const params = new URLSearchParams(parts[1]);
	return params.get('v');
}

function cleanupUrl(urlString) {
	const url = new URL(urlString, 'https://www.youtube.com');
	// Convert searchParams iterator to array to avoid off-by-one error when deleting keys
	for (const key of Array.from(url.searchParams.keys())) {
		if (key !== 'v') {
			url.searchParams.delete(key);
		}
	}
	return url.toString();
}

const ITEM_EXTRACTORS = [
	{
		selector: 'h3 > a',
		extractor: (element) => {
			return {
				title: element.innerText,
				url: cleanupUrl( element.getAttribute('href') ),
				id: extractIdFromUrl( element.getAttribute('href') ),
			};
		}
	},
	{
		selector: 'ytd-channel-name',
		extractor: (element) => {
			return {
				channel: element.innerText,
				channelLink: element.querySelector('a').getAttribute('href'),
			};
		}
	},
	{
		selector: 'span.ytd-thumbnail-overlay-time-status-renderer',
		extractor: (element) => {
			return {
				duration: durationToSeconds( element.innerText ),
			};
		}
	},
	{
		selector: 'ytd-thumbnail img',
		extractor: (element) => {
			return {
				thumbnail: element.getAttribute('src'),
			};
		}
	}
]


function getPlaylistData() {
	const playlistElements = document.querySelectorAll(PLAYLIST_ITEM_SELECTOR);
	const playlistItems = [];
	for (const playlistElement of playlistElements) {
		const extractedData = [];
		for (const extractor of ITEM_EXTRACTORS) {
			const element = playlistElement.querySelector(extractor.selector);
			if (element) {
				extractedData.push(extractor.extractor(element));
			}
		}
		const playlistItem = {};
		for (const data of extractedData) {
			Object.assign(playlistItem, data);
		}
		playlistItems.push(playlistItem);
	}
	return playlistItems;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// TODO: Check if message is from the extension, checking sender
	if (message.type === 'getPlaylistData') {
		if (window.location.href.includes('playlist')) {
			const items = getPlaylistData();
			console.log(items);
			sendResponse( {
				status: 'OK',
				items: items,
			});
		}
		else {
			sendResponse( {
				status: 'ERROR',
				message: 'Not a playlist',
			});
		}
	}
});
