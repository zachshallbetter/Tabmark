/**
 * Some state needs to be saved through the entire Chrome session; as of v1.0 this is only the list of windows that are active.
 * This file is linked to from background.html and contains the code for coordinating this global state. It accepts two types of
 * requests from the popup; a request indicating that a task has been loading, which adds it to the list of active tasks to get
 * persisted on the UPDATE interval. It also accepts a request that represents the popup asking if a given window corresponds to
 * an active task.
 */

/* Diagram of storage/tasks: 

storage: 
{
	'hi': { 
	        name: "hi", 
	        tabs: {"a": "http://a.com", "b": "http://b.com", "c": "http://c.com"}, 
	        update: true 
	}, 
	'hi2': { 
	        name: "hi2", 
	        tabs: {"d": "http://d.com", "e": "http://e.com", "f": "http://f.com"}, 
	        update: false
	}
}
*/

var WEBSERVICE_URL = "http://tabtaskmanager.appspot.com";
// var WEBSERVICE_URL = "http://localhost:8080";
var LOGIN_URL; // = WEBSERVICE_URL + "/_ah/login?continue=" + WEBSERVICE_URL + "?user=true";
var LOGOUT_URL; // = WEBSERVICE_URL + "/_ah/login?continue=" + WEBSERVICE_URL + "&action=logout";
var CLOUD_INTERVAL = 1000 * 60 * 1;

/*** GLOBALS ***/
var activeTasks = {};
var cache;
var pushQueue = {sets: {}, removes: []};
var tabs = {};
var storage = chrome.storage.sync;

window.onload = function() {
	storage.get(null, function(result) {
		cache = result || {};
	});
	var length = Math.max((60 * 60) / storage.MAX_WRITE_OPERATIONS_PER_HOUR, 60 / storage.MAX_SUSTAINED_WRITE_OPERATIONS_PER_MINUTE)
	setInterval(function() {
		storage.set(pushQueue.sets, function() {
			if (!chrome.extension.lastError) {
				pushQueue.sets = {};
			}
		});
		if (pushQueue.removes.length) {
			storage.remove(pushQueue.removes, function() {
				if (!chrome.extension.lastError) {
					pushQueue.removes = [];
				}
			});
		}
	}, length * 2000)
}

/**
 * Request listener accepts requests for adding new active tasks and checking to see if a given window corresponds to an active
 * task. Only the latter case sends a response.
 */
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.type == "load_task") {
		delete(request.type);
		activeTasks[request.window] = request;
	} else if (request.type == "window_active") {
		sendResponse({response: (activeTasks[request.window] && activeTasks[request.window].name == request.name)});
	} else if (request.type == "get_tasks") {
		sendResponse(cache);
	} else if (request.type == "make_change") {
		makeChange(request.change);
	} else if (request.type == "delete_tabs") {
		deleteTabsFromTask(request.task);
	} else if (request.type == "clear") {
		storage.clear();
	} else if (request.type == "reset") {
		storage.clear();
	}
});

function makeChange(change) {
	switch(change.type) {
		case CHANGE_TYPES.ADD_TASK:
			cache[change.taskName] = change.task;
			pushQueue.sets[change.taskName] = change.task;
			break;
		case CHANGE_TYPES.REMOVE_TASK:
			delete(cache[change.taskName]);
			pushQueue.removes.push(change.taskName);
			break;
		case CHANGE_TYPES.EDIT_TASK:
			if (change.newTaskName) {
				cache[change.newTaskName] = cache[change.taskName];
				delete(cache[change.taskName]);
				change.taskName = change.newTaskName;
				pushQueue.push({type: 'remove', task: change.oldTaskName});
			}
			cache[change.taskName].description = change.newDescription || cache[change.taskName].description;
			cache[change.taskName].tabs = change.newTabs || cache[change.taskName].tabs;
			if (change.newUpdate != undefined) {
				cache[change.task].update = change.newUpdate;	
			}
			pushQueue.push({type: 'set', task: change.taskName});
			break;
	}
}


/**
 * Have to keep track of what window each tab is in, because once one is removed, we can't ask it
 * what window it was deleted from, which makes it hard to update
 */
chrome.tabs.onAttached.addListener(function(tabId, attachInfo){updateTab(tabId, attachInfo.newWindowId);});
chrome.tabs.onCreated.addListener(function(tab){updateTab(tab.id, tab.windowId)});
function updateTab(tabId, windowId) {
	tabs[tabId] = windowId;
}

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
	var windowId = tabs[tabId];
	if (activeTasks[windowId]) {
		if (removeInfo.isWindowClosing) {
			delete activeTasks[windowId];
		} else {
			var taskName = activeTasks[windowId].name;
			var task = cache[taskName];
			if (task && task.update) {
				delete task.tabs[tabId];
				changes.push(task.name);
			}
		}
	}
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (activeTasks[tab.windowId]) {
		var taskName = activeTasks[tab.windowId].name;
		var task = cache[taskName];
		if (task && task.update) {
			if (!task.tabs[tabId]) {
				task.tabs[tabId] = {};
			}
			task.tabs[tabId].url = tab.url;
			task.tabs[tabId].title = tab.title;
			task.tabs[tabId].favicon = tab.favIconUrl;
			changes.push(task.name);
		}
	}
});

function deleteTabsFromTask(task) {
	user.tasks.filter(function(e) {return e.name == task.name})[0].tabs = {};
}