
const PLAYLIST_ITEM_SELECTOR = 'ytd-playlist-video-renderer';
const PLAYLIST_COUNT_SELECTOR = 'ytd-playlist-byline-renderer .metadata-stats yt-formatted-string span';

const YT_CHUNK_SIZE = 100;

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

function getPlaylistCountFromDomElement() {
	const playlistCountElement = document.querySelector(PLAYLIST_COUNT_SELECTOR);
	if (!playlistCountElement) {
		chrome.runtime.sendMessage({
			type: 'status',
			message: 'Playlist count element not found',
			severity: 'warning',
		});
		return null;
	}
	const playlistCount = parseInt(playlistCountElement.innerText);
	if (isNaN(playlistCount)) {
		chrome.runtime.sendMessage({
			type: 'status',
			message: 'Playlist count element did not contain a number',
			severity: 'warning',
		});
		return null;
	}
	return playlistCount;
}

async function loadFullPlaylist( onLoaded ) {
	const MAX_POLL_TIME = 5000;
	const POLL_INTERVAL = 100;

	const playlistCount = getPlaylistCountFromDomElement();
	if (playlistCount === null) {
		onLoaded();
		return;
	}

	let playlistItems = document.querySelectorAll(PLAYLIST_ITEM_SELECTOR);
	if (playlistItems.length >= playlistCount) {
		onLoaded();
		return;
	}

	const chunksToLoad = Math.ceil(playlistCount / YT_CHUNK_SIZE);

	chrome.runtime.sendMessage({
		type: 'load-progress',
		chunksLoaded: 0,
		chunksToLoad: chunksToLoad,
		numVideos: playlistCount,
	});

	let pollTime = 0;
	let lastCount = 0;
	let lastPollTime = Date.now();
	while (pollTime < MAX_POLL_TIME) {
		const playlistItems = document.querySelectorAll(PLAYLIST_ITEM_SELECTOR);
		const chunksLoaded = Math.ceil(playlistItems.length / YT_CHUNK_SIZE);
		if ( playlistItems.length > lastCount ) {
			const lastElement = playlistItems[playlistItems.length - 1];
			lastElement.scrollIntoView();
			lastCount = playlistItems.length;

			// Decrease poll time by a bit to allow for really long playlists
			const currentTime = Date.now();
			const timeSinceLastLengthUpdate = currentTime - lastPollTime;
			pollTime = Math.min(0, (pollTime - timeSinceLastLengthUpdate) / 2);
			lastPollTime = currentTime;

			chrome.runtime.sendMessage({
				type: 'load-progress',
				chunksLoaded: chunksLoaded,
				chunksToLoad: chunksToLoad,
				numVideos: playlistCount,
				lastLoadTime: timeSinceLastLengthUpdate,
			});
		}

		await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
		pollTime += POLL_INTERVAL;
		
		// Divide by 100 to avoid timeouts when youtube hides private videos
		// playlistCount is the number of videos in the playlist, but that includes private videos,
		// even when they are not shown in the list
		if (chunksLoaded >= chunksToLoad) {
			chrome.runtime.sendMessage({
				type: 'load-progress',
				chunksLoaded: chunksLoaded,
				chunksToLoad: chunksToLoad,
				numVideos: playlistCount,
				finished: true
			});
			onLoaded();
			return;
		}
	}

	chrome.runtime.sendMessage({
		type: 'status',
		message: `Loading the playlist pages took longer than ${Math.floor(MAX_POLL_TIME/1000)} seconds. The playlist may not be fully loaded. Try reloading the page and exporting again. If the problem persist, please report it to the developer`,
		severity: 'warning',
	});

	onLoaded();
}

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

function onGetPlaylistData(sendResponse) {
	if (window.location.href.includes('playlist')) {
		loadFullPlaylist(() => {
			const items = getPlaylistData();
			sendResponse( {
				status: 'OK',
				items: items,
			});
		} )
	}
	else {
		sendResponse( {
			status: 'ERROR',
			message: 'No playlist found on page',
		});
	}
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// TODO: Check if message is from the extension, checking sender
	if (message.type === 'getPlaylistData') {
		onGetPlaylistData(sendResponse);
		return true;
	}
});
