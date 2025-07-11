import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { getProfile, updateProfile } from '../services/auth';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';

export default function ProfileScreen({ route, navigation }: any) {
  const phone = route?.params?.phone;
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  // Remove password state
  // const [password, setPassword] = useState('');

  // Document states
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState<any>(null);
  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState<any>(null);
  const [rationNumber, setRationNumber] = useState('');
  const [rationFile, setRationFile] = useState<any>(null);
  const [employmentHistoryFile, setEmploymentHistoryFile] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    if (phone) {
      getProfile(phone)
        .then(res => {
          setProfile(res.data);
          setName(res.data.name || '');
        })
        .catch(() => Alert.alert('Error', 'Failed to load profile'))
        .finally(() => setLoading(false));
      // Fetch uploaded documents
      fetchDocuments();
    }
  }, [phone]);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${process.env.API_BASE_URL}/api/documents/${phone}`);
      setUploadedDocs(res.data);
    } catch (err) {
      setUploadedDocs([]);
    }
  };

  // Remove password from handleUpdate
  const handleUpdate = async () => {
    try {
      await updateProfile(phone, { name });
      Alert.alert('Success', 'Profile updated!');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Update failed');
    }
  };

  // Document pickers
  const pickAadhaarFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setAadhaarFile(result.assets[0]);
  };
  const pickPanFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setPanFile(result.assets[0]);
  };
  const pickRationFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setRationFile(result.assets[0]);
  };
  const pickEmploymentHistoryFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setEmploymentHistoryFile(result.assets[0]);
  };

  // Document submission
  const handleSubmitDocuments = async () => {
    try {
      const formDataList = [];
      if (aadhaarFile) {
        const formData = new FormData();
        formData.append('file', {
          uri: aadhaarFile.uri,
          name: aadhaarFile.name,
          type: aadhaarFile.mimeType || 'application/octet-stream',
        } as any);
        formData.append('userPhone', phone);
        formData.append('type', 'aadhaar');
        formData.append('number', aadhaarNumber);
        formDataList.push(formData);
      }
      if (panFile) {
        const formData = new FormData();
        formData.append('file', {
          uri: panFile.uri,
          name: panFile.name,
          type: panFile.mimeType || 'application/octet-stream',
        } as any);
        formData.append('userPhone', phone);
        formData.append('type', 'pan');
        formData.append('number', panNumber);
        formDataList.push(formData);
      }
      if (rationFile) {
        const formData = new FormData();
        formData.append('file', {
          uri: rationFile.uri,
          name: rationFile.name,
          type: rationFile.mimeType || 'application/octet-stream',
        } as any);
        formData.append('userPhone', phone);
        formData.append('type', 'ration');
        formData.append('number', rationNumber);
        formDataList.push(formData);
      }
      if (employmentHistoryFile) {
        const formData = new FormData();
        formData.append('file', {
          uri: employmentHistoryFile.uri,
          name: employmentHistoryFile.name,
          type: employmentHistoryFile.mimeType || 'application/octet-stream',
        } as any);
        formData.append('userPhone', phone);
        formData.append('type', 'employment');
        formDataList.push(formData);
      }
      if (formDataList.length === 0) {
        Alert.alert('No documents selected', 'Please select at least one document to upload.');
        return;
      }
      // Upload all documents sequentially
      for (const formData of formDataList) {
        await axios.post(`${process.env.API_BASE_URL}/api/documents/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      Alert.alert('Success', 'Documents uploaded successfully!');
      fetchDocuments(); // Refresh uploaded docs
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Document upload failed');
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text>Phone: {phone}</Text>
      <Text>Name</Text>
      <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1, marginBottom: 10 }} />
      <Button title="Update Profile" onPress={handleUpdate} />
      {/* Document Upload Section */}
      <View style={{ marginTop: 30 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Add Documents</Text>
        {/* Aadhaar */}
        <Text style={{ marginTop: 10 }}>Aadhaar Number</Text>
        <TextInput value={aadhaarNumber} onChangeText={setAadhaarNumber} keyboardType="number-pad" style={{ borderWidth: 1, marginBottom: 5 }} />
        <Button title={aadhaarFile ? `Selected: ${aadhaarFile.name}` : 'Upload Aadhaar File'} onPress={pickAadhaarFile} />
        {/* PAN */}
        <Text style={{ marginTop: 15 }}>PAN Number</Text>
        <TextInput value={panNumber} onChangeText={setPanNumber} style={{ borderWidth: 1, marginBottom: 5 }} />
        <Button title={panFile ? `Selected: ${panFile.name}` : 'Upload PAN File'} onPress={pickPanFile} />
        {/* Ration Card */}
        <Text style={{ marginTop: 15 }}>Ration Card Number</Text>
        <TextInput value={rationNumber} onChangeText={setRationNumber} style={{ borderWidth: 1, marginBottom: 5 }} />
        <Button title={rationFile ? `Selected: ${rationFile.name}` : 'Upload Ration Card File'} onPress={pickRationFile} />
        {/* Employment History */}
        <Text style={{ marginTop: 15 }}>Employment History</Text>
        <Button title={employmentHistoryFile ? `Selected: ${employmentHistoryFile.name}` : 'Upload Employment History File'} onPress={pickEmploymentHistoryFile} />
        {/* Submit Documents Button */}
        <Button title="Submit Documents" onPress={handleSubmitDocuments} color="#2196F3" />
      </View>
      {/* Uploaded Documents Section */}
      <View style={{ marginTop: 40 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Uploaded Documents</Text>
        {uploadedDocs.length === 0 && <Text>No documents uploaded yet.</Text>}
        {uploadedDocs.map((doc, idx) => (
          <View key={doc._id || idx} style={{ marginBottom: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10 }}>
            <Text>Type: {doc.type}</Text>
            <Text>Number: {doc.number || '-'}</Text>
            <Text>File: {doc.fileName}</Text>
            <Button title="Download" onPress={() => Linking.openURL(`${process.env.API_BASE_URL}/api/documents/${doc._id}/download`)} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 