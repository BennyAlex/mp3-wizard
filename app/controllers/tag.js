import Ember from "ember";
const fs = requireNode('fs-extra')
const klaw = requireNode('klaw')
const jsmediatags = requireNode("jsmediatags")
const nodePath = requireNode('path')
const through2 = requireNode('through2')
const nodeID3 = requireNode('node-id3')

export default Ember.Controller.extend({
  delimiter: '-',
  filesTagged: 0,

  loadFilesFromFolder(folderPath) {
    //TODO: multiple paths

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

  formatString(str, removeTracknumber) {
    str = str.replace(/_+/igm, ' ')
    str = str.trim()
    const badChars = ['free mp3 download', 'free download', 'premiere', 'out now', 'outnow', 'free dl', '%', '§', 'preview', 'download']
    badChars.forEach(function (item) {
      str = str.replace(new RegExp(item, 'gi'), '')
    })
    str = str.replace(/[[({][\s\d!?]*[\])}]/igm, '') // remove empty [],{},() or containing only digits
    str = str.replace(/\s\s+/g, ' ') //remove multiple whitespaces
    if (removeTracknumber) str = str.replace(/\d+\s+/i, '')
    return str
  },

  getTags(path){
    let fileNameWithExt = nodePath.basename(path)
    let fileNameWithoutExt = fileNameWithExt.split('.mp3')
    let fileName = fileNameWithoutExt[0]
    if (fileName) {
      let delimiter = this.get('delimiter')
      let infos = fileName.split(delimiter)
      if (infos.length === 2) {
        let artist = this.formatString(infos[0], true)
        let title = this.formatString(infos[1])
        if (title.toLocaleLowerCase().search('feat') < 0 && title.toLocaleLowerCase().search('ft.') < 0 && isNaN(artist)) {
          if (artist && title) {
            return {path: path, tags: {title: title, artist: artist}}
          }
        }
      }
    }
  },

  writeTags(tags, file) {
    return nodeID3.write(tags, file)
  },

  loadTags(file) {
    const _this = this
    return new Promise((resolve) => {
      new jsmediatags.Reader(file)
        .setTagsToRead(["title", "artist"])
        .read({
          onSuccess: function (tag) {
            if (!(tag.tags.title && tag.tags.artist)) {
              resolve(_this.getTags(file))
            }
            resolve()
          },
          onError: function (error) {
            console.log('error while reading tags in: ' + error)
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
    onChooseFolderButtonClick() {
      const {dialog} = requireNode('electron').remote
      let paths = dialog.showOpenDialog({properties: ['openDirectory', 'multiSelections']})
      this.set('paths', paths) // TODO: multiple paths
    },

    onTagButtonClick() {
      const _this = this;
      return Promise.all(_this.get('paths').map(path => {
          return new Promise(resolve1 => {
            _this.loadFilesFromFolder(path).then(files => {
              return Promise.all(files.map(file => {
                return new Promise(resolve2 => {
                  return _this.loadTags(file).then(fileAndTags => {
                    if (fileAndTags) {
                      let res = _this.writeTags(fileAndTags.tags, fileAndTags.path)
                      if (res) {
                        _this.moveFile(fileAndTags.path).then(file => {
                          resolve2(file)
                        })
                      } else {
                        resolve2()
                      }
                    }
                  })
                })
              })).then(results => {
                resolve1(results)
              })
            })
          })
        })
      ).then(result => console.log('finish', result))
    }
  }
})


/*  --------------------

 return Promise.all(_this.get('paths').map(path => {
 return _this.loadFilesFromFolder(path)
 }))
 .then(foldersAndFiles => {
 return Promise.all(foldersAndFiles.map(files => {
 return Promise.all(files.map(file => {
 return _this.loadTags(file)
 }))
 }))
 })
 .then(itemsAndTags => itemsAndTags.filter(item => item !== undefined))
 .then(itemsAndTags => {
 const itemsForMove = []
 itemsAndTags.forEach(item => {
 let res = _this.writeTags(item.tags, item.file)
 if (res) itemsForMove.push(item.file)
 })
 return itemsForMove
 })
 .then(items => {
 return Promise.all(items.map(item => _this.moveFile(item)))
 })
 .then(items => {
 const finishedItems = items.filter(item => item !== undefined)
 console.log('finish', items, finishedItems.length)
 _this.set('filesTagged', finishedItems.length)
 _this.set('showFinishDialog', true)
 })
 .catch((error) => {
 console.log(error)
 })
 }
 }
 */

