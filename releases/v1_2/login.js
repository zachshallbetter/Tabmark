chrome.extension.sendMessage({
    type: "auth",
    auth: $("pre").text()
});