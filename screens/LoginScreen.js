import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, TextInput, Pressable } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigation = useNavigation();
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const token = await AsyncStorage.getItem("authToken");
                if (token)
                    navigation.replace("Home");
                else {
                    // token not found show login screen
                }
            }
            catch (err) {
                console.log("Login check error", err);
            }
        }
        checkLoginStatus();
    }, []);
    const handleLogin = () => {
        const user = {
            email,
            password
        };
        axios.post('http://10.145.180.129:8000/login', user).then((res) => {
            console.log(res);
            const token = res.data.token;
            AsyncStorage.setItem("authToken", token);
            navigation.replace("Home");

        }).catch((err) => {
            Alert.alert("Login error", "Invalid email or password");
            console.log("Login error", err);
        });
    }
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView>
                <View style={styles.signInView}>
                    <Text style={styles.header}>Sign In</Text>
                    <Text style={styles.subHeader}>Sign In to Your Account</Text>
                </View>
                <View style={styles.formView}>
                    <View>
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
                    <Pressable onPress={handleLogin} style={styles.btn}>
                        <Text style={styles.btnText}>Login</Text>
                    </Pressable>
                    <Pressable onPress={() => navigation.navigate('Register')} style={styles.alterBtn}>
                        <Text style={styles.alterBtnText}>Don't have an account? Sign Up</Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
export default LoginScreen;

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
        fontWeight: '600',
        fontSize: 14
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