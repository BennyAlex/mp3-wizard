const jsonStorage = requireNode('electron-json-storage')

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
    if(this._initDone) return this._wordsToRemove
    else return this._initStorage()
  }
  static set wordsToRemove(value) {
    this._wordsToRemove = value
    return value
  }

  static _initStorage() {
    jsonStorage.has('wordsToRemove', (error, hasKey) => {
      if (error) throw error;

      if (!hasKey) {
        jsonStorage.set('wordsToRemove', defaultWordsToRemove, error => {
          if (error) throw error
        })
        this.wordsToRemove = defaultWordsToRemove
      }
      else if (hasKey) {
        jsonStorage.get('wordsToRemove', (error, data) => {
          if (error) throw error
          this.wordsToRemove = data
        })
      }
    })
    this._initDone = true
    return this.wordsToRemove
  }
}

