import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import React,{useContext,useState} from 'react'
import { UserType } from '../UserContext'

const User = ({item}) => {
  const {userId,setUserId}=useContext(UserType);
  const [requestSent,setRequestSent]=useState(false);
  const sendFriendRequest=async(currentUserId,selectedUserId)=>
  {
    try
    {
      const res=await fetch('http://10.145.180.129:8000/friend-request',{
        method:'POST',
        headers:{
          "Content-Type":'application/json'
        },
        body:JSON.stringify({currentUserId,selectedUserId})
      });
      if(res.ok)
      {
        setRequestSent(true);
      }
    }
    catch(error)
    {
      console.log(error);
    }
  }
  return (
    <Pressable style={styles.container}>
      <View>
        <Image style={styles.image} source={{uri:item.image}} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>
          {item?.name}
        </Text>
      </View>
      <Pressable onPress={()=>sendFriendRequest(userId,item._id)} style={styles.btn}>
        <Text style={styles.btnText}>Add Friend</Text>
      </Pressable>
    </Pressable>
  )
}

export default User

const styles = StyleSheet.create({
  image:{
    height:50,
    width:50,
    resizeMode:"cover",
    borderRadius:25
  },
  container:{
    flexDirection:'row',
    alignItems:'center',
    marginVertical:10
  },
  nameText:{
    fontWeight:'bold'
  },
  textContainer:{
    marginLeft:12,
    flex:1
  },
  btn:{
    backgroundColor:'#567189',
    padding:10,
    borderRadius:6,
    width:105,
    alignItems:'center'
  },
  btnText:{
    color:'white',
    fontSize:13
  }
})