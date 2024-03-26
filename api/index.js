require('dotenv').config();
const { s3Upload } = require('./s3Service');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const passport = require('passport')
const sharp = require('sharp');
const events=require('./events');
const { createServer } = require("http");
const { Server } = require("socket.io");
const app = express();

const port = 8000;
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*"
    }
});

const jwt = require('jsonwebtoken');

mongoose.connect(process.env.DATABASE_CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to mongoDb');
}).catch((err) => {
    console.log('Error connecting MongoDb', err);
});

httpServer.listen(port, () => {
    console.log('Server running on port', port);
});


let onlineUsers = [];
let onlineRooms = {};
let windowLeft = {};

const User = require('./models/user');
const Message = require('./models/message');
const UnseenMessage = require('./models/unseenMessage');

const userSetup=(socket)=>
{
    socket.on(events.SETUP, (userData) => {
        socket.join(userData._id);
        if (!onlineUsers.some((user) => user.userId === userData._id)) {
            // if user is not added before
            onlineUsers.push({ userId: userData._id, socketId: socket.id });
            console.log("new user is here!", onlineUsers);
        }
        socket.emit("connected");

        // send each rooms that user got active again
        let userConnectedRooms = onlineRooms[userData._id];
        if (userConnectedRooms) {
            userConnectedRooms.forEach((item) => {
                socket.to(item[1]).emit(events.ONLINE, true);
            });
        }
    });
}

const joinRoom=(socket)=>
{
    socket.on(events.JOIN_CHAT, ({ room, senderId, recepientId }) => {
        socket.join(room);
        if (onlineRooms.hasOwnProperty(senderId))
            onlineRooms[senderId].add([recepientId, room]);
        else
            onlineRooms[senderId] = new Set([recepientId, room]);

        if (onlineRooms.hasOwnProperty(recepientId))
            onlineRooms[recepientId].add([senderId, room]);
        else
            onlineRooms[recepientId] = new Set([senderId, room]);

        console.log("User joined room", room);
    });
}

const typingEvent=(socket)=>
{
    socket.on(events.TYPING, (room) => {
        socket.in(room).emit(events.TYPING);
    });

    socket.on(events.STOP_TYPING, (room) => {
        socket.in(room).emit(events.STOP_TYPING);
    });
}

const onlinerCheck=(socket)=>
{
    socket.on(events.CHECK_ONLINE, (userId) => {
        if (onlineUsers.some((user) => user.userId === userId)) {
            socket.emit(events.ONLINE, true);
        }
        else {
            socket.emit(events.ONLINE, false);
        }
    });
}

const emitReadMessage=(socket)=>
{
    socket.on(events.READ_MSG, async (messageBody) => {
        const {cid,senderId,recepientId,timeStamp,messageType,roomId,imageFile,messageText}=messageBody;

        // Initialize variables for message details
        let imgUrl = "false";
        
        if(imageFile)
        {
            const binaryData = Buffer.from(imageFile.uri, 'base64');
                // const imageBuffer = value._data;

                // Process the image buffer using sharp
                const compressedImageBuffer = await sharp(binaryData)
                    .resize({ width: 400 })
                    .jpeg({ quality: 40 })
                    .toBuffer();

                // Upload the compressed image to S3
                const result = await s3Upload({ buffer: compressedImageBuffer, originalname: imageFile.name });
                imgUrl = result.Location;
        }
        // Create and save the new message
        const newMessage = new Message({ cid, senderId, recepientId, messageType, message: messageText, timeStamp, imageUrl: imgUrl, messageSeen: "sent" });
        await newMessage.save();

        const message = { _id: newMessage._id, cid, senderId: { _id: senderId, name: 'unknown' }, recepientId, messageType, message: messageText, timeStamp, imageUrl: imgUrl, messageSeen: "sent" };


        // Emit the chat message to the recipient and send status to the sender
        socket.to(roomId).emit(events.RECEIVE_MSG_STATUS, { messageId: newMessage._id, cid, status: "sent" });
        socket.to(roomId).emit(events.MESSAGE, message);
    });
}

const emitUnreadMessage=(socket)=>
{
    socket.on(events.UNREAD_MSG, async (messageBody) => {
        
        const {cid,senderId,recepientId,timeStamp,messageType,roomId,imageFile,messageText}=messageBody;

        // Initialize variables for message details
        let imgUrl = "false";
        
        if(imageFile)
        {
            const binaryData = Buffer.from(imageFile.uri, 'base64');
            // const imageBuffer = value._data;

            // Process the image buffer using sharp
            const compressedImageBuffer = await sharp(binaryData)
                .resize({ width: 400 })
                .jpeg({ quality: 40 })
                .toBuffer();

            // Upload the compressed image to S3
            const result = await s3Upload({ buffer: compressedImageBuffer, originalname: imageFile.name });
            imgUrl = result.Location;
        }

        // Create and save the new message
        const newMessage = new UnseenMessage({ cid, senderId, recepientId, messageType, message: messageText, timeStamp, imageUrl: imgUrl, messageSeen: "sent" });
        await newMessage.save();
        
        console.log("sent",roomId);
        const message = { _id: 'unknown', cid, senderId: { _id: senderId, name: 'unknown' }, recepientId, messageType, message: messageText, timeStamp, imageUrl: imgUrl, messageSeen: "sent" };
        // Emit the chat message status to the recipient and send status to the sender
        
        io.to(roomId).emit(events.RECEIVE_MSG_STATUS, { messageId: "", cid, status: "sent" });
        socket.to(roomId).emit(events.MESSAGE, message);
    });
}

const emitMessageStatus=(socket)=>
{
    socket.on(events.SEND_MSG_STATUS, async ({ messageId, cid, roomId, status }) => {
        try {

            // send status delivered to sender
            socket.to(roomId).emit(events.RECEIVE_MSG_STATUS, { messageId, cid, status });

            if (messageId !== "unknown") {
                // Update the message directly in the database
                await Message.findOneAndUpdate(
                    { _id: messageId }, // Filter for the message by its ID
                    { $set: { messageSeen: "seen" } }, // Update the messageSeen field
                    { new: true } // Return the updated document
                );
            }
            else {
                // Update the message directly in the database
                await Message.findOneAndUpdate(
                    { cid: cid }, // Filter for the message by its ID
                    { $set: { messageSeen: "seen" } }, // Update the messageSeen field
                    { new: true } // Return the updated document
                );
            }
            // send status seen to sender
            socket.to(roomId).emit(events.RECEIVE_MSG_STATUS, { messageId, cid, status: "seen" });
        }
        catch (error) {
            console.log(error, "Error in sending message status");
        }
    });
}

const userWindowActivity=(socket)=>
{
    socket.on(events.LEFT_WINDOW, ({ roomId, userId, recepientId }) => {

        socket.leave(roomId);
        windowLeft[userId] = false;
        io.to(recepientId).emit(events.USER_JOINED, false); // Emitting to recepientId
    });

    socket.on(events.JOINED_WINDOW, ({ roomId, userId, recepientId }) => {
        socket.join(roomId);
        windowLeft[userId] = true;
        io.to(recepientId).emit(events.USER_JOINED, true); // Emitting to recepientId
    });
}

const checkUserRoomConnectivity=(socket)=>
{
    socket.on(events.CHECK_JOINED, ({ userId, roomId }) => {
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets && roomSockets.size === 1 || !windowLeft[userId])
            socket.emit(events.USER_JOINED, false);
        else
            socket.emit(events.USER_JOINED, true);
    });
}

const newMessageCountEmitter=(socket)=>
{
    socket.on(events.SEND_UNREAD_MSG_COUNT, (userId) => {
        if (userId) {
            io.to(userId).emit(events.UNREAD_MSG_COUNT);
        } else {
            console.log("User is not online"); // Handle the case where the user is not online
        }
    });
}

const sendFriendRequestEvent=(socket)=>
{
    socket.on(events.SEND_FRIEND_REQ, async ({ senderId, recepientId }) => {
        try {
            const user = await User.findOne({ _id: senderId });
            io.to(senderId).emit(`receive-friend-request-status-${recepientId}`, "pending");
            io.to(recepientId).emit(events.RECEIVE_FRIEND_REQ, { _id: senderId, name: user.name, email: user.email, image: user.image });
        } catch (error) {
            console.error(error);
        }
    });
}

const emitFriendRequestStatus=(socket)=>
{
    socket.on(events.FRIEND_REQ_ACCEPT, ({ senderId, recepientId }) => {
        io.to(senderId).emit(`receive-friend-request-status-${recepientId}`, "friend");
    });
}

const userDisconnectedEvent=(socket)=>
{
    socket.on(events.DIS_CONN, async () => {
        let userId = null;
        onlineUsers.forEach((user) => {
            if (user.socketId === socket.id) {
                userId = user.userId;
                return;
            }
        });

        if (userId) {
            // update last seen of disconneted user
            await User.updateOne({ _id: userId }, { $set: { lastSeen: Date.now() } });
        }

        // send each rooms that user got inactive
        let userConnectedRooms = onlineRooms[userId];
        if (userConnectedRooms) {
            userConnectedRooms.forEach((item) => {
                socket.to(item[1]).emit(events.ONLINE, false);
            });

            // delete data but if we delete then if user re join from background. Then we lose data. 
            // delete onlineRooms[userId];
        }
        // remove user from active users
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);

        console.log("User Disconnected", socket.id);
    });
}

io.on(events.CONN, (socket) => {
    console.log("connected to socket.io");
    
    // connect userId to socket
    userSetup(socket);

    // connect to a room
    joinRoom(socket);

    // typing event listener
    typingEvent(socket);

    // check if user is online
    onlinerCheck(socket);
    
    // emit message if user if connected to room
    emitReadMessage(socket);

    // emit message if user is not connected to room
    emitUnreadMessage(socket);
    
    // message status emitter - [delivered,seen]
    emitMessageStatus(socket);
    
    // user window activity - [left,join]
    userWindowActivity(socket);
    
    // check if both user's are connected
    checkUserRoomConnectivity(socket);
    
    // emit new message count
    newMessageCountEmitter(socket);
    
    // emitter related to sending friend request
    sendFriendRequestEvent(socket);
    
    // emit accepted friend request status
    emitFriendRequestStatus(socket);
    
    // event when user get's disconnected
    userDisconnectedEvent(socket);
});


// endpoint for the registration of user
app.post('/register', async (req, res) => {
    const { name, email, password, image } = req.body;

    //create new user request
    const binaryData = Buffer.from(image, 'base64');

    // Upload the compressed image to S3
    const result = await s3Upload({ buffer: binaryData, originalname: name + ".jpeg" });

    const newUser = new User({ name, email, password, image: result.Location });

    // save the user to database
    newUser.save().then(() => {
        res.status(200).json({ message: "User registered successfully" });
    }).catch((err) => {
        console.log("Error registering the user", err);
        res.status(500).json({ message: "Error registering the user!" });
    });
});

// function to create token
const createToken = (userId) => {
    const payload = {
        userId
    };
    const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn: "1h" });
    return token;
}

// endpotin for the login of user
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(404).json({ message: "Missing credentials" });
    }

    // check for the user in the backend
    User.findOne({ email }).then((user) => {
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // compare the password
        if (user.password != password) {
            return res.status(404).json({ message: "Invalid credentials" });
        }
        const token = createToken(user._id);
        res.status(200).json({ token });
    }).catch((err) => {
        console.log("Error in finding the user", err);
        res.status(500).json({ message: "Internal server error" });
    });
});

// endpoint to access single user based on user Id
app.get('/user/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findOne({ _id: userId });
        res.status(200).json(user);
    } catch (error) {
        console.log("Error retrieving user", error);
        res.status(500).json({ message: "Error retrieving user" });
    }
});

// endpoint to access all the users except current logged in user
app.get('/users/:userId', async (req, res) => {
    try {
        const loggedInUserId = req.params.userId;

        const users = await User.find({ _id: { $ne: loggedInUserId } });

        // Define a function to determine the status
        const getStatus = (user) => {
            if (user.friendRequests.includes(loggedInUserId)) {
                return "pending";
            } else if (user.friends.includes(loggedInUserId)) {
                return "friend";
            } else {
                return "";
            }
        };

        // Map through the users and add the status field
        const usersWithStatus = users.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
            status: getStatus(user)
        }));

        res.status(200).json(usersWithStatus);
    } catch (error) {
        console.log("Error retrieving users", error);
        res.status(500).json({ message: "Error retrieving users" });
    }
});

// get last seen time of a user
app.get('/last-seen/:userId', async (req, res) => {
    try {
        const loggedInUserId = req.params.userId;
        const user = await User.findOne({ _id: loggedInUserId });
        res.status(200).json({ lastSeen: user.lastSeen });
    }
    catch (err) {
        console.log("Error getting last seen time", err);
        res.status(500).json({ message: "Error getting last seen time" });
    }
});

// endpoint to send a request to a user
app.post('/friend-request', async (req, res) => {
    const { currentUserId, selectedUserId } = req.body;
    try {
        // update the recepients friendRequests Array
        await User.findByIdAndUpdate(selectedUserId, {
            $addToSet: { friendRequests: currentUserId }
        });

        // update the senders sendFriendRequests Array
        await User.findByIdAndUpdate(currentUserId, {
            $addToSet: { sentFriendRequests: selectedUserId }
        });
        res.status(200).json({ message: "Friend request sent successfully" });
    }
    catch (error) {
        console.log("Error sending friend request")
        res.status(500).json({ message: "Error sending friend request" });
    }
});

// enpoint to show all the friend requests
app.get('/friend-request/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // fetch document based on userId
        const user = await User.findById(userId).populate("friendRequests", "name email image").lean();
        const friendRequests = user.friendRequests;
        res.status(200).json(friendRequests);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to accept friend request
app.post('/friend-request/accept', async (req, res) => {
    try {
        const { senderId, recepientId } = req.body;

        //retrieve the documenet of the sender and the recepient
        const sender = await User.findById(senderId);
        const recepient = await User.findById(recepientId);
        sender.friends.push(recepientId);
        recepient.friends.push(senderId);
        recepient.friendRequests = recepient.friendRequests.filter((request) => request.toString() !== senderId.toString());
        sender.sentFriendRequests = sender.sentFriendRequests.filter((request) => request.toString() !== recepientId.toString());
        await sender.save();
        await recepient.save();
        res.status(200).json({ message: "Friend request accepted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to all access all the friends of logged in users
app.get('/accepted-friends/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).populate("friends", "name email image");
        const acceptedFriends = user.friends;
        res.status(200).json(acceptedFriends);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// endpoint to get userDetails to design chat room header
app.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        //fetch the user data
        const recepient = await User.findById(userId);
        res.status(200).json(recepient);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to fetch the messages between two users in the chatroom
app.get("/messages/:senderId/:recepientId", async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;

        // Find and populate messages from the Message collection
        const readMessages = await Message.find({
            $or: [
                { senderId: senderId, recepientId: recepientId },
                { senderId: recepientId, recepientId: senderId }
            ]
        }).populate("senderId", "_id name");

        // Find unread messages from UnseenMessage collection
        const unreadMessages = await UnseenMessage.find({
            senderId: senderId,
            recepientId: recepientId
        }).populate("senderId", "_id name");

        // Merge read and unread messages into a single array
        let combinedMessages = [...readMessages, ...unreadMessages.map(message => ({
            cid: message.cid,
            senderId: message.senderId,
            recepientId: message.recepientId,
            messageType: message.messageType,
            message: message.message,
            timeStamp: message.timeStamp,
            imageUrl: message.imageUrl,
            messageSeen: message.messageSeen
        }))];

        // Sort combined messages based on timeStamp
        combinedMessages.sort((a, b) => new Date(a.timeStamp) - new Date(b.timeStamp));

        res.status(200).json({ messages: combinedMessages });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ messages: "Internal server error" });
    }
});


// endpoint to delete the messages
app.post('/delete-messages', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: "Invalid request" });
        }
        await Message.deleteMany({ cid: { $in: messages } });
        await UnseenMessage.deleteMany({ cid: { $in: messages } });
        res.status(200).json({ message: "Messages deleted successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to get last message of a chat with timestamp
app.get("/last-message/:senderId/:recepientId", async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;
        const messages = await Message.find({
            $or: [
                { senderId: senderId, recepientId: recepientId },
                { senderId: recepientId, recepientId: senderId }]
        }).sort({ timeStamp: -1 }) // Sort by timestamp in descending order
            .limit(1); // Limit to only the most recent message
        res.status(200).json({ messages: messages[0] });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
})


app.get("/unread-message-count/:senderId/:recepientId", async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;
        const messagesCount = await UnseenMessage.countDocuments({ senderId: recepientId, recepientId: senderId });
        console.log(messagesCount)
        res.status(200).json({ message: messagesCount });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/unread-last-message/:senderId/:recepientId", async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;
        const messages = await UnseenMessage.find({
            $or: [{ senderId: recepientId, recepientId: senderId }]
        }).sort({ timeStamp: -1 }) // Sort by timestamp in descending order
            .limit(1); // Limit to only the most recent message
        res.status(200).json({ messages: messages[0] });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.get("/mark-unread-messages/:senderId/:recepientId", async (req, res) => {
    try {
        const { senderId, recepientId } = req.params;
        const messages = await UnseenMessage.find({
            $or: [{ senderId: recepientId, recepientId: senderId }]
        });
        if (messages.length > 0) {
            // Map messages to a format suitable for insertion
            const messagesToInsert = messages.map(message => ({
                cid:message.cid,
                senderId: message.senderId,
                recepientId: message.recepientId,
                messageType: message.messageType,
                message: message.message,
                timeStamp: message.timeStamp,
                imageUrl: message.imageUrl,
                messageSeen: "delivered"
            }));

            // Insert all messages in one go
            await Message.insertMany(messagesToInsert);

            // Delete the messages from UnseenMessage collection
            await UnseenMessage.deleteMany({
                $or: [{ senderId: recepientId, recepientId: senderId }]
            });
        }
        res.status(200).json({ messages: "Message marked successfully" });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
