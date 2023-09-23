import van from "./libs/van-1.2.1.min.js"

const { p, select, option, button } = van.tags;

const templates = [
	{ label: 'URL list', template: "{{url}}\n" },
	{ label: 'Markdown', template: "- [{{title}}]({{url}})\n" },
	{ 
		label: 'CSV',
		template: "{{title}},{{url}},{{duration}},{{channel}},{{channelLink}}\n",
		prefix: 'title,url,duration,channel,channelLink\n',
	},
];


function renderTemplate(template, data) {
	let text = template;
	for (const key in data) {
		text = text.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
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
		templates.map((template, index) => option({value: index}, template.label))
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
	var playlistArea = document.getElementById('playlist');
	playlistArea.value = response.items.map(item => renderTemplate(templates[templateIndex.val].template, item)).join('');
}


chrome.runtime.onMessage.addListener(function(request) {
	switch (request.type) {
		case 'status':
			setStatusMessage(request.message, request.severity??null);
			break;
	}
});

