const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose')
const passport = require('passport')
const localStrategy = require('passport-local').Strategy;


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
app.get('/users/:userId', (req, res) => {
    const loggedInUser = req.params.userId;
    User.find({ _id: { $ne: loggedInUser } }).then((users) => {
        res.status(200).json(users);
    }).catch((err) => {
        console.log("Error retrieveing users", err);
        res.status(500).json({ message: "Error retrieveing users" });
    })
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
        await User.findByIdAndUpdate(currentUserId,{
            $push:{sentFriendRequests:selectedUserId}
        });
        res.status(200);
    }
    catch (error) {
        res.status(500);
    }
});

// enpoint to show all the friend requests
app.get('/friend-request/:userId',async(req,res)=>
{
    try
    {
        const {userId}=req.params;
        // fetch document based on userId
        const user=await User.findById(userId).populate("friendRequests","name email image").lean();
        const friendRequests=user.friendRequests;
        res.status(200).json(friendRequests);
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({message:"Internal server error"});
    }
});