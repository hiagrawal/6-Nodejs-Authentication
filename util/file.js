const fs = require('fs');

//unlink deletes the file from the path specified
const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if(err){
            throw err;
        }
    })
}

exports.deleteFile = deleteFile;