import { Pressable, StyleSheet, Text, View,Image } from 'react-native'
import React from 'react'

const FriendRequest = ({item,friendRequests,setFriendRequests}) => {
  return (
      <Pressable style={styles.container}>
        <Image style={styles.imageStyle} source={{uri:item.image}} />
        <Text style={styles.nameText}>{item?.name} sent you a friend request</Text>
        <Pressable style={styles.btn}>
          <Text style={styles.btnText}>Accept</Text>
        </Pressable>
      </Pressable>
  )
}

export default FriendRequest

const styles = StyleSheet.create({
  container:{
    flexDirection:'row',
    alignItems:'center',
    marginVertical:10,
    justifyContent:'space-between'
  },
  imageStyle:{
    height:50,
    width:50,
    borderRadius:25
  },
  btn:{
    backgroundColor:'#0066b2',
    padding:10,
    borderRadius:6,
    alignItems:'center'
  },
  btnText:{
    color:'white'
  },
  nameText:{
    fontSize:15,
    fontWeight:'bold',
    marginLeft:10,
    flex:1
  }
})