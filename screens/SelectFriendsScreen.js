import React, { useContext, useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Pressable,ToastAndroid } from 'react-native';
import { UserType } from '../UserContext';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';


const SelectFriendsScreen = () => {
  const { userId } = useContext(UserType); // Assuming UserType is correctly implemented elsewhere
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const res = await fetch(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/accepted-friends/${userId}`);
        if (res.ok) {
          const data = await res.json();
          setFriends(data);
        } else {
          console.error('Failed to fetch friends:', res.status);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      }
    };

    fetchFriends();
  }, [userId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View>
          <Text style={{ fontSize: 15 }}>New Group</Text>
          <Text style={{ fontSize: 13 }}>Add members</Text>
        </View>
      ),
      headerRight: () => (
        <Feather name="search" size={24} color="black" />
      )
    });
  }, [navigation]);

  const handleSelect = (id) => {
    setSelectedFriends((prev) => {
      if (prev.includes(id)) {
        return prev.filter((_id) => _id !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleGroupCreation=()=>
  {
    if(selectedFriends.length===0)
    {
      ToastAndroid.show('At least 1 friend must be selected', ToastAndroid.SHORT);
    }
    else
    {
      navigation.navigate("CreateGroup",{selectedFriends});
    }
  }

  return (
    <View style={{height:'100%'}}>
      <ScrollView>
        {friends.map((friend, index) => (
          <TouchableOpacity onPress={() => handleSelect(friend._id)} style={styles.container} key={index}>
            <View>
              <Image style={styles.image} source={{ uri: friend.image }} />
              {selectedFriends.includes(friend._id) && (
                <Image style={styles.tick} source={require('../assets/greenTick.png')} />
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.nameText}>{friend.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Pressable onPress={handleGroupCreation} style={styles.btn}>
        <Feather name="arrow-right" size={24} color="white" />
      </Pressable>
      </View>
  );
};

export default SelectFriendsScreen;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0.7,
    borderColor: '#D0D0D0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderRightWidth: 0,
    padding: 10,
  },
  image: {
    height: 50,
    width: 50,
    resizeMode: 'cover',
    borderRadius: 25,
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  nameText: {
    fontWeight: '500',
    fontSize: 15,
  },
  tick: {
    height: 18,
    width: 18,
    borderRadius: 10,
    position: 'absolute',
    top: 28,
    right: -5,
  },
  btn:{
    height:50,
    width:50,
    backgroundColor:'green',
    borderRadius:10,
    alignItems:'center',
    justifyContent:'center',
    position:'absolute',
    right:20,
    bottom:20
  }
});
