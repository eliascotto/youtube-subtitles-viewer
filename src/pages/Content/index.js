
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.setVideoTime) {
    const video = document.getElementsByTagName('video')[0]
    video.currentTime = parseFloat(request.setVideoTime)
  }
})
