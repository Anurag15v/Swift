const mongoose = require('mongoose');
const unseenMessageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    recepientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    messageType: {
        type: String,
        enum: ['text', 'image','audio']
    },
    message: String,
    imageUrl: String,
    timeStamp: {
        type: Date,
        default: Date.now()
    }
});
const UnseenMessage = mongoose.model('UnseenMessages', unseenMessageSchema);
module.exports = UnseenMessage;