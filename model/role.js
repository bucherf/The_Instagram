var mongoose = require('mongoose');

var roleSchema = new mongoose.Schema({
	name: String,
});

module.exports = {
	Image: new mongoose.model('Role', roleSchema)
}