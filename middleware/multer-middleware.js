const multer = require('multer')
const fs = require('fs')



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let dir = `./uploads`;

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Math.round(Math.random() * 1E9) + '.png'
        console.log(file);
        cb(null, file.fieldname + '_' + uniqueSuffix)
    }
})


const upload = multer({ storage: storage })

module.exports = upload