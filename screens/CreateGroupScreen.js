import { StyleSheet, Text, View } from 'react-native'
import React, { useLayoutEffect } from 'react'
import { useNavigation } from '@react-navigation/native';

const CreateGroupScreen = () => {
    const navigation=useNavigation();
    useLayoutEffect(()=>
    {
        navigation.setOptions({
            headerTitle:"New Group"
        });
    },[]);
  return (
    <View>
      <Text>CreateGroupScreen</Text>
    </View>
  )
}

export default CreateGroupScreen

const styles = StyleSheet.create({})