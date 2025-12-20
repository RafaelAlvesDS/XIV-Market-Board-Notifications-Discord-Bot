const mongoose = require('mongoose');

const trackedItemSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Discord ID
    itemId: { type: Number, required: true },
    itemName: { type: String, required: true },
    retainerName: { type: String, required: true },
    homeServerId: { type: Number, required: true },
    homeServerName: { type: String, required: true },
    lastKnownPrice: { type: Number, default: 0 },
    lastKnownQuantity: { type: Number, default: 0 },
    listingID: { type: String, default: null },
    isHQ: { type: Boolean, default: false },
    isUndercut: { type: Boolean, default: false }
});

// Index for faster lookups when processing WebSocket events
trackedItemSchema.index({ itemId: 1, homeServerId: 1 });

module.exports = mongoose.model('TrackedItem', trackedItemSchema);
