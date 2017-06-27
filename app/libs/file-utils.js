const path = requireNode('path')
const fs = requireNode('fs-extra')
const klaw = requireNode('klaw')
const through2 = requireNode('through2')

const checkIfFileNotExistsOrRename = (filePath) => {
  if (!filePath) throw 'filePath missing!'
  const basePath = path.dirname(filePath)
  const ext = path.extname(filePath)
  const fileName = path.basename(filePath, ext)
  return new Promise((resolve, reject) => {
    for (let i = 1; i < 10; i++) {
      if (fs.existsSync(filePath)) {
        filePath = basePath + '\\' + fileName + ' (' + i + ')' + ext
      }
      else return resolve(filePath)
    }
    reject('error: file already exists too often!')
  })
}


const loadFilesFromFolder = (folderPath, ignoreFolder, onlyExt) => {
  if (!folderPath) throw 'folderPath missing!'
  function ignoreFolderFilter(item) {
    if (ignoreFolder) return path.basename(item) !== ignoreFolder
    else return true
  }

  const excludeDirAndOnlyExt = through2.obj(function (item, enc, next) {
    if (onlyExt) {
      if (!item.stats.isDirectory() && path.extname(item.path) === onlyExt) this.push(item)
    }
    else {
      if (!item.stats.isDirectory()) this.push(item)
    }
    next()
  })

  const items = []
  return new Promise((resolve, reject) => {
    klaw(folderPath, {filter: ignoreFolderFilter})
      .pipe(excludeDirAndOnlyExt)
      .on('data', function (item) {
        items.push(item.path) // only items of none ignored folders will reach here
      })
      .on('error', function (error, item) {
        reject('error:', error.message, 'file:', item.path)
      })
      .on('end', function () {
        resolve(items) // array of files without directories
      })
  })
}


const moveFile = (filePath, targetDir, newFileName) => {
  if (!targetDir || !filePath) throw 'filePath or targetDir missing!'
  return new Promise((resolve, reject) => {
      let newFile
      if (newFileName && targetDir) newFile = targetDir + '\\' + newFileName
      else newFile = targetDir + '\\' + path.basename(filePath)
      fs.ensureDir(targetDir).then(() => {
        checkIfFileNotExistsOrRename(newFile).then(newFilePath => {
          fs.move(filePath, newFilePath).then(resolve(filePath))
        })
      }).catch(error => {
        reject('error:', error, 'file:', filePath)
      })
    }
  )
}


export {loadFilesFromFolder, moveFile}
