const mongoose = require('mongoose');

const retainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    serverId: { type: Number, required: true },
    serverName: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    retainers: [retainerSchema]
});

module.exports = mongoose.model('User', userSchema);
