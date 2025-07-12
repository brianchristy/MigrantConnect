import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, Linking, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
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
    return result.assets[0];
  };
  const pickPanFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setPanFile(result.assets[0]);
    return result.assets[0];
  };
  const pickRationFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setRationFile(result.assets[0]);
    return result.assets[0];
  };
  const pickEmploymentHistoryFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (result.canceled) return;
    setEmploymentHistoryFile(result.assets[0]);
    return result.assets[0];
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
      clearFileSelections(); // Clear selections after upload
      fetchDocuments(); // Refresh uploaded docs
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Document upload failed');
    }
  };

  // Add delete document handler
  const handleDeleteDocument = async (docId: string) => {
    try {
      await axios.delete(`${process.env.API_BASE_URL}/api/documents/${docId}`);
      Alert.alert('Success', 'Document deleted');
      // Clear file selections
      setAadhaarFile(null);
      setPanFile(null);
      setRationFile(null);
      setEmploymentHistoryFile(null);
      setAadhaarNumber('');
      setPanNumber('');
      setRationNumber('');
      fetchDocuments();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to delete document');
    }
  };

  // Helper to get uploaded doc by type
  const getUploadedDoc = (type: string) => uploadedDocs.find(doc => doc.type === type);

  // Clear file selections after upload
  const clearFileSelections = () => {
    setAadhaarFile(null);
    setPanFile(null);
    setRationFile(null);
    setEmploymentHistoryFile(null);
    setAadhaarNumber('');
    setPanNumber('');
    setRationNumber('');
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Custom Navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Welcome', { user: { phone } })}
          >
            <Text style={styles.backButtonText}>← Back to Welcome</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Documents</Text>
          <Text style={styles.headerSubtitle}>Manage your identity documents</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.profileCard}>
            <Text style={styles.label}>Phone: {phone}</Text>
            <Text style={styles.label}>Name</Text>
            <TextInput 
              value={name} 
              onChangeText={setName} 
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999"
            />
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
              <Text style={styles.updateButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Document Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add Documents</Text>
          
          {/* Aadhaar */}
          {getUploadedDoc('aadhaar') ? (
            <View style={styles.uploadedCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docIcon}>🆔</Text>
                <Text style={styles.docTitle}>Aadhaar Card</Text>
              </View>
              <Text style={styles.docInfo}>Number: {getUploadedDoc('aadhaar').number || '-'}</Text>
              <Text style={styles.docInfo}>File: {getUploadedDoc('aadhaar').fileName}</Text>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteDocument(getUploadedDoc('aadhaar')._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadCard}>
              <Text style={styles.docIcon}>🆔</Text>
              <Text style={styles.docTitle}>Aadhaar Card</Text>
              <TextInput 
                value={aadhaarNumber} 
                onChangeText={setAadhaarNumber} 
                keyboardType="number-pad" 
                style={styles.input}
                placeholder="Aadhaar number (optional)"
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickAadhaarFile}
              >
                <Text style={styles.uploadButtonText}>
                  {aadhaarFile ? `Selected: ${aadhaarFile.name}` : 'Upload Aadhaar File'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* PAN */}
          {getUploadedDoc('pan') ? (
            <View style={styles.uploadedCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docIcon}>📋</Text>
                <Text style={styles.docTitle}>PAN Card</Text>
              </View>
              <Text style={styles.docInfo}>Number: {getUploadedDoc('pan').number || '-'}</Text>
              <Text style={styles.docInfo}>File: {getUploadedDoc('pan').fileName}</Text>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteDocument(getUploadedDoc('pan')._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadCard}>
              <Text style={styles.docIcon}>📋</Text>
              <Text style={styles.docTitle}>PAN Card</Text>
              <TextInput 
                value={panNumber} 
                onChangeText={setPanNumber} 
                style={styles.input}
                placeholder="PAN number (optional)"
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickPanFile}
              >
                <Text style={styles.uploadButtonText}>
                  {panFile ? `Selected: ${panFile.name}` : 'Upload PAN File'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Ration Card */}
          {getUploadedDoc('ration') ? (
            <View style={styles.uploadedCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docIcon}>🍞</Text>
                <Text style={styles.docTitle}>Ration Card</Text>
              </View>
              <Text style={styles.docInfo}>Number: {getUploadedDoc('ration').number || '-'}</Text>
              <Text style={styles.docInfo}>File: {getUploadedDoc('ration').fileName}</Text>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteDocument(getUploadedDoc('ration')._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadCard}>
              <Text style={styles.docIcon}>🍞</Text>
              <Text style={styles.docTitle}>Ration Card</Text>
              <TextInput 
                value={rationNumber} 
                onChangeText={setRationNumber} 
                style={styles.input}
                placeholder="Ration card number (optional)"
                placeholderTextColor="#999"
              />
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickRationFile}
              >
                <Text style={styles.uploadButtonText}>
                  {rationFile ? `Selected: ${rationFile.name}` : 'Upload Ration Card File'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Employment History */}
          {getUploadedDoc('employment') ? (
            <View style={styles.uploadedCard}>
              <View style={styles.docHeader}>
                <Text style={styles.docIcon}>💼</Text>
                <Text style={styles.docTitle}>Employment History</Text>
              </View>
              <Text style={styles.docInfo}>File: {getUploadedDoc('employment').fileName}</Text>
              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={() => handleDeleteDocument(getUploadedDoc('employment')._id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.uploadCard}>
              <Text style={styles.docIcon}>💼</Text>
              <Text style={styles.docTitle}>Employment History</Text>
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickEmploymentHistoryFile}
              >
                <Text style={styles.uploadButtonText}>
                  {employmentHistoryFile ? `Selected: ${employmentHistoryFile.name}` : 'Upload Employment History File'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitDocuments}>
            <Text style={styles.submitButtonText}>Submit Documents</Text>
          </TouchableOpacity>
        </View>

        {/* Uploaded Documents Section */}
        {uploadedDocs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uploaded Documents</Text>
            {uploadedDocs.map((doc, idx) => (
              <View key={doc._id || idx} style={styles.downloadCard}>
                <View style={styles.docHeader}>
                  <Text style={styles.docIcon}>
                    {doc.type === 'aadhaar' ? '🆔' : 
                     doc.type === 'pan' ? '📋' : 
                     doc.type === 'ration' ? '🍞' : '💼'}
                  </Text>
                  <Text style={styles.docTitle}>{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</Text>
                </View>
                <Text style={styles.docInfo}>Number: {doc.number || '-'}</Text>
                <Text style={styles.docInfo}>File: {doc.fileName}</Text>
                <TouchableOpacity 
                  style={styles.downloadButton} 
                  onPress={() => Linking.openURL(`${process.env.API_BASE_URL}/api/documents/${doc._id}/download`)}
                >
                  <Text style={styles.downloadButtonText}>Download</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navBar: {
    paddingTop: 40, // Reduced padding for better positioning
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10, // Add some spacing from nav bar
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 12,
  },
  updateButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  uploadedCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  docTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  docInfo: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  uploadButton: {
    backgroundColor: '#27ae60',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
    shadowColor: '#9b59b6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  downloadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadButton: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  downloadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 