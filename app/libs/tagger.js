const path = requireNode('path')
const storage = requireNode('electron-json-storage')
const guessMetadata = requireNode('guess-metadata');

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


const removeUnwantedWords = (fileName) => {
  return new Promise(resolve => {
      storage.get('wordsToRemove', function (error, data) {
        if (error) {
          console.log('storage has no wordsToRemove Key. Please run initTagger before using the tagger')
          data = defaultWordsToRemove
        }
        data.forEach(function (item) {
          fileName = fileName.replace(new RegExp(item, 'gim'), '')
        })
        return resolve(fileName)
      })
    }
  )
}

const tagger = (filePath) => {
  return new Promise(resolve => {
    let fileNameWithoutExt = path.basename(filePath).split('.mp3')[0]
    removeUnwantedWords(fileNameWithoutExt).then(filename => {
      if (filename) {
        const tags = guessMetadata(filename)
        if (tags.artist && tags.title) {
          // remove Tracknumber
          const tracknumMatch = tags.artist.match(/^(?:(\d+)\s+)?(.+)$/);
          if (tracknumMatch[1]) {
            tags.artist = tracknumMatch[2];
          }
          return resolve({path: filePath, tags: tags})
        }
      }
      resolve()
    })
  })
}

const initTagger = () => {
  storage.has('wordsToRemove', (error, hasKey) => {
    if (error) throw error;
    else if (!hasKey) {
      storage.set('wordsToRemove', defaultWordsToRemove, error => {
        if (error) throw error
      })
    }
  })
}

export {initTagger, tagger}
