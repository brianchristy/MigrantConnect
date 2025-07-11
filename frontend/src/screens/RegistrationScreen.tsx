import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { registerUser } from '../services/auth';

export default function RegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [password, setPassword] = useState('');
  const [language, setLanguage] = useState('en');

  const handleRegister = async () => {
    try {
      await registerUser({ name, phone, aadhaar, language, password });
      Alert.alert('Success', 'User registered!');
      if (navigation) navigation.navigate('Login');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Phone</Text>
      <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Aadhaar</Text>
      <TextInput value={aadhaar} onChangeText={setAadhaar} keyboardType="number-pad" style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Register" onPress={handleRegister} />
      {navigation && (
        <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
      )}
    </View>
  );
} 