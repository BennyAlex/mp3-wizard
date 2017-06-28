const path = requireNode('path')
const guessMetadata = requireNode('guess-metadata');

export default class Tagger {
  static wordsToRemove = []

  static tag(filePath) {
    return new Promise(resolve => {
      let fileNameWithoutExt = path.basename(filePath, '.mp3')
      this.removeUnwantedWords(fileNameWithoutExt).then(filename => {
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

  static removeUnwantedWords(fileName) {
    return new Promise(resolve => {
      let initialFilename = fileName;
      this.wordsToRemove.forEach(function (item) {
        fileName = fileName.replace(new RegExp(item, 'gim'), '')
      })
      if (!fileName) fileName = initialFilename
      return resolve(fileName)
    })
  }
}
