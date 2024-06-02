import { StyleSheet, Text, View, Image } from 'react-native';
import React, { useContext, useState, useEffect } from 'react';
import { UserType } from '../UserContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const SingleChatProfile = () => {
  const { userId, setUserId } = useContext(UserType);
  const route = useRoute();
  const { recepientId } = route.params;
  const [userData, setUserData] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const getUserDetails = async () => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/user/${recepientId}`);
      const data = await res.json();
      setUserData(data);
    };
    getUserDetails();
  }, []);

  return (
    <View>
      <Ionicons onPress={()=>navigation.goBack()} style={styles.arrow} name="arrow-back-outline" size={24} color="black" />
      <View style={styles.mainContainer}>
        <Image style={styles.profileImage} source={{ uri: userData.image }} />
        <Text style={styles.nameText}>{userData.name}</Text>
      </View>
    </View>
  )
}

export default SingleChatProfile

const styles = StyleSheet.create({
  mainContainer:{
    alignItems:'center',
    marginTop:-20
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 50
  },
  nameText:{
    marginTop:10,
    fontSize:20,
    fontWeight:'500'
  },
  arrow:{
    marginTop:40,
    marginLeft:20
  }
})