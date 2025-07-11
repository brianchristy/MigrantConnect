import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { getProfile, updateProfile } from '../services/auth';

export default function ProfileScreen({ route, navigation }: any) {
  const phone = route?.params?.phone;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [language, setLanguage] = useState('en');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (phone) {
      getProfile(phone)
        .then(res => {
          setProfile(res.data);
          setName(res.data.name || '');
          setAadhaar(res.data.aadhaar || '');
          setLanguage(res.data.language || 'en');
        })
        .catch(() => Alert.alert('Error', 'Failed to load profile'))
        .finally(() => setLoading(false));
    }
  }, [phone]);

  const handleUpdate = async () => {
    try {
      await updateProfile(phone, { name, aadhaar, language, password: password || undefined });
      Alert.alert('Success', 'Profile updated!');
      setPassword('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Update failed');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <View style={{ padding: 20 }}>
      <Text>Phone: {phone}</Text>
      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Aadhaar</Text>
      <TextInput value={aadhaar} onChangeText={setAadhaar} keyboardType="number-pad" style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Language</Text>
      <TextInput value={language} onChangeText={setLanguage} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Text>Password (leave blank to keep unchanged)</Text>
      <TextInput value={password} onChangeText={setPassword} secureTextEntry style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Update Profile" onPress={handleUpdate} />
    </View>
  );
} 