import React, { Fragment } from 'react'
import YTSubtitles from '../../youtube-caption-scraper'
import { youtube_parser, secToHMS } from './utils'
import './Popup.css'

class Popup extends React.PureComponent {
  constructor(props) {
    super(props)

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      // async callback
      const tab = tabs[0]
      this.setState({ tab })
      // first load all the confirguration saved into the storage
      this.loadConfigFromStorage(store => {
        // check if the current tab is changed using the url
        this.clearStorage(store, tab, (newStore) => {
          // load captions from storage or get them with a new request
          this.onTabsQuery(tab, newStore)
        })
      })
    })

    window.addEventListener('scroll', () => {
      // save the scroll amount on every window scroll event
      const scroll = document.documentElement.scrollTop
      chrome.storage.local.set({ scroll })
    })

    this.state = {
      tab: null,
      captions: null,
      search: '',
      languages: [],
      noContent: false,
    }
  }

  // load extension configuration from local storage
  loadConfigFromStorage(cb) {
    chrome.storage.local.get([
      'language',
      'languages',
      'captions',
      'tab',
      'scroll',
      'noContent',
    ], res => cb(res))
  }

  // check if the current tab is changed comparing the current url
  // with the saved tab, in case is different clear storage and pass a null
  // object to the callback
  clearStorage(store, tab, cb) {
    if (!store.tab ||
      (store.tab && tab.url.localeCompare(store.tab.url) !== 0)
    ) {
      chrome.storage.local.clear(() => {
        cb(null)
      })
    } else {
      cb(store)
    }
  }

  restoreSettings(store) {
    if (store.noContent) {
      return this.setState({ noContent: true })
    }

    // save languages settings in both app state and chrome storage
    this.setState({
      language: store.language,
      languages: store.languages,
      captions: store.captions,
    })
    if (store.scroll) {
      // restore scroll position
      window.scroll(0, store.scroll)
    }
  }

  retrieveSubtitles(tab) {
    const url = tab.url
    const videoID = youtube_parser(url)

    // load languages list async
    YTSubtitles.getLanguagesList(videoID).then((info) => {
      const languageSettings = {
        language: info[0],
        languages: info
      }
      // save languages settings in both app state and chrome storage
      this.setState(languageSettings)
      // retrieve subtitles using the first available language
      YTSubtitles
        .getSubtitles(languageSettings.language)
        .then((captions) => {
          this.setState({ captions })
          // save all the settings into the local storage
          chrome.storage.local.set({
            ...languageSettings,
            captions,
            tab,
          })
        })
    }).catch(error => {
      console.error(error)
      this.setState({ noContent: true })
      chrome.storage.local.set({ noContent: true, tab })
    })
  }

  onTabsQuery(tab, store) {
    if (store && (store.language || store.noContent)) {
      this.restoreSettings(store)
    } else {
      this.retrieveSubtitles(tab)
    }
  }

  // filter captions using the current search
  // and add <mark> tags to the text match
  filterCaptions() {
    const { captions, search } = this.state
    let filteredCaptions = captions

    if (search && search.length > 0) {
      // map and filter using the reduce function and pushing the new
      // object into the filtered array
      filteredCaptions = captions.reduce((filtered, caption) => {
        if (caption.text.includes(search)) {
          const parts = caption.text.split(search)
          const mark = `<mark>${search}</mark>`

          filtered.push({
            ...caption,
            // join the text with the marked search text
            text: parts[0] + mark + parts[1]
          })
        }
        return filtered
      }, [])
    }

    return filteredCaptions
  }


  handleSearchInputChange = (event) => {
    this.setState({ search: event.target.value })
  }

  handleTimeClick = (caption) => {
    const { tab } = this.state
    // ask to the Content Script to change the currentTime
    // of the video player element
    chrome.tabs.sendMessage(tab.id, { setVideoTime: caption.start })
  }

  handleLanguageClick = (language) => {
    // save current language in both app state and chrome storage
    this.setState({ language })
    // load the new subtitles
    YTSubtitles.getSubtitles(language).then((captions) => {
      this.setState({ captions })
      chrome.storage.local.set({ language, captions })
    })
  }

  renderCaptions() {
    const filteredCaptions = this.filterCaptions()

    return (
      <ul className="YTCaption-menu">
        {filteredCaptions.map(caption => (
          <li
            className="YTCaption-menu-item"
            key={`YTCaption-menu-item-${caption.start}${caption.dur}`}>
            <div
              className="Caption-sec"
              onClick={this.handleTimeClick.bind(this, caption)}>
              {secToHMS(caption.start)}
            </div>
            <p
              className="Caption-text"
              dangerouslySetInnerHTML={{ __html: caption.text }} />
          </li>
        ))}
      </ul>
    )
  }

  renderLanguages() {
    const { languages, language } = this.state
    const cleanLang = (l) => l.language.replace('+', ' ')

    if (language) {
      return (
        <Fragment>
          {cleanLang(language)}
          <ul className="YTCaption-language-menu">
            {languages && languages.length > 0 && languages
              .filter(l => l.languageCode !== language.languageCode)
              .map(l => (
                <li
                  className="YTCaption-language-menu-item"
                  key={`YTCaption-language-menu-item${l.languageCode}`}
                  onClick={this.handleLanguageClick.bind(this, l)}>
                  {cleanLang(l)}
                </li>
              ))
            }
          </ul>
        </Fragment>
      )
    }
  }

  renderNoContent() {
    return (
      <div className="YTCaption">
        <div className="YTCaption-body no-content">
          No caption available for this video.
        </div>
      </div>
    )
  }

  render() {
    const { captions, languages, noContent } = this.state

    if (noContent) {
      return this.renderNoContent()
    }

    return (
      <div className="YTCaption">
        <header className="YTCaption-header">
          <form className="YTCaption-form">
            <div className="YTCaption-search-container">
              <div className="YTCaption-search-input-container">
                <input
                  onChange={this.handleSearchInputChange}
                  autoFocus
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  tabIndex="0"
                  type="text"
                  spellCheck="false"
                  placeholder="Search"
                  aria-label="Search"
                  role="combobox" />
              </div>
              <div slot="search-container"></div>
            </div>
          </form>
          <div className={
            `YTCaption-language${languages.length > 0 ? ' single' : ''}`}>
            {this.renderLanguages()}
          </div>
        </header>
        <div className={`YTCaption-body${captions ? '' : ' loading'}`}>
          {captions ? this.renderCaptions() : (<span>Loading...</span>)}
        </div>
      </div>
    )
  }
}

export default Popup
