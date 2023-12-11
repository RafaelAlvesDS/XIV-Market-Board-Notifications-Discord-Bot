const mg = require('mongoose');

const listingSchema = new mg.Schema({
    userID: String,
    itemID: String,
    homeServer: String,
    retainer: String,
    listings: Number,
    quantity: Number,
    pricePerUnit: Number,
});

module.exports = mg.model('Listing', listingSchema);