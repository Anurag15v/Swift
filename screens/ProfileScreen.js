import { View, Text, Image, StyleSheet } from 'react-native'
import React from 'react'
import { useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const currentUser = route.params.data;
  return (
    <View>
      <Ionicons onPress={() => navigation.goBack()} style={styles.arrow} name="arrow-back-outline" size={24} color="black" />
      <View style={styles.mainContainer}>
        <Image style={styles.profileImage} source={{ uri: currentUser.image }} />
        <Text style={styles.nameText}>{currentUser.name}</Text>
        <View style={styles.friendsContainer}>
          <View style={styles.friendDataBox}>
            <Text>{currentUser.friends.length}</Text>
            <Text>Friends</Text>
          </View>
          <View style={styles.friendDataBox}>
            <Text>{currentUser.friendRequests.length}</Text>
            <Text>Requests</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default ProfileScreen

const styles = StyleSheet.create({
  mainContainer: {
    alignItems: 'center',
    marginTop: -20
  },
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 50
  },
  nameText: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: '500'
  },
  arrow: {
    marginTop: 40,
    marginLeft: 20
  },
  friendsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-evenly',
    marginTop:20
  },
  friendDataBox: {
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 6,
    width: 100,
    alignItems: 'center',
  }
})