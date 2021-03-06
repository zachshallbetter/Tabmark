/**
 * popup.js
 * Author: Tyler Rigsby
 * Date: 6/12/2012
 *
 * Handles all the javascript related to the browser action popup. Includes all of the UI and most of the back-end
 * tab management work.
 *
 */

/**
 * On document ready, load the tasks from localStorage and put them in the popup view. Set event handlers.
 */
$(document).ready(function() {
    getUser(function(user) {
        LOGIN_URL = user.login;
        LOGOUT_URL = user.logout;
        var tasks = user.tasks;
        if (tasks) {
            setTasksView(tasks);
        }
        
        $("#auto_update").click(setUpdate);
        setLoginArea(user);
    });
    $("#save_task").click(function() {
        saveTask($("#task_name").val(), true);
    });
    $("#task_name").keypress(function(event) {
        if (event.which == 13) saveTask($("#task_name").val(), true);
    });
    $("#errors").addClass("ui-state-error ui-corner-all");
    $("#task_name").blur(function() {
        $("#errors").hide();
    });

    $("button").button();
    $('#settings_button').click(openSettings);
    var saveSetting = function(event) {
        localStorage[$(this).data('setting')] = $(this).is(':checked') ? 'true' : '';
        if ($(this).data('setting') == 'cloud-enabled') {
            chrome.extension.sendMessage({
                type: "sync",
            }, function(user) {
                setTasksView(user.tasks);
                setLoginArea(user);
            });
        }
    };
    $('#settings').hide().load('/options.html', function() {
        $('#settings_inputs').find('input').each(function() {
            $(this)[0].checked = localStorage[$(this).data('setting')];
        });
        $('#settings_inputs').find('input').click(saveSetting);
    });

});

function setLoginArea(user) {
    if (localStorage['cloud-enabled'] && LOGIN_URL) {
        if (!user.email || user.email == "default") {
            var link = $("<a></a>");
            link.attr("href", LOGIN_URL);
            link.attr("target", "_blank");
            link.text("Log in");
            var span = $("<span></span>");
            span.append(link);
            span.append(" to enable cloud syncing");
            $("#username").append(span);
        } else {
            $("#username").append("Logged in as: " + user.email);
            $("#username").append("<br>")
            var link = $("<a></a>");
            link.attr("href", LOGOUT_URL);
            link.attr("target", "_blank");
            link.text("Log out");
            $("#username").append(link);
        }
    } else {
        $('#username').empty();
    }
}

function openSettings() {
    if (!$('#settings').is(':visible')) {
        $('#settings').show().animate({opacity: 1});
        $('#popup').animate({opacity: 0, 'z-index': -1});
        $('#settings_button').removeClass('ui-icon-wrench').addClass('ui-icon-arrowreturnthick-1-w');    
    } else {
        $('#popup').show().animate({opacity: 1, 'z-index': 1});
        $('#settings').animate({opacity: 0}, {complete: function() { $(this).hide(); }});    
        $('#settings_button').removeClass('ui-icon-arrowreturnthick-1-w').addClass('ui-icon-wrench');
    }
    
}

function editTitle(tasks, task, editSpan, taskContents) {
    var nameSpan = editSpan.siblings('.name_text');
    var curName = nameSpan.text();
    var input = $("<input />");
    var finish = function() {
        var newName = input.val();
        task.name = newName;
        taskContents.attr('id', 'task_name_' + newName);
        getUser(function(user) {
            user.tasks = tasks;
            setUser(user, false);
        });
        nameSpan.text(newName);
        input.replaceWith(nameSpan);
        editSpan.removeClass('ui-icon-check');
        editSpan.addClass('ui-icon-pencil');
        editSpan.unbind('click');
        editSpan.click(function() {return editTitle(tasks, task, editSpan, taskContents)});
        return false;
    };
    input.attr('type', 'text');
    input.addClass('task-name-edit');
    input.val(curName);
    nameSpan.replaceWith(input);
    editSpan.removeClass('ui-icon-pencil');
    editSpan.addClass('ui-icon-check');
    editSpan.unbind('click');
    editSpan.click(finish);
    input.click(function() {
        return false;
    }).keydown(function(e) {
        var key = e.which;
        if (key == 13) {
            return finish();
        } else if (key == 32) {
            $(this).val($(this).val().trim() + " ");
            return false;
        }
    }).blur(function() {
        return finish();
    }).autoGrowInput({
        comfortZone: 5,
        minWidth: 10,
        maxWidth: 140
    }).focus();
    return false;
}

/**
 * Shows the error div in the popup with the specified message. This will disappear on the next click
 */

function showError(text) {
    $("#errors").html("");
    var error = $("<strong>Error: </strong>")
    $("#errors").show().append(error).append(text);
}

/**
 * Recreates the accordion and makes it sortable again. Re-jquery-ifies the buttons. This is necessary after most
 * UI manipulations to keep things from breaking.
 */

function refreshAccordion() {
    $("#tasks").accordion('destroy').accordion({
        header: "> div > h3",
        collapsible: true,
        active: false,
        autoHeight: false
    }).sortable({
        axis: "y",
        handle: "h3",
        update: saveList
    });
    $("button").button();
}

/**
 * Persists the current list of tasks after an add/delete/reordering. Does not deal with the tabs themselves, just
 * modifies localStorage to reflect the current state of the UI.
 */

function saveList(event, ui) {
    getUser(function(user) {
        var oldTasks = user.tasks;
        var newTasks = [];
        var list = $(".task_name > a > span > .name_text");
        $.each(list, function(i, val) {
            newTasks.push(oldTasks.slice(indexOfTask(oldTasks, $(val).html()))[0]);
        });
        user.tasks = newTasks;
        setUser(user);
    });
}

/**
 * Clears and resets the list of tasks based on the passed 'tasks.'
 */

function setTasksView(tasks) {
    $("#tasks").html("");
    $.each(tasks, function(i, task) {
        if (task)
            addTaskView(tasks, task);
    });
}

/**
 * Adds an accordion element based on the specified task.
 */

function addTaskView(tasks, task) {
    var tabs = task.tabs;
    var update = task.update;
    var taskDiv = $("<div></div>");
    var taskContents = $("<div></div>");
    taskContents.addClass("task_contents");

    taskDiv.addClass("task");
    taskDiv.attr("id", "task_name_" + task.name);

    // create the tasks's title
    var h3 = $("<h3></h3>");
    h3.addClass("task_name");
    var nameAnchor = $("<a></a>");
    nameAnchor.attr("href", "#");
    var nameTextSpan = $("<span></span>");
    nameTextSpan.addClass("name_text");
    nameTextSpan.text(unescape(task.name));
    var editSpan = $("<span></span>");
    editSpan.addClass("ui-icon ui-icon-pencil icon-title");
    editSpan.unbind('click');
    editSpan.click(function() { return editTitle(tasks, task, $(this), taskContents); });
    var nameSpan = $("<span></span>");
    nameSpan.append(nameTextSpan);
    nameSpan.append(editSpan);
    nameAnchor.append(nameSpan);
    h3.append(nameAnchor);
    taskDiv.append(h3);

    var loadAnchor = $("<a></a>");
    loadAnchor.addClass("io");

    loadAnchor.html("Save");
    loadAnchor.click(function() {
        saveTask(task.name, false, true);
        return false;
    });

    var saveAnchor = $("<a></a>");
    saveAnchor.addClass("io");

    // otherwise, show "Load"
    saveAnchor.html("Load");
    saveAnchor.click(function() {
        loadTask(task);
        return false;
    });

    nameAnchor.append(loadAnchor);
    nameAnchor.append(saveAnchor);

    chrome.windows.getCurrent(null, function(window) {
        // display the element differently depending on if the current task is active in the current window.
        chrome.extension.sendMessage({
            type: "window_active",
            name: task.name,
            window: window.id
        }, function(response) {
            if (response.response) {
                var recordSpan = $("<span></span>");
                recordSpan.attr('id', 'recording');
                recordSpan.addClass("ui-icon ui-icon-bullet icon-title");
                recordSpan.attr('title', 'This task is active in this window and live syncing is disabled. Changes to your current tabs will not be saved automatically.');
                if (task.update) {
                    recordSpan.addClass('ui-icon-red');
                    recordSpan.attr('title', 'This task is active in this window and live syncing is enabled. Changes to your current tabs will be saved live.');
                }
                nameSpan.append(recordSpan);
            }
        });
    });

    var description = $('<p></p>');
    description.addClass('description');
    if (task.description) {
        description.text(task.description);
    } else {
        description.text('Click to add a description');
        description.addClass('no_description');
    }

    var editDescription = function(element) {
        var input = $('<input>');
        if (!description.hasClass('no_description')) {
            input.val(description.text());
        }
        input.attr('type', 'text');
        input.addClass('task-name-edit edit-input-centered');
        description.html(input);
        var finish = function() {
            getUser(function(user) {
                user.tasks[indexOfTask(user.tasks, task.name)].description = input.val();
                setUser(user, false);
            });
            if (input.val()) {
                description.text(input.val()); 
                description.removeClass('no_description');
            } else {
                description.text('Click to add a description');
                description.addClass('no_description');
            }

        }
        input.
            blur(finish).
            keypress(function(e) {
                if (e.keyCode == 13) {
                    finish();      
                }
            }).
            click(function() {return false;}).
            focus();
    }
    description.click(function() { editDescription($(this)); });

    taskContents.append(description);

    // Add the list of tabs with the text showing the title and the title/href showing the url. 
    var list = $("<ul></ul>");
    list.attr("class", "tablist");
    $.each(tabs, function(id, tab) {
        var li = $("<li></li>");
        var a = $("<a></a>");
        var favicon = $("<img />");
        var deleteIcon = $('<span></span>');
        deleteIcon.addClass('ui-icon ui-icon-close');
        deleteIcon.click(function(event) {
            var button = $(this);
            button.parent().remove();
            getUser(function(user) {
                var objtask = user.tasks[indexOfTask(user.tasks, task.name)];
                var tab = getTab(objtask.tabs, button.siblings('a').attr('href'));
                delete objtask.tabs[tab];
                setUser(user);
            });
        }).hover(function(event) {
            $(this).toggleClass('ui-icon-close');
            $(this).toggleClass('ui-icon-circle-close');
        });
        a.attr("href", tab.url);
        a.attr("target", "_blank");
        a.attr("title", tab.url);
        favicon.attr("src", tab.favicon);
        favicon.attr("width", "16px");
        favicon.attr("height", "16px");
        a.append(favicon);
        if (tab.title.length > 30) {
            a.append(tab.title.substring(0, 30) + "...");
        } else {
            a.append(tab.title);
        }
        li.append(a);
        li.append(deleteIcon);
        list.append(li);
        li.click(function(event) {
            chrome.tabs.create({url: tab.url, active: true});
            return false;
        });
    });
    taskContents.append(list);

    var optionsDiv = $("<div></div>");
    optionsDiv.addClass("optionsDiv");

    // add a remove button to the inside of the task element.
    var removeButton = $("<button>Remove Task</button>");
    removeButton.click(function() {
        removeTask(task.name);
        return false;
    });

    var buttonId = task.name + "_sync_button";

    var label = $("<label></label>");
    var span = $("<span></span>");
    span.addClass("ui-icon icon-button");
    span.addClass(task.update? "ui-icon-check" : "ui-icon-radio-on");
    label.append(span);
    label.append("Update Live");
    label.attr("for", buttonId);
    var syncButton = $("<input />");
    syncButton.attr("id", buttonId);
    syncButton.attr("type", "checkbox");
    if (task.update) syncButton.attr("checked", "checked");
    syncButton.val(task.name);
    
    syncButton.change(function() {
        setUpdate(label, $(this));
    });

    optionsDiv.append(removeButton);
    optionsDiv.append(syncButton);
    optionsDiv.append(label);
    taskContents.append(optionsDiv);

    taskDiv.append(taskContents);
    $("#tasks").append(taskDiv);
    
    syncButton.button();
    removeButton.button();

    refreshAccordion();
}

/**
 * event handler for removing a task. Accepts the name as a parameter. Finds the index of the task and removes it
 * from the UI and persisted state.
 */

function removeTask(name) {
    getUser(function(user) {
        var index = indexOfTask(user.tasks, name);
        user.tasks.splice(index, 1);
        setUser(user);
        var div = $("#task_name_" + name);
        if (div.hasClass("active_task")) {
            $("#auto_update").hide();
        }
        div.remove();
        setTasksView(user.tasks);
    });
}

/**
 * Loads the specified task in a new window.
 */

function loadTask(task) {
    var urls = new Array();
    $.each(task.tabs, function(id, tab) {
        urls.push(tab.url);
    });
    if (task.update)
        deleteTabsFromTask(task);
    chrome.windows.create({
        url: urls,
        focused: true
    }, function(window) {
        saveTask();
        addToUpdater(window, task.name);
    });
}

/**
 * Handler for when the active task's sync option is toggled. Changes the button state and whether the task is updated in the
 * persisted state.
 */

function setUpdate(label, checkbox) {
    var enabled = checkbox.attr("checked");
    if (enabled) {
        $('#recording').attr('title', 'This task is active in this window and live syncing is enabled. Changes to your current tabs will be saved live.');
        $('#recording').addClass('ui-icon-red');
    } else {
        $('#recording').attr('title', 'This task is active in this window and live syncing is disabled. Changes to your current tabs will not be saved automatically.');
        $('#recording').removeClass('ui-icon-red');
    }
    getUser(function(user) {
        user.tasks[indexOfTask(user.tasks, checkbox.val())].update = enabled;
        label.children().children().removeClass("ui-icon-check, ui-icon-radio-on");
        label.children().children().addClass(enabled? "ui-icon-check" : "ui-icon-radio-on");
        setUser(user);
    });
}

/**
 * Notifies background.js that the task is active so that it will update the persisted state if it
 * is supposed to.
 */

function addToUpdater(window, name) {
    chrome.extension.sendMessage({
        type: "load_task",
        name: name,
        window: window.id,
    }, function() {});
}

/**
 * Stub abstracts the request to the background page. Takes a callback: myFun(tasks), tasks will be
 * the array of tasks, equivalent to localStorage["tasks"]
 */
function setUser(user, immediate) {
    chrome.extension.sendMessage({
        type: "set_user",
        user: user,
        immediate: immediate
    }, function() {});
}

function getUser(callback) {
    chrome.extension.sendMessage({
        type: "get_user"
    }, function(response) {
        callback(response);
    });
}

function deleteTabsFromTask(task) {
    chrome.extension.sendMessage({
        type: "delete_tabs",
        task: task
    }, function() {});   
}

/**
 * Saves a task with the specified name. If the task is new, makes a new Task for it, otherwise it updates
 * the old task with the specified name.
 */

function saveTask(name, isNew, immediate) {
    if (!name) {
        showError("Please enter a task name");
        return;
    }
    getUser(function(user) {
        if (!user.tasks) {
            user.tasks = [];
        }

        if (isNew && indexOfTask(tasks, name) >= 0) {
            showError("A task with that name already exists");
            return;
        } else {
            $("#task_name").attr("value", "");
        }

        chrome.windows.getCurrent({
            populate: true
        }, function(window) {
            var tabs = getTabsFromWindow(window);
            var task = isNew ? {
                name: escape(name),
                update: false,
                description: ''
            } : user.tasks[indexOfTask(user.tasks, name)];
            task.tabs = tabs;
            if (isNew) {
                user.tasks.push(task);
            }
            addToUpdater(window, name);
            setTasksView(user.tasks);
            setUser(user, immediate);
            //$("#tasks").accordion("option", "activate", 0);
        });
    });
}