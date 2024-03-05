import { StyleSheet, Text, View } from 'react-native'
import React, { useContext, useEffect, useLayoutEffect, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { UserType } from '../UserContext'
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from "jwt-decode";
import { decode } from "base-64";
import axios from 'axios';
import User from '../components/User'
global.atob = decode;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { userId, setUserId } = useContext(UserType);
  const [users,setUsers]=useState([]);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: "",
      headerLeft: () => (
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>Swift Chat</Text>
      ),
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="chatbox-ellipses-outline" size={24} color="black" />
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
      axios.get(`http://10.145.180.129:8000/users/${userId}`).then((res)=>
      {
        setUsers(res.data);
      }).catch(err=>
      {
        console.log("Error retrieving users",err);
      });
    }
    fetchUsers();
  },[]);
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