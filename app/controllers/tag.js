import Ember from "ember";
const {Controller, inject} = Ember;
const fs = requireNode('fs-extra')
const klaw = requireNode('klaw')
const jsmediatags = requireNode("jsmediatags")
const nodePath = requireNode('path')
const through2 = requireNode('through2')
const nodeID3 = requireNode('node-id3')
const storage = requireNode('electron-json-storage');
const guessMetadata = requireNode('guess-metadata');
const {dialog} = requireNode('electron').remote

export default Controller.extend({
  filesTaggedAndMoved: 0,
  wordsToRemove: [],
  loading: inject.service(),

  init() {
    const _this = this

    storage.has('wordsToRemove', function (error, hasKey) {
      if (error) throw error;

      if (hasKey) {
        storage.get('wordsToRemove', function (error, data) {
          if (error) throw error;
          _this.set('wordsToRemove', data)
        });
      }
      else {
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
        storage.set('wordsToRemove', defaultWordsToRemove, function (error) {
          if (error) throw error;
          _this.set('wordsToRemove', defaultWordsToRemove)
        });
      }
    });
  },

  loadFilesFromFolder(folderPath) {
    function ignoreTaggedFolder(item) {
      return nodePath.basename(item) !== 'tagged'
    }

    const excludeDirAndOnlyMp3 = through2.obj(function (item, enc, next) {
      if (!item.stats.isDirectory() && nodePath.extname(item.path) === '.mp3') this.push(item)
      next()
    })

    const items = []
    return new Promise((resolve, reject) => {
      klaw(folderPath, {filter: ignoreTaggedFolder})
        .pipe(excludeDirAndOnlyMp3)
        .on('data', function (item) {
          items.push(item.path)
          // only items of none ignored folders will reach here
        })
        .on('error', function (err, item) {
          console.log(err.message)
          console.log(item.path) // the file the error occurred on
          reject()
        })
        .on('end', function () {
          //console.dir(items) // => [ ... array of files without directories]
          resolve(items)
        })
    })
  },

  removeUnwantedWords(fileName) {
    //todo: remove tracknumbers at filebegin
    this.get('wordsToRemove').forEach(function (item) {
      fileName = fileName.replace(new RegExp(item, 'gi'), '')
    })
    return fileName
  },

  getTags(path) {
    let fileNameWithoutExt = nodePath.basename(path).split('.mp3')[0]
    let filename = this.removeUnwantedWords(fileNameWithoutExt)

    if (filename) {
      const tags = guessMetadata(filename)
      if (tags.artist && tags.title) {
        return {path: path, tags: {title: tags.title, artist: tags.artist}}
      }
      else {
        return "no tags found"
      }
    }
  },

  loadTags(file) {
    const _this = this
    return new Promise((resolve) => {
      new jsmediatags.Reader(file)
        .setTagsToRead(["title", "artist", "album", "year", "genre", "picture", "lyrics"])
        .read({
          onSuccess: function (tag) {
            // remove ID3 Tags != 2.3.0
            let version = parseInt(tag.version.replace('.', ''))
            let majaor = tag.major

            if (version !== 23 || majaor !== 3) {
              nodeID3.removeTags(file)
              resolve({path: file, tags: tag.tags})
            }
            else if (!(tag.tags.title && tag.tags.artist)) {
              // file doesnt have an artist or a title -> lets tag it
              resolve(_this.getTags(file))
            }
            else {
              console.log('file already tagged: ', file)
              resolve('file already tagged')
            }
          },
          onError: function () {
            // for the file exists no suitable tag reader, so the file dosnt have tags -> lets tag it
            resolve(_this.getTags(file))
          }
        })
    })
  },

  moveFile(path) {
    return new Promise((resolve, reject) => {
      let fileName = nodePath.basename(path)
      let newFilePath = nodePath.dirname(path) + '\\tagged'
      let newFile = newFilePath + '\\' + fileName
      fs.ensureDir(newFilePath).then(fs.move(path, newFile)).then(() => {
        resolve(path)
      }).catch(error => {
        console.error(error)
        reject(error)
      })
    })
  },

  actions: {
    closeFinishDialog() {
      this.set('showFinishDialog', false)
      this.set('filesTaggedAndMoved', 0)
      this.set('loading.processedFiles', 0)
      this.set('paths', [])
    },

    onChooseFolderButtonClick() {
      this.set('paths', dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']}))
    },

    onTagButtonClick() {
      this.set('loading.isLoading', true)
      const _this = this;
      const paths = _this.get('paths')

      return Promise.all(paths.map(path => {
        return new Promise(resolve1 => {
          return _this.loadFilesFromFolder(path).then(files => {
            return Promise.all(files.map(file => {
              return new Promise((resolve2, reject2) => {
                _this.loadTags(file).then(fileAndTags => {
                  if (fileAndTags.tags.title && fileAndTags.tags.artist) {
                    let res = nodeID3.write(fileAndTags.tags, fileAndTags.path)
                    if (res) {
                      _this.moveFile(fileAndTags.path).then(file => {
                        _this.incrementProperty('filesTaggedAndMoved')
                        _this.incrementProperty('loading.processedFiles')
                        resolve2(file)
                      })
                    }
                    else {
                      reject2()
                    }
                  }
                  else {
                    resolve2()
                  }
                })
              })
            })).then(result => {
              resolve1(result)
            })
          })
        })
      }))
        .then(result => {
          console.log('finish', result)
          _this.set('loading.isLoading', false)
          _this.set('showFinishDialog', true)
        })
        .catch(error => console.log(error))
    }
  }
})
