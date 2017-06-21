import Ember from "ember"
const {RSVP} = Ember

export default Ember.Controller.extend({
  paths: [],
  filesRenamed: 0,
  showFinishDialog: false,

  loadFiles(paths) {
    const klaw = requireNode('klaw')
    const through2 = requireNode('through2')
    const nodePath = requireNode('path')

    const excludeDirsAndHiddenFilesAndCheckIfMp3 = through2.obj(function (item, enc, next) {
      if (!item.stats.isDirectory() && nodePath.extname(item.path) === '.mp3' && nodePath.basename(item.path)[0] !== '.') {
        this.push(item)
      }
      else {
        console.log('not: ', item.path)
      }
      next()
    })

    const ignoreRenamedFolder = function (item) {
      return nodePath.basename(item) !== 'renamed'
    }

    const _this = this
    const promises = []
    paths.forEach(function (item) {
      promises.push(
        new RSVP.Promise(function (resolve) {
          klaw(item, {filter: ignoreRenamedFolder})
            .pipe(excludeDirsAndHiddenFilesAndCheckIfMp3)
            .on('readable', function () {
              let item
              while ((item = this.read())) {
                // TODO: check if file alredy exists
                _this.rename(item).then(function () {
                  console.log(_this.get('filesRenamed'))
                  resolve()
                })
              }
            })
            .on('error', function (err, item) {
              console.error(err.message)
              console.error(item.path) // the file the error occurred on
            })
        }))
    })

    return RSVP.allSettled(promises).then(function (array) {
      console.log('finish', _this.get('filesRenamed'), array)
    }, function (error) {
      console.error(error)
    })
  },

  moveFile(oldFilePath, newFileName) {
    const nodePath = requireNode('path')
    let filedir = nodePath.dirname(oldFilePath)
    let newFilePath = filedir + '\\renamed\\' + newFileName
    const _this = this
    const fs = requireNode('fs-extra')
    return new RSVP.Promise(function (resolve, reject) {
      fs.ensureDir(filedir + '\\renamed').then(() => {
        fs.move(oldFilePath, newFilePath).then(() => {
            _this.incrementProperty('filesRenamed')
            resolve()
          }
        ).catch(error => {
            console.error(error)
            reject(error)
          }
        )
      }).catch(error => {
        console.error(error)
        reject(error)
      })
    })
  },

  clearString(str) {
    let lastChar = str.charAt(str.length - 1)
    if (['.', ',', ' ', '/', '\\'].indexOf(lastChar) > 0) {
      str = str.slice(0, -1)
    }
    return str
  },

  rename(file) {
    const _this = this
    const jsmediatags = requireNode('jsmediatags')
    return new RSVP.Promise(function (resolve, reject) {
      new jsmediatags.Reader(file.path)
        .setTagsToRead(["title", "artist", "picture", "album", "comment", "lyrics"])
        .read({
          onSuccess: function (tag) {
            let artist = tag.tags.artist
            let title = tag.tags.title
            //let album = tag.tag.album
            if (artist && title) {
              _this.moveFile(file.path, _this.clearString(artist) + ' - ' + _this.clearString(title) + '.mp3').then(function () {
                resolve()
              })
            }
            else {
              resolve()
            }
          },
          onError: function (error) {
            console.log(error.type, ', ', error.info, ', file:', file)
            reject(error)
          }
        })
    })
  },


  actions: {
    onChooseFolderButtonClick() {
      const {dialog} = requireNode('electron').remote
      let paths = dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']})
      this.set('paths', paths)
    },

    onRenameButtonClick() {
      this.loadFiles(this.get('paths'))
      this.set('showFinishDialog', true)
    },

    closeFinishDialog() {
      this.set('showFinishDialog', false)
      this.set('filesRenamed', 0)
    }
  }
})
