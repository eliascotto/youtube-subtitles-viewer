import '../../assets/img/icon16.png'
import '../../assets/img/icon48.png'
import '../../assets/img/icon128.png'
import '../../assets/img/icon256.png'

chrome.runtime.onInstalled.addListener(function () {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
        chrome.declarativeContent.onPageChanged.addRules([{
            conditions: [
                new chrome.declarativeContent.PageStateMatcher({
                    pageUrl: {
                        // regex for matching youtube video page
                        // https://regexr.com/3dj5t
                        urlMatches: '((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?',
                    }
                })
            ],
            actions: [new chrome.declarativeContent.ShowPageAction()]
        }])
    })
})
