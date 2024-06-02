import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, TextInput, Pressable, Alert, Image, ToastAndroid } from 'react-native';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import LottieView from 'lottie-react-native';

const RegisterScreen = () => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [image, setImage] = useState("");
    const [imageUri, setImageUri] = useState("");
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const handleRegister = () => {
        if (!email || !name || !password || !image) {
            ToastAndroid.show('Please enter all the fields', ToastAndroid.SHORT);
            return;
        }

        const user = {
            email: email,
            name: name,
            password: password,
            image: image
        };
        setLoading(true);
        axios.post(`${process.env.EXPO_PUBLIC_APP_SERVER_BASE_URL}/register`, user)
            .then((res) => {
                setLoading(false);
                ToastAndroid.show('Registration Successful', ToastAndroid.SHORT);
                setName("");
                setEmail("");
                setPassword("");
                setImage("");
                setImageUri("");
                navigation.navigate("Login");
            })
            .catch((err) => {
                ToastAndroid.show('Registration Error', ToastAndroid.SHORT);
                console.log(err);
            });
    };
    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            base64: true,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });
        if (!result.canceled) {
            // Compress the image
            const compressedImage = await ImageManipulator.manipulateAsync(
                result.assets[0].uri,
                [{ resize: { width: 400 } }],
                { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
            );
            // Convert the image URI to a base64 string
            const base64Image = await FileSystem.readAsStringAsync(compressedImage.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            setImageUri(result.assets[0].uri);
            setImage(base64Image);
        }
    }
    return (
        <View style={styles.container}>
            <KeyboardAvoidingView>
                <View style={styles.signInView}>
                    <Text style={styles.header}>Register</Text>
                    <Text style={styles.subHeader}>Register to Your Account</Text>
                </View>
                <View style={styles.formView}>
                    <Pressable onPress={pickImage} style={{ alignItems: 'center' }}>
                        {image === "" ? <Image style={{ height: 100, width: 100, borderRadius: 50 }} source={require('../assets/avatar.png')} />
                            : <Image style={{ height: 100, width: 100, borderRadius: 50, resizeMode: 'contain' }} source={{ uri: imageUri }} />}
                    </Pressable>
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
                            autoCapitalize='none'
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
                    {loading === false ?
                        <Pressable onPress={handleRegister} style={styles.btn}>
                            <Text style={styles.btnText}>Register</Text>
                        </Pressable> :
                        <View style={{alignItems:'center'}}>
                            <LottieView
                                autoPlay
                                style={{
                                    width: 40,
                                    height: 40,
                                    backgroundColor: 'white',
                                }}
                                // Find more Lottie files at https://lottiefiles.com/featured
                                source={require('../assets/loading.json')}
                            />
                        </View>}
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
        marginTop: 10
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