import { Pressable, StyleSheet, Text, View, Image } from 'react-native'
import React, { useContext } from 'react'
import { UserType } from '../UserContext';

const FriendRequest = ({ item, friendRequests, setFriendRequests }) => {
  const { userId, setUserId } = useContext(UserType);
  const acceptRequest = async (friendRequestId) => {
    try {
      const res = await fetch('http://10.145.153.33:8000/friend-request/accept',
        {
          method: 'POST',
          headers: {
            "Content-Type": 'application/json'
          },
          body: JSON.stringify({ recepientId: userId, senderId: friendRequestId })
        });
      if (res.ok) {
        setFriendRequests(friendRequests.filter((request) => request._id !== friendRequestId));
      }
    }
    catch (error) {
      console.log("Error in accepting friend request", error);

    }
  }
  return (
    <Pressable style={styles.container}>
      <Image style={styles.imageStyle} source={{ uri: item.image }} />
      <Text style={styles.nameText}>{item?.name} sent you a friend request</Text>
      <Pressable onPress={() => acceptRequest(item._id)} style={styles.btn}>
        <Text style={styles.btnText}>Accept</Text>
      </Pressable>
    </Pressable>
  )
}

export default FriendRequest

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    justifyContent: 'space-between'
  },
  imageStyle: {
    height: 50,
    width: 50,
    borderRadius: 25
  },
  btn: {
    backgroundColor: '#0066b2',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  btnText: {
    color: 'white'
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
    flex: 1
  }
})