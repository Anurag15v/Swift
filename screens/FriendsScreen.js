import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useContext, useState } from 'react'
import { UserType } from '../UserContext';
import axios from 'axios';
import FriendRequest from '../components/FriendRequest';

const FriendsScreen = () => {
  const { userId, setUserId } = useContext(UserType);
  const [friendRequests, setFriendRequests] = useState([]);
  useEffect(() => {
    fetchFriendRequests();
  }, []);
  const fetchFriendRequests = async () => {
    try {
      const res =await axios.get(`http://10.145.153.33:8000/friend-request/${userId}`);
      if (res.status === 200) {
        const friendRequestsData = res.data.map(friendRequest => (
          {
            _id: friendRequest._id,
            name: friendRequest.name,
            email: friendRequest.email,
            image: friendRequest.image
          }));
        setFriendRequests(friendRequestsData);
      }
    }
    catch (error) {
      console.log(error);
    }
  }
  console.log(friendRequests)
  return (
    <View style={styles.header}>
      {friendRequests.length>0 && <Text>Your Friend Requests</Text>}
      {friendRequests.map((item,index)=>
      <FriendRequest key={index} item={item} friendRequests={friendRequests} setFriendRequests={setFriendRequests}/>)}
    </View>
  )
}

export default FriendsScreen

const styles = StyleSheet.create({
  header:{
    padding:10,
    marginHorizontal:12
  }
})