import van from "./libs/van-1.2.1.min.js"

const { p, select, option, button } = van.tags;

const templates = [
	{ label: 'URL list', template: "{{url}}\n" },
	{ 
		label: 'Markdown', 
		template: "- [{{title}}]({{url}})\n",
		filter: item => ({...item, title: item.title.replace(/\[/g, '\\[').replace(/\]/g, '\\]')}),
	},
	{ 
		label: 'CSV',
		template: "{{title}},{{url}},{{duration}},{{channel}},{{channelLink}}\n",
		prefix: 'title,url,duration,channel,channelLink\n',
		filter: item => {
			return Object.keys(item).reduce((newItem, key) => {
				if ( typeof item[key] === 'string' && ( item[key].indexOf(',') > -1 || item[key].indexOf('"') > -1 ) ) {
					newItem[key] = `"${item[key].replace(/"/g, '""')}"`
				} else {
					newItem[key] = item[key];
				}
				return newItem;
			}, {});
		},
	},
];


function renderTemplate(templateObject, data) {
	let text = templateObject.template;
	let sanitizedData = data;
	if (templateObject.filter) {
		sanitizedData = templateObject.filter(Object.assign({}, data));
	}
	for (const key in sanitizedData) {
		text = text.replace(new RegExp(`{{${key}}}`, 'g'), sanitizedData[key]);
	}
	return text;
}

const appStatus = van.state({ message: '', severity: null });
const templateIndex = van.state(0);

function onExportButtonClicked() {
	// TODO add loading indicator
	// TODO allow collection of playlist data from multiple tabs
	chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, {type: 'getPlaylistData'}, renderPlaylistResult);
	});
}

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

const TemplateSelector = () => {
	return select({value: templateIndex.val, onchange: e => templateIndex.val = e.target.value},
		// We have to compare with == because the value from the store might be an object, posing as a number
		templates.map((template, index) => option({value: index, selected: index == templateIndex.val }, template.label))
	);
}

van.add(document.getElementById('status'), Status);
van.add(document.getElementById('export-button'), [
	'Format: ',
	TemplateSelector,
	' ',
	() => button({onclick: onExportButtonClicked}, 'Export'),
]);

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
	if (!response.items) {
		setStatusMessage('Content script returned empty response (no item property)', 'error');
		return;
	}
	setStatusMessage('');
	const playlistArea = document.getElementById('playlist');
	const template = templates[templateIndex.val];
	const prefix = template.prefix??'';
	playlistArea.value = prefix + response.items.map(item => renderTemplate(template, item)).join('');
}

function getStatusMessageFromLoadProgress(progressMessage) {
	const { chunksLoaded, chunksToLoad, lastLoadTime, finished } = progressMessage;
	if (finished) {
		return '';
	}
	let timeProjection = '';
	if (lastLoadTime > 0) {
		const projectedTime = Math.floor((chunksToLoad - chunksLoaded) * lastLoadTime / 1000);
		timeProjection = `Approx. ${projectedTime} seconds remaining`;
	}
	return `Loading the playlist pages, loading page ${chunksLoaded} of ${chunksToLoad}. ${timeProjection}`;
}

chrome.runtime.onMessage.addListener(function(request) {
	switch (request.type) {
		case 'status':
			setStatusMessage(request.message, request.severity??null);
			break;
		case 'load-progress':
			setStatusMessage(getStatusMessageFromLoadProgress(request), 'info');
			break
	}
});

