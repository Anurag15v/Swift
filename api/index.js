require('dotenv').config();
const { s3Upload } = require('./s3Service');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const passport = require('passport')
const localStrategy = require('passport-local').Strategy;
const sharp = require('sharp');
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

mongoose.connect("mongodb+srv://anuragvaibhav7:Anurag%401@cluster0.m9mb0pl.mongodb.net/", {
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

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

let onlineUsers = [];
let onlineRooms = {};
let windowLeft={};


io.on("connection", (socket) => {
    console.log("connected to socket.io");

    socket.on("setup", (userData) => {
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
                socket.to(item[1]).emit("online", true);
            });
        }
    });

    socket.on("join-chat", ({ room, senderId, recepientId }) => {
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

    socket.on("typing", (room) => {
        socket.in(room).emit("typing");
    });

    socket.on("stop-typing", (room) => {
        socket.in(room).emit("stop-typing");
    });

    // check if user is online
    socket.on("check-online", (userId) => {
        if (onlineUsers.some((user) => user.userId === userId)) {
            socket.emit("online", true);
        }
        else {
            socket.emit("online", false);
        }
    });

    socket.on("read-message", async (obj) => {
        // Get the FormData from obj.data
        const formDataParts = obj._parts;
        // Initialize variables for message details
        let senderId, roomId, recepientId, messageType, messageText = null;
        let imgUrl = "false";
        // Iterate over the entries of the FormData parts using for...of loop
        for (const [key, value] of formDataParts) {
            if (key === "senderId") {
                senderId = value;
            } else if (key === "recepientId") {
                recepientId = value;
            }
            else if (key === "roomId") {
                roomId = value;
            } else if (key === "messageType") {
                messageType = value;
            } else if (key === "messageText") {
                messageText = value;
            } else if (key === "imageFile") {
                // Process image file (if present)
                // You can use logic to compress and upload the image here
                // For example:
                const binaryData = Buffer.from(value.uri, 'base64');
                // const imageBuffer = value._data;

                // Process the image buffer using sharp
                const compressedImageBuffer = await sharp(binaryData)
                    .resize({ width: 400 })
                    .jpeg({ quality: 40 })
                    .toBuffer();

                // Upload the compressed image to S3
                const result = await s3Upload({ buffer: compressedImageBuffer, originalname: value.name });
                imgUrl = result.Location;
            }
        }
        // Create and save the new message
        const newMessage = new Message({ senderId, recepientId, messageType, message: messageText, timeStamp: new Date(), imageUrl: imgUrl });
        await newMessage.save();
        const message = { _id: 'unknown', senderId: { _id: senderId, name: 'xxx' }, recepientId, messageType, message: messageText, timeStamp: new Date(), imageUrl: imgUrl };
        // Emit the chat message to the recipient
        io.to(roomId).emit("message", message);
    });

    socket.on("unread-messages", async (obj) => {
        // Get the FormData from obj.data
        const formDataParts = obj._parts;
        // Initialize variables for message details
        let senderId, roomId, recepientId, messageType, messageText = null;
        let imgUrl = "false";
        // Iterate over the entries of the FormData parts using for...of loop
        for (const [key, value] of formDataParts) {
            if (key === "senderId") {
                senderId = value;
            } else if (key === "recepientId") {
                recepientId = value;
            }
            else if (key === "roomId") {
                roomId = value;
            } else if (key === "messageType") {
                messageType = value;
            } else if (key === "messageText") {
                messageText = value;
            } else if (key === "imageFile") {
                // Process image file (if present)
                // You can use logic to compress and upload the image here
                // For example:
                const binaryData = Buffer.from(value.uri, 'base64');
                // const imageBuffer = value._data;

                // Process the image buffer using sharp
                const compressedImageBuffer = await sharp(binaryData)
                    .resize({ width: 400 })
                    .jpeg({ quality: 40 })
                    .toBuffer();

                // Upload the compressed image to S3
                const result = await s3Upload({ buffer: compressedImageBuffer, originalname: value.name });
                imgUrl = result.Location;
            }
        }
        // Create and save the new message
        const newMessage = new UnseenMessage({ senderId, recepientId, messageType, message: messageText, timeStamp: new Date(), imageUrl: imgUrl });
        await newMessage.save();
        const message = { _id: 'unknown', senderId: { _id: senderId, name: 'xxx' }, recepientId, messageType, message: messageText, timeStamp: new Date(), imageUrl: imgUrl };
        
        // Emit the chat message to the recipient
        io.to(roomId).emit("message", message);
    });

    socket.on("user-left-window",({userId,recepientId})=>
    {
        windowLeft[userId]=false;
        io.to(recepientId).emit("user-joined", false); // Emitting to recepientId
    });

    socket.on("user-joined-window",({userId,recepientId})=>
    {
        windowLeft[userId]=true;
        io.to(recepientId).emit("user-joined", true); // Emitting to recepientId
    });

    socket.on("check-joined", ({ userId,roomId }) => {
        const roomSockets = io.sockets.adapter.rooms.get(roomId);
        if (roomSockets.size === 1 || !windowLeft[userId])
            socket.emit("user-joined", false);
        else
            socket.emit("user-joined", true);
    });

    socket.on("send-unread-message-count", (userId) => {

        if (userId) {
            io.to(userId).emit("unread-message-count");
        } else {
            console.log("User is not online"); // Handle the case where the user is not online
        }
    });

    socket.on("disconnect", async () => {
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
                socket.to(item[1]).emit("online", false);
            });

            // delete data but if we delete then if user re join from background. Then we lose data. 
            // delete onlineRooms[userId];
        }
        // remove user from active users
        onlineUsers = onlineUsers.filter((user) => user.socketId !== socket.id);

        console.log("User Disconnected", socket.id);
    });
});

const User = require('./models/user');
const Message = require('./models/message');
const UnseenMessage = require('./models/unseenMessage');

// endpoint for the registration of user
app.post('/register', async(req, res) => {
    const { name, email, password, image } = req.body;
    
    //create new user request
    const binaryData = Buffer.from(image, 'base64');
    
    // Upload the compressed image to S3
    const result = await s3Upload({ buffer: binaryData, originalname: name+".jpeg" });
    
    console.log(result.Location);

    const newUser = new User({ name, email, password, image:result.Location });

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

// endpoint to access all the users except current logged in user
app.get('/users/:userId', async (req, res) => {
    try {
        const loggedInUserId = req.params.userId;

        const users = await User.find({ _id: { $ne: loggedInUserId } });

        // Define a function to determine the status
        const getStatus = (user) => {
            if (user.sentFriendRequests.includes(loggedInUserId)) {
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
            $push: { friendRequests: currentUserId }
        });

        // update the senders sendFriendRequests Array
        await User.findByIdAndUpdate(currentUserId, {
            $push: { sentFriendRequests: selectedUserId }
        });
        res.status(200);
    }
    catch (error) {
        res.status(500);
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

// Configure multer for handling file uploads
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//       cb(null, "files/"); // Specify the desired destination folder
//     },
//     filename: function (req, file, cb) {
//       // Generate a unique filename for the uploaded file
//       const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
//       cb(null, uniqueSuffix + "-" + file.originalname);
//     },
//   });


// endpoint to post messages and store it in backend
app.post('/messages', upload.single('imageFile'), async (req, res) => {
    try {
        const { senderId, recepientId, messageType, messageText } = req.body;
        let imgUrl = null;
        if (messageType === "image") {
            // logic
            // Compress the image using sharp
            const compressedImageBuffer = await sharp(req.file.buffer)
                .resize({ width: 400 }) // Resize the image as needed
                .jpeg({ quality: 40 })   // Set JPEG quality
                .toBuffer();
            req.file.buffer = compressedImageBuffer;
            const result = await s3Upload(req.file);
            imgUrl = result.Location;
        }
        const newMessage = new Message({ senderId, recepientId, messageType, message: messageText, timeStamp: new Date(), imageUrl: imgUrl });
        await newMessage.save();
        res.status(200).json({ message: 'Message sent successfully' });
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
            senderId: message.senderId,
            recepientId: message.recepientId,
            messageType: message.messageType,
            message: message.message,
            timeStamp: message.timeStamp,
            imageUrl: message.imageUrl
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
        await Message.deleteMany({ _id: { $in: messages } });
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
                senderId: message.senderId,
                recepientId: message.recepientId,
                messageType: message.messageType,
                message: message.message,
                timeStamp: message.timeStamp,
                imageUrl: message.imageUrl
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
