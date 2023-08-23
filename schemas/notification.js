const mg = require('mongoose');

const notificationSchema = new mg.Schema({
    userID: String,
    channelID: String,
    itemID: String,
    homeServer: String,
    retainer: String,
    notified: Boolean,
});

module.exports = mg.model('Notification', notificationSchema);