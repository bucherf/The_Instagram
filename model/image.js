var mongoose = require('mongoose');

var imageSchema = new mongoose.Schema({
	title: String,
    caption: String,
	image:{data: Buffer, contentType: String},
    likes: Number
});

module.exports = {
	Image: new mongoose.model('Image', imageSchema)
}

