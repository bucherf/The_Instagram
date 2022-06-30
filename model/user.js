var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
	username: String,
    password: String,
	profilPicture: {data: Buffer, contentType: String},
});

module.exports = new mongoose.model('User', userSchema);
