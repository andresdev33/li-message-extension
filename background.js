chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url && tab.url.includes("linkedin.com/in")) {
        const linkedInProfileId = tab.url.split("in/")[1];

        // send a message to contentScript.js
        chrome.tabs.sendMessage(tabId, {
            type: "NEW",
            linkedInProfileId: decodeURIComponent(linkedInProfileId.replace('/', ''))
        });
    }
});
