import { StyleSheet, Text, View, ScrollView, KeyboardAvoidingView, TextInput, Pressable, Image } from 'react-native'
import React, { useState, useContext, useLayoutEffect, useEffect, useRef } from 'react'
import { Entypo } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import EmojiSelector from 'react-native-emoji-selector';
import { UserType } from '../UserContext'
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';

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
    const scrollViewRef=useRef(null);

    useEffect(()=>
    {
        scrollToBottom();
    },[]);
    const scrollToBottom=()=>
    {
        if(scrollViewRef.current)
        {
            scrollViewRef.current.scrollToEnd({animated:false});
        }
    }
    const handleContentSizeChange=()=>
    {
        scrollToBottom();
    }
    const handleEmojiPress = () => {
        setShowEmojiSelector(!showEmojiSelector);
    }
    const fetchMessages = async () => {
        try {
            const res = await fetch(`http://10.145.153.33:8000/messages/${userId}/${recepientId}`);
            const data = await res.json();
            if (res.ok) {
                setMessages(data);
            }
        }
        catch (error) {
            console.log("Error in fetching messages", error);
        }
    }
    useEffect(() => {
        fetchMessages();
    }, []);
    useEffect(() => {
        const fetchRecepientsData = async () => {
            try {
                const res = await fetch(`http://10.145.153.33:8000/user/${recepientId}`);
                const data = await res.json();
                setRecepientData(data);
            }
            catch (error) {
                console.log("Error retrieveing details", error);
            }
        }
        fetchRecepientsData();
    }, [])
    const handleSend = async (messageType, imageUri) => {
        try {
            const formData = new FormData();
            formData.append("senderId", userId);
            formData.append("recepientId", recepientId);

            // if the message is text or image
            if (messageType === "image") {
                formData.append("messageType", "image");
                formData.append("imageFile", {
                    uri: imageUri,
                    name: "image.jpg",
                    type: "image/jpeg"
                });
            }
            else {
                formData.append("messageType", "text");
                formData.append("messageText", message);
            }
            const res = await fetch('http://10.145.153.33:8000/messages', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                setMessage("");
                setSelectedImage("");
                fetchMessages();
            }
        }
        catch (error) {
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
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Image style={{
                                width: 30,
                                height: 30,
                                borderRadius: 15,
                                resizeMode: "cover",
                            }}
                                source={{ uri: recepientData?.image }} />
                            <Text style={{ marginLeft: 5, fontSize: 15, fontWeight: 'bold' }}>{recepientData?.name}</Text>
                        </View>)}
                </View>
            ),
            headerRight: () => selectedMessages.length > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="arrow-redo" size={24} color="black" />
                    <Ionicons name="arrow-undo" size={24} color="black" />
                    <FontAwesome name="star" size={24} color="black" />
                    <MaterialIcons onPress={()=>deleteMessages(selectedMessages)} name="delete" size={24} color="black" />
                </View>
            ) : null
        });
    }, [recepientData,selectedMessages]);
    const deleteMessages=async(messageIds)=>
    {
        try
        {
            const res=await fetch('http://10.145.153.33:8000/delete-messages/',{
                method:'POST',
                headers:
                {
                    "Content-Type":"application/json"
                },
                body:JSON.stringify({messages:messageIds})
            });
            if(res.ok)
            {
                setSelectedMessages([]);
                fetchMessages();
            }
        }
        catch(error)
        {
            console.log("Error deleting messages",error);
        }
    }
    const formatTime = (time) => {
        const options = { hour: "numeric", minute: "numeric" };
        return new Date(time).toLocaleString("en-US", options);
    }
    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
        if (!result.canceled) {
            handleSend("image", result.assets[0].uri);
        }
    }
    const handleSelectMessage = (message) => {
        // check if message is already selected
        const isSelected = selectedMessages.includes(message._id);
        if (isSelected) {
            setSelectedMessages((prevMessages) => prevMessages.filter((id) => id !== message._id))
        }
        else {
            setSelectedMessages((prevMessages) => [...prevMessages, message._id]);
        }
    }
    return (
        <KeyboardAvoidingView style={styles.container}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={{flexGrow:1}} onContentSizeChange={handleContentSizeChange}>
                {messages.map((item, index) => {
                    if (item.messageType === "text") {
                        const isSelected = selectedMessages.includes(item._id);
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
                                <Text style={{ fontSize: 13, textAlign: isSelected?"left":"right" }}>{item?.message}</Text>
                                <Text style={{ textAlign: 'right', fontSize: 9, color: 'gray', marginTop: 5 }}>{formatTime(item?.timeStamp)}</Text>
                            </Pressable>
                        )
                    }
                    else if (item.messageType === "image") {
                        const isSelected = selectedMessages.includes(item._id);
                        return (<Pressable
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
                                <Text
                                    style={{
                                        textAlign: "right",
                                        fontSize: 9,
                                        position: "absolute",
                                        right: 10,
                                        bottom: 7,
                                        color: "white",
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
            <View style={{ ...styles.inputEmojiContainer, marginBottom: showEmojiSelector }}>
                <Entypo onPress={handleEmojiPress} style={styles.emoji} name="emoji-happy" size={24} color="gray" />
                <TextInput value={message} onChangeText={(text) => setMessage(text)} style={styles.textInput} placeholder='Type your message...' />
                <View style={styles.micCameraContainer}>
                    <Entypo onPress={pickImage} name="camera" size={24} color="grey" />
                    <Feather name="mic" size={24} color="gray" />
                </View>
                <Pressable onPress={() => handleSend("text")} style={styles.sendBtn}>
                    <Text style={styles.btnText}>Send</Text>
                </Pressable>
            </View>
            {showEmojiSelector &&
                <EmojiSelector style={{ height: 250 }} onEmojiSelected={(emoji) => setMessage((prevMessage) => prevMessage + emoji)} />}
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
    }
})