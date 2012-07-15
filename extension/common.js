function getTabsFromWindow(window) {
	var tabs = new Object();
	var savePinned = localStorage["savePinned"];
	for (var i = 0; i < window.tabs.length; i++) {
		if (savePinned || !window.tabs[i].pinned) {
			tabs[window.tabs[i].id] = new Object();
			tabs[window.tabs[i].id].title = window.tabs[i].title;
			tabs[window.tabs[i].id].url = window.tabs[i].url;
			if (!window.tabs[i].favIconUrl
			||  window.tabs[i].favIconUrl.indexOf('chrome://theme/') == 0) {
				tabs[window.tabs[i].id].favicon = 'chrome://favicon/';
			} else {
				tabs[window.tabs[i].id].favicon = window.tabs[i].favIconUrl;
			}
		}
	}
	return tabs;
}

function indexOfTask(tasks, name) {
	for (var i = 0; i < tasks.length; i++) {
		if (tasks[i].name == name)
			return i;
	}
	return -1;
}