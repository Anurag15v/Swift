import { AppState, BackHandler, Image, Pressable, StyleSheet, Text, ToastAndroid, View } from 'react-native'
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { UserType } from '../UserContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode";
import { decode } from "base-64";
import axios from 'axios';
import User from '../components/User';
import socket from '../socket';

global.atob = decode;

const HomeScreen = () => {

  const navigation = useNavigation();
  const { userId, setUserId } = useContext(UserType);
  const [users, setUsers] = useState([]);
  const [appState, setAppState] = useState(AppState.currentState);
  const [currentUser, setCurrentUser] = useState({});
  const handleLogOut = async () => {
    await AsyncStorage.removeItem("authToken");
    ToastAndroid.show('Logged Out', ToastAndroid.SHORT);
    navigation.replace("Login");
  }
  useEffect(() => {
    const getCurrentUser = async () => {
      const token = await AsyncStorage.getItem("authToken");
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      setUserId(userId);
      //await AsyncStorage.removeItem("authToken");
      axios.get(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/user/${userId}`).then((res) => {
        setCurrentUser(res.data);
      }).catch(err => {
        console.log("Error retrieving user", err);
      });
    }
    getCurrentUser();

  }, []);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Swift Chat</Text>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons onPress={() => navigation.navigate("Chats")} name="chatbox-ellipses-outline" size={24} color="black" />
          <MaterialIcons onPress={() => navigation.navigate("Friends")} name="people-outline" size={24} color="black" />
          <Pressable onPress={() => navigation.navigate("Profile", { data: currentUser })}>
            <Image style={{ height: 35, width: 35, borderRadius: 50 }} source={{ uri: currentUser.image }} />
          </Pressable>
          <MaterialIcons onPress={handleLogOut} name="logout" size={24} color="black" />
        </View>
      )
    })
  }, [currentUser]);
  useEffect(() => {
    const fetchUsers = async () => {
      if(userId)
      {
        axios.get(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/users/${userId}`).then((res) => {
          setUsers(res.data);
        }).catch(err => {
          console.log("Error retrieving users", err);
        });
      }
    }
    fetchUsers();
  }, [currentUser]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Disconnect the socket when the app goes to the background or becomes inactive
        if (socket) {
          socket.disconnect();
        }
      }
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground from the background
        if (socket) {
          // Reconnect the socket when the app is brought to the foreground
          socket.connect();
          socket.emit("setup", {
            _id: userId
          });
        }
      }
      setAppState(nextAppState);
    };

    // Add event listener for app state changes
    AppState.addEventListener('change', handleAppStateChange);

  }, [socket, appState]);


  return (
    <View>
      <View style={styles.userContianer}>
        {users.map((item, index) => {
          return <User key={index} item={item} />
        })}
      </View>
    </View>
  )
}

export default HomeScreen

const styles = StyleSheet.create({
  userContianer: {
    padding: 10
  }
});