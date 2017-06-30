const settings = requireNode('electron-settings')

const defaultWordsToRemove = [
  'free_mp3_download',
  'free_download',
  'out_now',
  'free mp3 download',
  'free download',
  'premiere',
  'out now',
  'outnow',
  'free_dl',
  'free dl',
  'preview',
  'download',
  'mp4',
  'music_video',
  'official_video',
  'music video',
  'offical video',
  'video'
]

//Storage class which can hold some values and also can safe them on the users drive
export default class Storage {
  static _wordsToRemove = []
  static _initDone = false

  static get wordsToRemove() {
    if (this._initDone) return this._wordsToRemove
    else return this._initStorage()
  }

  static set wordsToRemove(value) {
    this._wordsToRemove = value
    return value
  }

  static setAndSaveWordsToRemove(value) {
    this._wordsToRemove = value
    settings.set('wordsToRemove', value)
    return value
  }

  static _initStorage() {
    if (settings.has('wordsToRemove')) {
      this.wordsToRemove = settings.get('wordsToRemove')
    }
    else {
      settings.set('wordsToRemove', defaultWordsToRemove)
      this.wordsToRemove = defaultWordsToRemove
    }
    this._initDone = true
    return this.wordsToRemove
  }
}

