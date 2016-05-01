//chrome.browserAction.disable();

var componentsScripts = {};
var baseVersion = {};

function extractFromComment(scriptData, prefix) {
    var start = scriptData.indexOf(prefix);
    var end = scriptData.indexOf('\n', 5);
    return scriptData.substring(start, end);
}

function getScriptVersion(url, prefix) {
    var version = null;
    $.ajax(url, {
        dataType: 'text',
        async: false,
        success: function (result) {
            version = extractFromComment(result, prefix);
        },
        error: function (err) {
            console.debug(err);
        }
    });
    return version;
}

function urlComparer(urlToCompare) {
    return function(item){
        return item.url === urlToCompare;
    }
}

function trackAtomsVersion(details) {
    if(details.type === 'script' && details.url.indexOf('sarine.viewer') !== -1){
        var tabId = [details.tabId],
            version = getScriptVersion(details.url, "sarine.viewer");
        details.version = version;

        if(!componentsScripts.hasOwnProperty(tabId)){
            componentsScripts[tabId] = [];
        }

        var index = componentsScripts[tabId].findIndex(urlComparer(details.url));

        if(index !== -1){
            componentsScripts[tabId].splice(index, 1);
        }

        componentsScripts[tabId].push(details);
    }
}

function fixVersionName(details){
    var version = details.version.replace('#w', 'widget ').toLowerCase();
    details.version = version;
    return details;
}

function trackAppBundle(details) {
    if(details.type === 'script' && details.url.indexOf('app.bundle') !== -1){
        var tabId = details.tabId,
            isBaseWidget = details.url.toLowerCase().indexOf('basewidget') > -1,
            isBaseDashboard = details.url.toLowerCase().indexOf('basedashboard') > -1,
            prefix = '';
        if(isBaseWidget){
            prefix = '#';
        }else if(isBaseDashboard){
            prefix = 'DASHBOARD';
        }
        var version = getScriptVersion(details.url, prefix);
        details.version = version;

        if(!baseVersion.hasOwnProperty(tabId)){
            baseVersion[tabId] = [];
        }

        var index = baseVersion[tabId].findIndex(urlComparer(details.url));

        if(index !== -1){
            baseVersion[tabId].splice(index, 1);
        }

        baseVersion[tabId] = fixVersionName(details);
    }
}

function isViewerTab(url){
    return url.toLowerCase().indexOf("sarine.com") > -1;
}

function activateTab(url) {
    if(isViewerTab(url)){
        chrome.browserAction.enable();
    }else{
        chrome.browserAction.disable();
    }
}

function initTabDetails(tabId) {
    componentsScripts[tabId] = [];
    baseVersion[tabId] = [];
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        var tab = request.tab;
        if (request.get == "componenetsVersions"){
            sendResponse({components: componentsScripts[tab] });
        } else if (request.get == "appBundleVersion"){
            sendResponse({baseVersion: baseVersion[tab] });
        }
    }
);

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    //initTabDetails(tabId);
    if (changeInfo.status == 'complete'){
        activateTab(tab.url);
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo){
    chrome.tabs.get(activeInfo.tabId, function(currentTab){
        activateTab(currentTab.url);
    })
});

chrome.webRequest.onCompleted.addListener(function(details) {
        trackAppBundle(details);
        trackAtomsVersion(details);
    },
{
    urls: [
        "<all_urls>"
    ]
}
);


