const mg = require('mongoose');

const retainerSchema = new mg.Schema({
    userID: String,
    retainerName: String,
});

module.exports = mg.model('Retainer', retainerSchema);