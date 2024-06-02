import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, TextInput, Pressable, Image, BackHandler, TouchableOpacity } from 'react-native'
import React, { useState, useContext, useLayoutEffect, useEffect, useRef } from 'react'
import { Entypo } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import EmojiSelector, { Categories } from 'react-native-emoji-selector';
import { UserType } from '../UserContext'
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import socket from '../socket';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import LottieView from 'lottie-react-native';
import { Audio, RecordingOptionsPresets } from "expo-av";
import uuid from 'react-native-uuid';


const ChatMessagesScreen = () => {
    const [showEmojiSelector, setShowEmojiSelector] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState([]);
    const [recepientData, setRecepientData] = useState({});
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState("");
    const route = useRoute();
    const navigation = useNavigation();
    const { recepientId } = route.params;
    const { userId, setUserId } = useContext(UserType);
    const scrollViewRef = useRef(null);
    const [typing, setTyping] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [online, setOnline] = useState(false);
    const [lastSeenTime, setLastSeenTime] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [imageUri, setImageUri] = useState("");

    const [otherUserStatus, setOtherUserStatus] = useState(false);

    useEffect(() => {

        socket.emit("user-joined-window", { roomId: combinedId(), userId, recepientId });
        // Add listener for incoming messages
        socket.on("message", (receivedMessage) => {

            // Handle incoming message here
            setMessages(prevMessages => [...prevMessages, receivedMessage]);

            // Update state or perform other actions based on the received message
            socket.emit("send-recepient-message-status", { messageId: receivedMessage._id, cid: receivedMessage.cid, roomId: combinedId(), status: "delivered" });
        });

        // Add listener for typing
        socket.on("typing", () => {
            setIsTyping(true);
        });

        // Add listener for typing stopped
        socket.on("stop-typing", () => {
            setIsTyping(false);
        });

        // Add listener to get other user status
        socket.on("user-joined", (status) => {
            setOtherUserStatus(status);
        });

        // Add listener to hear message status
        socket.on("receive-message-status", ({ messageId, cid, status }) => {
            setMessages(prevMessages => {
                // Map over the previous messages and update the messageSeen status for the messages with matching CID
                const updatedMessages = prevMessages.map(message => {
                    // Check if the message's conversation ID matches the provided CID
                    if (message.cid === cid) {
                        // If so, update the messageSeen status
                        return { ...message, messageSeen: status };
                    }
                    // If CID doesn't match, return the original message
                    return message;
                });
                return updatedMessages;
            });
        });

        return () => {
            socket.off("user-joined");
            socket.off("user-joined-window");
            socket.off("receive-message-status");
        }

    }, [userId]);


    const fetchMessages = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/messages/${userId}/${recepientId}`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data.messages);
                // socket.emit("join-chat", { room: combinedId(), senderId: userId, recepientId });
            }
        }
        catch (error) {
            console.log("Error in fetching messages", error);
        }
    }

    const markMessagesSeen = async (messages) => {
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].messageSeen === "delivered") {
                console.log(messages[i].cid);
                socket.emit('send-recepient-message-status', { messageId: messages[i]._id, cid: messages[i].cid, roomId: combinedId(), status: "delivered" });
            }
        }
    }

    const fetchMessagesAndMarkDelivered = async () => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/mark-unread-messages/${userId}/${recepientId}`);
            if (res.ok) {
                const res2 = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/messages/${userId}/${recepientId}`);
                const data = await res2.json();
                if (res2.ok) {
                    setMessages(data.messages);
                    socket.emit("join-chat", { room: combinedId(), senderId: userId, recepientId });
                    await markMessagesSeen(data.messages);
                }
            }
        }
        catch (error) {
            console.log("Error in marking messages read", error);
        }
    }

    useEffect(() => {
        fetchMessagesAndMarkDelivered();
    }, []);

    useEffect(() => {
        // check if recepient is online or not.
        socket.emit("check-online", (recepientId));

        // Add listener to check if user is online
        socket.on("online", (status) => {
            setOnline(status);
            if (!status) {
                fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/last-seen/${recepientId}`)
                    .then(res => {
                        if (res.ok) {
                            return res.json();
                        } else {
                            throw new Error("Failed to fetch last seen time");
                        }
                    })
                    .then(data => {
                        const lastSeenTime = new Date(data.lastSeen);
                        const currentTime = new Date();

                        const timeDifference = currentTime.getTime() - lastSeenTime.getTime();

                        // Check if last seen time is within 24 hours
                        if (timeDifference < 86400000) { // Less than a day (24 hours)
                            const options = { hour: "numeric", minute: "numeric", hour12: true };
                            const formattedLastSeenTime = lastSeenTime.toLocaleString("en-US", options);
                            setLastSeenTime("Last seen " + formattedLastSeenTime);
                        } else {
                            setLastSeenTime("Last seen a long time ago");
                        }
                    })
                    .catch(error => {
                        console.log("Error fetching last seen time:", error);
                    });
            }
        });

        // Cleanup function to remove the event listener when the component unmounts
        return () => {
            socket.off("check-online");
            socket.off("online");
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, []);

    const scrollToBottom = () => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollToEnd({ animated: false });
        }
    }
    const handleContentSizeChange = () => {
        scrollToBottom();
    }
    const handleEmojiPress = () => {
        setShowEmojiSelector(!showEmojiSelector);
    }
    const combinedId = () => {
        let combinedId;
        if (userId < recepientId)
            combinedId = userId + recepientId;
        else
            combinedId = recepientId + userId;
        return combinedId;
    }
    useEffect(() => {
        const fetchRecepientsData = async () => {
            try {
                const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/user/${recepientId}`);
                const data = await res.json();
                setRecepientData(data);
            }
            catch (error) {
                console.log("Error retrieveing details", error);
            }
        }
        fetchRecepientsData();
    }, [])
    const checkRecepientIsJoined = () => {
        socket.emit("check-joined", { userId: recepientId, roomId: combinedId() });
        return true;
    }

    const handleSend = async (messageType, imageUri, imageBase64) => {
        try {
            const cid = uuid.v4();
            const messageData = {
                cid: cid,
                senderId: userId,
                recepientId: recepientId,
                timeStamp: new Date(),
                messageType: messageType,
                roomId: combinedId(),

            };
            // If the message is text or image
            if (messageType === "image") {
                messageData["imageFile"] = {
                    uri: imageBase64,
                    name: "image.jpg",
                    type: "image/jpeg"
                };
            } else {
                if (message === "") {
                    // type something;
                    return;
                }
                messageData["messageText"] = message;
            }

            const messageBody = { cid, senderId: { _id: userId, name: 'unknown' }, recepientId, messageType, message, timeStamp: new Date(), imageUrl: imageUri, messageSeen: "sending" };
            setMessages((prevMessages) => [...prevMessages, messageBody]);

            // check if other user is not joined the room            
            checkRecepientIsJoined();
            if (otherUserStatus === false) {
                // Emit the message with form data to the backend via socket
                socket.emit("unread-messages", messageData);
                socket.emit("send-unread-message-count", recepientId);
            }
            else {
                // Emit the message with form data to the backend via socket
                socket.emit("read-message", messageData);
            }
            socket.emit("stop-typing", combinedId());
            // Clear message input and selected image
            setMessage("");
            setSelectedImage("");

            // Optionally, you can trigger a function to fetch messages
            // fetchMessages();
        } catch (error) {
            console.log("Error in sending the message", error);
        }
    }

    useLayoutEffect(() => {
        navigation.setOptions({
            headerTitle: "",
            headerLeft: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons onPress={() => navigation.goBack()} name="arrow-back" size={24} color="black" />
                    {selectedMessages.length > 0 ? (
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: '500' }}>{selectedMessages.length}</Text>
                        </View>
                    ) : (
                        <TouchableOpacity onPress={() => navigation.navigate("SingleChatProfile", { recepientId })}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Image style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    resizeMode: "cover",
                                }}
                                    source={{ uri: recepientData?.image }} />
                                <View style={{ flexDirection: 'column' }}>
                                    <Text style={{ marginLeft: 5, fontSize: 15, fontWeight: 'bold' }}>{recepientData?.name}</Text>
                                    {online === true ?
                                        <Text style={{ color: 'green', marginLeft: 5 }}>Online</Text>
                                        :
                                        <Text style={{ color: 'gray', marginLeft: 5 }}>{lastSeenTime}</Text>
                                    }
                                </View>
                            </View>
                        </TouchableOpacity>)}
                </View>
            ),
            headerRight: () => selectedMessages.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="arrow-redo" size={24} color="black" />
                    <Ionicons name="arrow-undo" size={24} color="black" />
                    <FontAwesome name="star" size={24} color="black" />
                    <MaterialIcons onPress={() => deleteMessages(selectedMessages)} name="delete" size={24} color="black" />
                </View>
            ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="call" size={24} color="black" />
                    <FontAwesome name="video-camera" size={24} color="black" />
                </View>
            )
        });
    }, [recepientData, selectedMessages, online, lastSeenTime]);
    const deleteMessages = async (messageIds) => {
        try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/delete-messages/`, {
                method: 'POST',
                headers:
                {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ messages: messageIds })
            });
            if (res.ok) {
                setSelectedMessages([]);
                fetchMessages();
            }
        }
        catch (error) {
            console.log("Error deleting messages", error);
        }
    }
    const formatTime = (time) => {
        const options = { hour: "numeric", minute: "numeric" };
        return new Date(time).toLocaleString("en-US", options);
    }
    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        socket.emit("join-chat", { room: combinedId(), senderId: userId, recepientId });
        if (!result.canceled) {
            // Compress the image
            const compressedImage = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 400 } }],
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );
            // Convert the compressed image URI to a base64 string
            const base64Image = await FileSystem.readAsStringAsync(compressedImage.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            // Now you can send the base64Image string to your backend
            handleSend("image", compressedImage.uri, base64Image);
        }
    }
    const handleSelectMessage = (message) => {
        // check if message is already selected
        const isSelected = selectedMessages.includes(message.cid);
        if (isSelected) {
            setSelectedMessages((prevMessages) => prevMessages.filter((id) => id !== message.cid))
        }
        else {
            setSelectedMessages((prevMessages) => [...prevMessages, message.cid]);
        }
    }
    const handleTyping = (text) => {
        setMessage(text);
        if (!typing) {
            setTyping(true);
            socket.emit("typing", combinedId());
        }
        let lastTypingTime = new Date().getTime();
        var timerLength = 3000;
        setTimeout(() => {
            let timeNow = new Date().getTime();
            let timeDiff = timeNow - lastTypingTime;
            if (timeDiff >= timerLength && typing) {
                socket.emit("stop-typing", combinedId());
                setTyping(false);
            }
        }, timerLength);
    }
    const handleImageClick = (imageUrl) => {
        setShowModal(true);
        setImageUri(imageUrl);
    }
    useEffect(() => {
        const backAction = () => {
            if (showModal) {
                setShowModal(false);
                setImageUri("");
                return true;
            }
            else {
                socket.emit("user-left-window", { roomId: combinedId(), userId, recepientId });
                return false;
            }
        }
        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => {
            backHandler.remove();
        }
    }, [showModal]);

    return (
        <KeyboardAvoidingView style={styles.container}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={{ flexGrow: 1 }} onContentSizeChange={handleContentSizeChange}>
                {messages.map((item, index) => {
                    if (item.messageType === "text") {
                        const isSelected = selectedMessages.includes(item.cid);
                        return (
                            <Pressable
                                onLongPress={() => handleSelectMessage(item)}
                                key={index} style={[
                                    item?.senderId?._id === userId ?
                                        {
                                            alignSelf: "flex-end",
                                            backgroundColor: '#DCF8C6',
                                            padding: 8,
                                            maxWidth: '60%',
                                            borderRadius: 7,
                                            margin: 10
                                        } :
                                        {
                                            alignSelf: "flex-start",
                                            backgroundColor: 'white',
                                            padding: 8,
                                            borderRadius: 7,
                                            maxWidth: '60%',
                                            margin: 10
                                        },
                                    isSelected && { width: '100%', backgroundColor: '#F0FFFF' }
                                ]}>
                                <Text style={{ fontSize: 13, textAlign: isSelected ? "left" : "right" }}>{item?.message}</Text>
                                {item?.senderId?._id === userId && <Text style={{ textAlign: 'right', fontSize: 9, color: 'gray', marginTop: 5 }}>{item?.messageSeen}</Text>}
                                <Text style={{ textAlign: 'right', fontSize: 9, color: 'gray', marginTop: 5 }}>{formatTime(item?.timeStamp)}</Text>
                            </Pressable>
                        )
                    }
                    else if (item.messageType === "image") {
                        const isSelected = selectedMessages.includes(item.cid);
                        return (<Pressable
                            onPress={() => handleImageClick(item.imageUrl)}
                            onLongPress={() => handleSelectMessage(item)}
                            key={index} style={[
                                item?.senderId?._id === userId ?
                                    {
                                        alignSelf: "flex-end",
                                        backgroundColor: '#DCF8C6',
                                        padding: 8,
                                        maxWidth: '60%',
                                        borderRadius: 7,
                                        margin: 10
                                    } :
                                    {
                                        alignSelf: "flex-start",
                                        backgroundColor: 'white',
                                        padding: 8,
                                        borderRadius: 7,
                                        maxWidth: '60%',
                                        margin: 10
                                    },
                                isSelected && { width: '100%', backgroundColor: '#F0FFFF' }
                            ]}>
                            <View>
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={{ width: 200, height: 200, borderRadius: 7 }}
                                />
                                {item?.senderId?._id === userId &&
                                    <Text style={{
                                        textAlign: "right",
                                        fontSize: 9,
                                        right: 10,
                                        color: "gray",
                                        marginTop: 5,
                                    }}
                                    >{item?.messageSeen}</Text>}
                                <Text
                                    style={{
                                        textAlign: "right",
                                        fontSize: 9,
                                        right: 10,
                                        color: "gray",
                                        marginTop: 5,
                                    }}
                                >
                                    {formatTime(item?.timeStamp)}
                                </Text>
                            </View>
                        </Pressable>)
                    }
                })}
            </ScrollView>
            {showModal ?
                <View style={{ backgroundColor: 'rgb(0,0,0)' }}>
                    <Image
                        source={{ uri: imageUri }}
                        style={{ height: '100%', width: '100%', zIndex: 100, alignSelf: 'center', resizeMode: 'contain' }} />
                </View> : null}
            {isTyping ?
                <View style={styles.typingView}>
                    <Text>Typing</Text>
                    <LottieView
                        autoPlay
                        // ref={animation}
                        style={{
                            width: 50,
                            height: 50,
                            backgroundColor: '#F0F0F0',
                        }}
                        // Find more Lottie files at https://lottiefiles.com/featured
                        source={require('../assets/typing.json')}
                    />
                </View>
                : null}
            <View style={{ ...styles.inputEmojiContainer, marginBottom: showEmojiSelector }}>
                <Entypo onPress={handleEmojiPress} style={styles.emoji} name="emoji-happy" size={24} color="gray" />
                <TextInput value={message} onChangeText={handleTyping} style={styles.textInput} placeholder='Type your message...' />
                <View style={styles.micCameraContainer}>
                    <Entypo onPress={pickImage} name="camera" size={24} color="grey" />
                    <Feather name="mic" size={24} color="gray" />
                </View>
                <Pressable onPress={() => handleSend("text")} style={styles.sendBtn}>
                    <Text style={styles.btnText}>Send</Text>
                </Pressable>
            </View>
            {showEmojiSelector &&
                <EmojiSelector category={Categories.symbols} theme='transparent' style={{ height: 250 }} onEmojiSelected={(emoji) => setMessage((prevMessage) => prevMessage + emoji)} />}
        </KeyboardAvoidingView>
    )
}

export default ChatMessagesScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0'
    },
    inputEmojiContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#dddddd',
    },
    textInput: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 20,
        paddingHorizontal: 10
    },
    emoji: {
        marginRight: 5
    },
    micCameraContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        marginHorizontal: 8
    },
    sendBtn: {
        backgroundColor: '#007bff',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold'
    },
    typingView: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
        height: 30,
        borderRadius: 6,
        marginLeft: 10
    }
})