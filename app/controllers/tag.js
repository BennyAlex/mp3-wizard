import Ember from "ember";
import {initTagger, tagger} from "../libs/tagger";
import {loadFilesFromFolder, moveFile} from "../libs/file-utils";
const {Controller, inject} = Ember;
const jsmediatags = requireNode("jsmediatags")
const nodePath = requireNode('path')
const nodeID3 = requireNode('node-id3')
const {dialog} = requireNode('electron').remote


export default Controller.extend({
  filesTaggedAndMoved: 0,
  loading: inject.service(),

  init() {
    initTagger()
  },

  // loadFilesFromFolder(folderPath) {
  //   function ignoreTaggedFolder(item) {
  //     return nodePath.basename(item) !== 'tagged'
  //   }
  //
  //   const excludeDirAndOnlyMp3 = through2.obj(function (item, enc, next) {
  //     if (!item.stats.isDirectory() && nodePath.extname(item.path) === '.mp3') this.push(item)
  //     next()
  //   })
  //
  //   const items = []
  //   return new Promise((resolve, reject) => {
  //     klaw(folderPath, {filter: ignoreTaggedFolder})
  //       .pipe(excludeDirAndOnlyMp3)
  //       .on('data', function (item) {
  //         items.push(item.path)
  //         // only items of none ignored folders will reach here
  //       })
  //       .on('error', function (err, item) {
  //         console.log(err.message)
  //         console.log(item.path) // the file the error occurred on
  //         reject()
  //       })
  //       .on('end', function () {
  //         //console.dir(items) // => [ ... array of files without directories]
  //         resolve(items)
  //       })
  //   })
  // },

  loadTags(file) {
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
              //check if old tags had title and artist
              if (tag.tags.title && tag.tags.artist) resolve({path: file, tags: tag.tags})
              else resolve(tagger(file))
            }
            else if (!(tag.tags.title && tag.tags.artist)) {
              // file doesnt have an artist or a title -> lets tag it
              resolve(tagger(file))
            }
            else {
              //file already tagged
              resolve()
            }
          },
          onError: function () {
            // for the file exists no suitable tag reader, so the file dosnt have tags -> lets tag it
            resolve(tagger(file))
          }
        })
    })
  },

  /*  moveFile(path) {
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
   },*/

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
        let targetDir = path + '\\tagged'
        return new Promise(resolve1 => {
          return loadFilesFromFolder(path, 'tagged', '.mp3').then(files => {
            return Promise.all(files.map(file => {
              return new Promise((resolve2, reject2) => {
                _this.loadTags(file).then(fileAndTags => {
                  if (fileAndTags) {
                    if (fileAndTags.tags.title && fileAndTags.tags.artist) {
                      let res = nodeID3.write(fileAndTags.tags, fileAndTags.path)
                      if (res) {
                        moveFile(fileAndTags.path, targetDir).then(file => {
                          _this.incrementProperty('filesTaggedAndMoved')
                          _this.incrementProperty('loading.processedFiles')
                          resolve2(file)
                        })
                      }
                      else {
                        reject2()
                      }
                    }
                  }
                  resolve2()
                })
              }).catch(error => console.error(error))
            })).then(result => {
              resolve1(result)
            })
          })
        }).catch(error => console.error(error))
      })).then(result => {
        console.log('finish', result)
        _this.set('loading.isLoading', false)
        _this.set('showFinishDialog', true)
      }).catch(error => console.error(error))
    }
  }
})
