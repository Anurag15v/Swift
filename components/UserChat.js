import { Pressable, StyleSheet, Text, View, Image } from 'react-native'
import React, { useContext, useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { UserType } from '../UserContext'
import { Ionicons } from '@expo/vector-icons';
import socket from '../socket';
import LottieView from 'lottie-react-native';

const UserChat = ({ item }) => {
  const navigation = useNavigation();
  const { userId, setUserId } = useContext(UserType);
  const [message, setMessage] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount,setMessageCount]=useState(0);

  const fetchLastReadMessages = async () => {
    try {
      const res = await fetch(`http://10.145.171.195:8000/last-message/${userId}/${item._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages)
          setMessage(data.messages);
        else
          setMessage({ messageType: "text", message: "Start chating", timeStamp: null });
      }
    }
    catch (error) {
      console.log("Error in fetching messages", error);
    }
  }

  const fetchLastUnreadMessages = async () => {
    try {
      const res = await fetch(`http://10.145.171.195:8000/unread-last-message/${userId}/${item._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages)
          setMessage(data.messages);
      }
    }
    catch (error) {
      console.log("Error in fetching messages", error);
    }
  }

  const fetchUnreadMessagesCount=async()=>
  {
    try{
      const res=await fetch(`http://10.145.171.195:8000/unread-message-count/${userId}/${item._id}`);
      if(res.ok)
      {
        const data=await res.json();
        if(data.message)
        {
          console.log(data)
          setMessageCount(data.message);
        }
      }
    }
    catch(error)
    {
      console.log("Error in fetching unread messages count",error);
    }
  }

  useEffect(() => {
    fetchUnreadMessagesCount();
    if(messageCount===0)
      fetchLastReadMessages();
    else
      fetchLastUnreadMessages();
  }, [])
  useEffect(() => {

    // Add listener for typing
    socket.on("typing", () => {
      setIsTyping(true);
    });

    // Add listener for typing stopped
    socket.on("stop-typing", () => {
      setIsTyping(false);
    });

    // Add listener for unread message count
    socket.on("unread-message-count",()=>{
      setMessageCount(messageCount+1);
    });

    return () => {
      socket.off("typing");
      socket.off("stop-typing");
    }

  }, [userId, item, messageCount]);

  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  }
  
  return (
    <Pressable 
        onPress={() => {
          setMessageCount(0);
          navigation.navigate("Messages", { recepientId: item._id });
          }
        } style={styles.container}>
      <View>
        <Image style={styles.image} source={{ uri: item.image }} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>
          {item?.name}
        </Text>
        {isTyping ?
            <View style={styles.typingView}>
              <Text>
              Typing
              </Text><LottieView
              autoPlay
              // ref={animation}
              style={{
                width: 25,
                height: 25,
                backgroundColor: 'rgb(242,242,242)',
              }}
              // Find more Lottie files at https://lottiefiles.com/featured
              source={require('../assets/Animation - 1710593470490.json')}
            /></View>
          :
          message?.messageType === "text" ?
            <Text style={styles.lastMsgText}>{message?.message}</Text>
            :
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
              <Ionicons name="image" size={20} color="gray" />
              <Text style={styles.lastMsgText}>Photo</Text>
            </View>}
      </View>
      {messageCount!==0 &&  <View style={styles.unreadMessageBox}>
        <Text style={styles.unreadCount}>{messageCount}</Text>
      </View> }
      <View>
        {message?.timeStamp &&
          <Text style={styles.timeStamp}>{formatTime(message.timeStamp)}</Text>}
      </View>
    </Pressable>
  )
}

export default UserChat

const styles = StyleSheet.create({
  image: {
    height: 50,
    width: 50,
    resizeMode: "cover",
    borderRadius: 25,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.7,
    borderColor: '#D0D0D0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    padding: 10,
  },
  nameText: {
    fontWeight: '500',
    fontSize: 15
  },
  textContainer: {
    marginLeft: 12,
    flex: 1
  },
  lastMsgText: {
    fontWeight: '500',
    color: 'gray',
    marginTop: 3
  },
  timeStamp: {
    fontSize: 11,
    fontWeight: '500',
    color: 'gray'
  },
  typingView:{
    flexDirection:'row',
    alignItems:'center',
    width:100,
    height:30,
    borderRadius:6,
    marginLeft:10
  },
  unreadMessageBox:
  {
    width:20,
    height:20,
    borderRadius:10,
    backgroundColor:'#c21408',
    paddingTop:1.5
  },
  unreadCount:{
    color:'white',
    textAlign:'center',
    fontWeight:'500'
  }
})