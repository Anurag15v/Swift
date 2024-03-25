const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
    cid:String,
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
    },
    messageSeen:{
        type:String,
        enum:['sent','seen','delivered']
    }
});
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;