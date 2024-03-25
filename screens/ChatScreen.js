import { StyleSheet, Text, ScrollView } from 'react-native'
import React, { useState, useContext, useEffect } from 'react'
import { UserType } from '../UserContext'
import { useNavigation } from '@react-navigation/native';
import UserChat from '../components/UserChat';

const ChatScreen = () => {
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  useEffect(() => {
    const acceptedFriendsList = async () => {
      try {
        const res = await fetch(`http://192.168.152.216:8000/accepted-friends/${userId}`);
        const data = await res.json();
        if (res.ok) {
          setAcceptedFriends(data)
        }
      }
      catch (error) {
        console.log("Error showing accepted friends", error);
      }
    }
    acceptedFriendsList();
  }, [])
  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      {acceptedFriends.map((item, index) => (<UserChat key={index} item={item} />))}
    </ScrollView>
  )
}

export default ChatScreen

const styles = StyleSheet.create({})