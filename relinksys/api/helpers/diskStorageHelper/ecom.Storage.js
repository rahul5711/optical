var multer = require("multer")
var path = require("path")
var fs = require("fs")

const dateObj = new Date()
const month = dateObj.getUTCMonth() + 1
const day = dateObj.getUTCDate()
const year = dateObj.getUTCFullYear();
// console.log('----------->', year, month, day)
const store = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('req');
        
        if (!fs.existsSync('./uploads/' )) {
            fs.mkdirSync('./uploads/' )
        }
        if (!fs.existsSync('./uploads/' + year)) {
            fs.mkdirSync('./uploads/' + year)
        }
        if (!fs.existsSync('./uploads/' + year + '/' + month)) {
            fs.mkdirSync('./uploads/' + year + '/' + month)
        }
        if (!fs.existsSync('./uploads/' + year + '/' + month + '/' + 'ecom')) {
            fs.mkdirSync('./uploads/' + year + '/' + month + '/' + 'ecom')
        }
        cb(null, './uploads/' + year + '/' + month + '/' + 'ecom')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now().toString() + path.extname(file.originalname))
        // cb(null, req.body.docname + '.jpg')
    }
})

exports.storage = multer({ storage: store })


