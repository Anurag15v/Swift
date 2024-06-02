import { StyleSheet, Text, ScrollView, TouchableOpacity, View } from 'react-native'
import React, { useState, useContext, useEffect, useLayoutEffect } from 'react'
import { UserType } from '../UserContext'
import { useNavigation } from '@react-navigation/native';
import UserChat from '../components/UserChat';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const ChatScreen = () => {
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const { userId, setUserId } = useContext(UserType);
  const navigation = useNavigation();
  const [showDropDown, setShowDropDown] = useState(false);

  useEffect(() => {
    const acceptedFriendsList = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/accepted-friends/${userId}`);
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
  }, []);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity onPress={() => setShowDropDown((prev) => !prev)} >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="black" />
            </View>
          </TouchableOpacity>
        </View>
      )
    });
  }, []);

  return (
    <>
      {showDropDown &&
        <View style={styles.dropDown}>
          <TouchableOpacity onPress={()=>navigation.navigate("SelectFriends")}>
            <View>
              <Text style={styles.dropDownText}>New group</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View>
              <Text style={styles.dropDownText}>New broadcast</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View>
              <Text style={styles.dropDownText}>Starred messages</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity>
            <View>
              <Text style={styles.dropDownText}>Settings</Text>
            </View>
          </TouchableOpacity>
        </View>
      }
      <ScrollView showsVerticalScrollIndicator={false}>
        {acceptedFriends.map((item, index) => (<UserChat key={index} item={item} />))}
      </ScrollView>
    </>
  )
}

export default ChatScreen

const styles = StyleSheet.create({
  dropDown: {
    position: 'absolute',
    zIndex: 100,
    top: 5,
    right: 5,
    backgroundColor: 'gray',
    width: 150,
    height: 150,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly'
  },
  dropDownText:
  {
    color: 'white'
  }
})