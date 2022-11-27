const multer = require('multer')
const fs = require('fs')



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dir = './uploads';
        if (file.fieldname.startsWith('guide')) {
            dir += '/guide-elements'
        }
        else if (file.fieldname.startsWith('trip')) {
            dir += '/trips'
        }
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})


const upload = multer({ storage: storage })

// images: [http://localhost:3030/images/******* ]
function deleteImages(images) {
    for (let i of images) {
        let filename = './uploads/' + i.replace(process.env.API_URL + '/images/', '')
        try {
            fs.unlink(filename, (err) => {
            })
        } catch (err) { }
    }
}
module.exports = { upload, deleteImages }