import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, TextInput, Pressable,Alert } from 'react-native';
import axios from 'axios';

const RegisterScreen = () => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [image, setImage] = useState("");
    const navigation = useNavigation();
    const handleRegister=()=>
    {
        const user={
            email:email,
            name:name,
            password:password,
            image:image
        }
        // send post request to the backend API to register the user
        
        axios.post("http://10.145.153.33:8000/register",user).then((res)=>
        {
            Alert.alert("Registeration Successful","You have been registered successfully");
            setName("");
            setEmail("");
            setPassword("");
            setImage("");
        }).catch((err)=>
        {
            Alert.alert("Registration Error","An error occured while registering");
            console.log(err);
        });
        
    };
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView>
                <View style={styles.signInView}>
                    <Text style={styles.header}>Register</Text>
                    <Text style={styles.subHeader}>Register to Your Account</Text>
                </View>
                <View style={styles.formView}>
                    <View>
                        <Text style={styles.text}>Name</Text>

                        <TextInput
                            value={name}
                            onChangeText={(text) => setName(text)}
                            style={styles.textInput}
                            placeholderTextColor={'black'}
                            placeholder='Enter your name' />
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.text}>Email</Text>

                        <TextInput
                            value={email}
                            onChangeText={(text) => setEmail(text)}
                            style={styles.textInput}
                            placeholderTextColor={'black'}
                            placeholder='Enter your email' />
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.text}>Password</Text>

                        <TextInput
                            value={password}
                            secureTextEntry={true}
                            onChangeText={(text) => setPassword(text)}
                            style={styles.textInput}
                            placeholderTextColor={'black'}
                            placeholder='Enter your password' />
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <Text style={styles.text}>Image</Text>

                        <TextInput
                            value={image}
                            onChangeText={(text) => setImage(text)}
                            style={styles.textInput}
                            placeholderTextColor={'black'}
                            placeholder='Enter profile image link' />
                    </View>
                    <Pressable onPress={handleRegister} style={styles.btn}>
                        <Text style={styles.btnText}>Register</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.goBack()} style={styles.alterBtn}>
                        <Text style={styles.alterBtnText}>Already have an account? Sign In</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
export default RegisterScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        padding: 10
    },
    signInView: {
        marginTop: 100,
        alignItems: 'center'
    },
    header: {
        color: '#4A55A2',
        fontSize: 17,
        fontWeight: '600'
    },
    subHeader: {
        fontSize: 17,
        fontWeight: '600',
        marginTop: 15
    },
    formView: {
        marginTop: 50
    },
    textInput: {
        borderBottomColor: 'gray',
        borderBottomWidth: 1,
        marginVertical: 10,
        height: 40,
        width: 300,
        fontWeight:'600',
        fontSize:14
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
        color: 'gray',
        fontSize: 18
    },
    btn: {
        width: 200,
        backgroundColor: '#4A55A2',
        padding: 15,
        marginTop: 50,
        marginLeft: 'auto',
        marginRight: 'auto',
        borderRadius: 6
    },
    btnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center'
    },
    alterBtn: {
        marginTop: 15
    },
    alterBtnText: {
        textAlign: 'center',
        color: 'gray',
        fontSize: 16
    }
});