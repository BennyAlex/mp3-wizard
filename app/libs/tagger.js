const path = requireNode('path')
const storage = requireNode('electron-json-storage')
const guessMetadata = requireNode('guess-metadata');

const removeUnwantedWords = (fileName) => {
  return new Promise((resolve, reject) => {
      storage.get('wordsToRemove', function (error, data) {
        if (error) reject(error)
        data.forEach(function (item) {
          fileName = fileName.replace(new RegExp(item, 'gim'), '')
        })
        return resolve(fileName)
      })
    }
  )
}

const tagger = (fielPath) => {
  return new Promise(resolve => {
    let fileNameWithoutExt = path.basename(fielPath).split('.mp3')[0]
    removeUnwantedWords(fileNameWithoutExt).then(filename => {
      if (filename) {
        const tags = guessMetadata(filename)
        if (tags.artist && tags.title) {
          // remove Tracknumber
          const tracknumMatch = tags.artist.match(/^(?:(\d+)\s+)?(.+)$/);
          if (tracknumMatch[1]) {
            tags.artist = tracknumMatch[2];
          }
          return resolve({path: fielPath, tags: tags})
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
      storage.set('wordsToRemove', defaultWordsToRemove, error => {
        if (error) throw error
      })
    }
  })
}

export {initTagger, tagger}
