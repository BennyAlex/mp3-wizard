import Ember from "ember";
import Tagger from "../libs/tagger";
import Storage from "../libs/storage"
import {loadFilesFromFolder, moveFile} from "../libs/file-utils";
const {Controller, inject} = Ember;
const jsmediatags = requireNode("jsmediatags")
const nodeID3 = requireNode('node-id3')
const {dialog} = requireNode('electron').remote


export default Controller.extend({
  filesTaggedAndMoved: 0,
  loading: inject.service(),

  init() {
    Tagger.wordsToRemove = Storage.wordsToRemove
  },

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
              else resolve(Tagger.tag(file))
            }
            else if (!(tag.tags.title && tag.tags.artist)) {
              // file doesnt have an artist or a title -> lets tag it
              resolve(Tagger.tag(file))
            }
            else {
              //file already tagged
              resolve()
            }
          },
          onError: function () {
            // for the file exists no suitable tag reader, so the file dosnt have tags -> lets tag it
            resolve(Tagger.tag(file))
          }
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
