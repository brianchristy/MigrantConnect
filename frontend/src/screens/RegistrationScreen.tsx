import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { registerUser } from '../services/auth';

export default function RegistrationScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      await registerUser({ name, phone, password });
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
      <Text>Password</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Re-enter Password</Text>
      <TextInput value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Register" onPress={handleRegister} />
      {navigation && (
        <Button title="Already have an account? Login" onPress={() => navigation.navigate('Login')} />
      )}
    </View>
  );
} 