import React from 'react';
import  {View,Text,StyleSheet} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import FriendsScreen from './screens/FriendsScreen';
import ChatScreen from './screens/ChatScreen';
import ChatMessagesScreen from './screens/ChatMessagesScreen';
import SingleChatProfile from './screens/SingleChatProfile';
import ProfileScreen from './screens/ProfileScreen';
import SelectFriendsScreen from './screens/SelectFriendsScreen';
import CreateGroupScreen from './screens/CreateGroupScreen';

const StackNavigator=()=>
{
    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="Login" component={LoginScreen} options={{headerShown:false}}/>
                <Stack.Screen name="Register" component={RegisterScreen} options={{headerShown:false}}/>
                <Stack.Screen name="Home" component={HomeScreen}/>
                <Stack.Screen name="Friends" component={FriendsScreen}/>
                <Stack.Screen name="Chats" component={ChatScreen}/>
                <Stack.Screen name="Messages" component={ChatMessagesScreen}/>
                <Stack.Screen name="SingleChatProfile" component={SingleChatProfile} options={{headerShown:false}}/>
                <Stack.Screen name="Profile" component={ProfileScreen} options={{headerShown:false}}/>
                <Stack.Screen name="SelectFriends" component={SelectFriendsScreen}/> 
                <Stack.Screen name="CreateGroup" component={CreateGroupScreen}/> 
            </Stack.Navigator>
        </NavigationContainer>
    );
}
export default StackNavigator;

const styles=StyleSheet.create({

});