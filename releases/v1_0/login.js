chrome.extension.sendRequest({
    type: "auth",
    auth: $("pre").text()
});