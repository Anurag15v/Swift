import { AppState, BackHandler, StyleSheet, Text, View } from 'react-native'
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { UserType } from '../UserContext'
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from "jwt-decode";
import { decode } from "base-64";
import axios from 'axios';
import User from '../components/User';
import socket from '../socket';


global.atob = decode;

const HomeScreen = () => {
  
  const navigation = useNavigation();
  const { userId, setUserId } = useContext(UserType);
  const [users,setUsers]=useState([]);
  const [appState, setAppState] = useState(AppState.currentState);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Swift Chat</Text>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons onPress={()=>navigation.navigate("Chats")} name="chatbox-ellipses-outline" size={24} color="black" />
          <MaterialIcons onPress={()=>navigation.navigate("Friends")} name="people-outline" size={24} color="black" />
        </View>
      )
    })
  }, []);
  useEffect(()=>
  {
    const fetchUsers=async()=>
    {
      const token=await AsyncStorage.getItem("authToken");
      const decodedToken = jwtDecode(token);
      const userId=decodedToken.userId;
      setUserId(userId);
      axios.get(`http://10.145.192.186:8000/users/${userId}`).then((res)=>
      {
        setUsers(res.data);
      }).catch(err=>
      {
        console.log("Error retrieving users",err);
      });
    }
    fetchUsers();
  },[]);
  
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
    
  }, [socket,appState]);
  

  // useEffect(()=>
  // {
  //   const backAction=()=>
  //   {
  //     socket.disconnect();
  //     return true;
  //   }
  //   const backHandler=BackHandler.addEventListener('hardwareBackPress',backAction);
  //   return ()=>
  //   {
  //     backHandler.remove();
  //   }

  // },[]);

return (
  <View>
    <View style={styles.userContianer}>
      {users.map((item,index)=>{
        return <User key={index} item={item}/>
      })}
    </View>
  </View>
)
}

export default HomeScreen

const styles = StyleSheet.create({
  userContianer:{
    padding:10
  }
});