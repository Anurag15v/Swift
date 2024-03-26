import { StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useContext, useState } from 'react'
import { UserType } from '../UserContext';
import axios from 'axios';
import FriendRequest from '../components/FriendRequest';
import LottieView from 'lottie-react-native';
import socket from '../socket';

const FriendsScreen = () => {
  const { userId, setUserId } = useContext(UserType);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading,setLoading]=useState(false);
  
  useEffect(() => {
    socket.on("received-friend-request",(friendRequestData)=>
    {
      setFriendRequests((prev)=>[...prev,friendRequestData]);
    });
    fetchFriendRequests();
    return ()=>
    {
      socket.off("received-friend-request");
    }
  }, []);
  const fetchFriendRequests = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://10.145.206.139:8000/friend-request/${userId}`);
      if (res.status === 200) {
        const friendRequestsData = res.data.map(friendRequest => (
          {
            _id: friendRequest._id,
            name: friendRequest.name,
            email: friendRequest.email,
            image: friendRequest.image
          }));
          setLoading(false);
        setFriendRequests(friendRequestsData);
      }
    }
    catch (error) {
      console.log(error);
    }
  }
  return (
    <View style={styles.header}>
      {(friendRequests.length === 0 || loading) && 
        <LottieView autoPlay
          // ref={animation}
          style={{
            width: 200,
            height: 200,
            marginTop:100,
            backgroundColor: '#F0F0F0',
          }}
          // Find more Lottie files at https://lottiefiles.com/featured
          source={require('../assets/noData.json')} />}
      {friendRequests.length > 0 && <Text>Your Friend Requests</Text>}
      {friendRequests.map((item, index) =>
        <FriendRequest key={index} item={item} friendRequests={friendRequests} setFriendRequests={setFriendRequests} />)}
    </View>
  )
}

export default FriendsScreen

const styles = StyleSheet.create({
  header: {
    padding: 10,
    marginHorizontal: 12,
    alignItems:'center'
  }
})