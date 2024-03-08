require('dotenv').config();
const {s3Upload} =require('./s3Service');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const passport = require('passport')
const localStrategy = require('passport-local').Strategy;
const sharp = require('sharp');

const app = express();
const port = 8000;
const cors = require('cors');
app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());

const jwt = require('jsonwebtoken');

mongoose.connect("mongodb+srv://anuragvaibhav7:Anurag%401@cluster0.m9mb0pl.mongodb.net/", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to mongoDb');
}).catch((err) => {
    console.log('Error connecting MongoDb', err);
});

app.listen(port, () => {
    console.log('Server running on port', port);
});

const User = require('./models/user');
const Message = require('./models/message');
const multer = require('multer');

// endpoint for the registration of user
app.post('/register', (req, res) => {
    const { name, email, password, image } = req.body;
    //create new user request
    const newUser = new User({ name, email, password, image });

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

const storage=multer.memoryStorage();
const upload = multer({ storage: storage });

// endpoint to post messages and store it in backend
app.post('/messages', upload.single('imageFile'), async (req, res) => {
    try {
        const { senderId, recepientId, messageType, messageText } = req.body;
        let imgUrl=null;
        if(messageType==="image")
        {
            // logic
            // Compress the image using sharp
            const compressedImageBuffer = await sharp(req.file.buffer)
                .resize({ width: 400 }) // Resize the image as needed
                .jpeg({ quality: 40 })   // Set JPEG quality
                .toBuffer();
            req.file.buffer=compressedImageBuffer;
            const result=await s3Upload(req.file);
            imgUrl=result.Location;
        }
        const newMessage = new Message({ senderId, recepientId, messageType, message:messageText, timeStamp: new Date(), imageUrl:imgUrl });
        await newMessage.save();
        res.status(200).json({message:'Message sent successfully'});
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to get userDetails to design chat room header
app.get('/user/:userId',async(req,res)=>
{
    try
    {
        const {userId}=req.params;
        //fetch the user data
        const recepient=await User.findById(userId);
        res.status(200).json(recepient);
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to fetch the messages between two users in the chatroom
app.get("/messages/:senderId/:recepientId",async(req,res)=>
{
    try
    {
        const {senderId,recepientId}=req.params;
        const messages=await Message.find({
            $or:[
                {senderId:senderId,recepientId:recepientId},
                {senderId:recepientId,recepientId:senderId}]
        }).populate("senderId","_id name");
        res.status(200).json(messages);
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// endpoint to delete the messages
app.post('/delete-messages',async(req,res)=>
{
    try
    {
        const {messages}=req.body;
        if(!Array.isArray(messages) || messages.length===0)
        {
            return res.status(400).json({message:"Invalid request"});
        }
        await Message.deleteMany({_id:{$in:messages}});
        res.status(200).json({message:"Messages deleted successfully"});
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// endpoint to get last message of a chat with timestamp
app.get("/last-message/:senderId/:recepientId",async(req,res)=>
{
    try
    {
        const {senderId,recepientId}=req.params;
        const messages=await Message.find({
            $or:[
                {senderId:senderId,recepientId:recepientId},
                {senderId:recepientId,recepientId:senderId}]
        }) .sort({ timeStamp: -1 }) // Sort by timestamp in descending order
        .limit(1); // Limit to only the most recent message
        res.status(200).json({messages:messages[0]});
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
})
