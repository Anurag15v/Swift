import { Pressable, StyleSheet, Text, View, Image } from 'react-native'
import React, { useContext, useState, useEffect } from 'react'
import { useNavigation } from '@react-navigation/native'
import { UserType } from '../UserContext'
import { Ionicons } from '@expo/vector-icons';

const UserChat = ({ item }) => {
  const navigation = useNavigation();
  const { userId, setUserId } = useContext(UserType);
  const [message, setMessage] = useState({});
  const fetchMessages = async () => {
    try {
      const res = await fetch(`http://10.145.153.33:8000/last-message/${userId}/${item._id}`);
      const data = await res.json();
      if (res.ok) {
        setMessage(data.messages);
      }
    }
    catch (error) {
      console.log("Error in fetching messages", error);
    }
  }
  useEffect(() => {
    fetchMessages();
  }, []);
  const formatTime = (time) => {
    const options = { hour: "numeric", minute: "numeric" };
    return new Date(time).toLocaleString("en-US", options);
  }
  return (
    <Pressable onPress={() => navigation.navigate("Messages", { recepientId: item._id })} style={styles.container}>
      <View>
        <Image style={styles.image} source={{ uri: item.image }} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>
          {item?.name}
        </Text>
        {message?.messageType === "text" ?
          <Text style={styles.lastMsgText}>{message?.message}</Text>
          :
          <View style={{flexDirection:'row',alignItems:'flex-end',gap:10}}>
            <Ionicons name="image" size={20} color="gray" />
            <Text style={styles.lastMsgText}>Photo</Text>
          </View>}
      </View>
      <View>
        <Text style={styles.timeStamp}>{formatTime(message?.timeStamp)}</Text>
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
    borderRadius: 25
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
    padding: 10
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
  }
})