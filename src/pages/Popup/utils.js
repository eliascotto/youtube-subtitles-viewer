//
// retrieve YouTube video ID using string url
// https://stackoverflow.com/questions/3452546/how-do-i-get-the-youtube-video-id-from-a-url/27728417#27728417
//
export const youtube_parser = (url) => {
  const regExp = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/
  const match = url.match(regExp)
  return match[1]
}

//
// convert time to HH:MM:SS
// https://stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
//
export const secToHMS = (secs) => {
  const sec_num = parseInt(secs, 10)
  const hours = Math.floor(sec_num / 3600)
  const minutes = Math.floor(sec_num / 60) % 60
  const seconds = sec_num % 60
  return [hours, minutes, seconds]
    .map(v => v < 10 ? '0' + v : v)
    .filter((v, i) => v !== '00' || i > 0)
    .join(':')
}
