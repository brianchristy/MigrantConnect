import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CredentialVerificationScanner from './CredentialVerificationScanner';
import { VerificationResponse } from '../services/verificationService';

const CredentialQRTest: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [testResult, setTestResult] = useState<VerificationResponse | null>(null);

  // Test QR data from the generated credential QR
  const testQRData = {
    vc_type: "RationCardVC",
    encrypted_payload: "eyJpZCI6InRlc3QtY3JlZGVudGlhbC0wMDEiLCJ0eXBlIjoiUmF0aW9uQ2FyZFZDIiwiaXNzdWVyIjoiZ292ZXJubWVudC1vZi1pbmRpYSIsImlzc3VhbmNlRGF0ZSI6IjIwMjQtMDEtMDFUMDA6MDA6MDBaIiwidmFsaWRGcm9tIjoiMjAyNC0wMS0wMVQwMDowMDowMFoiLCJ2YWxpZFVudGlsIjoiMjAyNS0wMS0wMVQwMDowMDowMFoiLCJzdGF0dXMiOiJhY3RpdmUiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImFhZGhhYXItMTIzNDU2Nzg5MDEyIiwibmFtZSI6IlRlc3QgVXNlciIsImFhZGhhYXJOdW1iZXIiOiIxMjM0NTY3ODkwMTIiLCJyYXRpb25DYXJkTnVtYmVyIjoiUkMxMjM0NTY3ODkiLCJmYW1pbHlTaXplIjo0LCJjYXJkVHlwZSI6IkJQTCIsIk9OT1JDX2VuYWJsZWQiOnRydWUsImhvbWVTdGF0ZSI6Ikthcm5hdGFrYSIsImN1cnJlbnRTdGF0ZSI6Ikthcm5hdGFrYSIsInBvcnRhYmlsaXR5U3RhdHVzIjoiZW5hYmxlZCJ9LCJwcm9vZiI6eyJ0eXBlIjoiRWQyNTUxOVNpZ25hdHVyZTIwMjAiLCJjcmVhdGVkIjoiMjAyNC0wMS0wMVQwMDowMDowMFoiLCJ2ZXJpZmljYXRpb25NZXRob2QiOiJkaWQ6Z292OmluZGlhI2tleS0xIiwicHJvb2ZQdXJwb3NlIjoiYXNzZXJ0aW9uTWV0aG9kIiwicHJvb2ZWYWx1ZSI6InRlc3Qtc2lnbmF0dXJlLXZhbHVlIn19",
    valid_until: "2025-07-12T07:24:39.518Z",
    nonce: "f515346592318a97ac93e021d79143eb"
  };

  const handleVerificationComplete = (result: VerificationResponse) => {
    console.log('Test verification completed:', result);
    setTestResult(result);
    setShowScanner(false);
  };

  const testManualQRData = () => {
    try {
      // Simulate scanning the test QR data
      const qrString = JSON.stringify(testQRData);
      console.log('Testing with QR data:', qrString);
      
      // Parse and validate the QR data
      const qrPayload = JSON.parse(qrString);
      
      if (!qrPayload.vc_type || !qrPayload.encrypted_payload || !qrPayload.valid_until) {
        Alert.alert('Test Error', 'Invalid test QR data format');
        return;
      }

      // Decode the credential
      const credentialData = Buffer.from(qrPayload.encrypted_payload, 'base64').toString();
      const credential = JSON.parse(credentialData);
      
      console.log('Decoded credential:', credential);
      
      Alert.alert(
        'Test QR Data Valid',
        `Credential Type: ${credential.type}\nName: ${credential.credentialSubject?.name}\nAadhaar: ${credential.credentialSubject?.aadhaarNumber}`,
        [
          { text: 'OK' },
          { 
            text: 'Test Scanner', 
            onPress: () => setShowScanner(true) 
          }
        ]
      );
      
    } catch (error) {
      console.error('Test error:', error);
      Alert.alert('Test Error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  if (showScanner) {
    return (
      <CredentialVerificationScanner
        onVerificationComplete={handleVerificationComplete}
        onClose={() => setShowScanner(false)}
        verifierId="test-verifier"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bug" size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>Credential QR Test</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test QR Data</Text>
          <Text style={styles.sectionDescription}>
            This component helps test credential QR scanning functionality.
          </Text>
        </View>

        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Manual QR Data Test</Text>
          <Text style={styles.testDescription}>
            Test the QR data parsing without scanning
          </Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testManualQRData}>
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.testButtonText}>Test QR Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Scanner Test</Text>
          <Text style={styles.testDescription}>
            Open the credential verification scanner
          </Text>
          
          <TouchableOpacity style={styles.testButton} onPress={() => setShowScanner(true)}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.testButtonText}>Open Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qrDataSection}>
          <Text style={styles.qrDataTitle}>Test QR Data Format</Text>
          <Text style={styles.qrDataText}>
            {JSON.stringify(testQRData, null, 2)}
          </Text>
        </View>

        {testResult && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Test Result</Text>
            <Text style={styles.resultText}>
              {JSON.stringify(testResult, null, 2)}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  testSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  qrDataSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrDataTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  qrDataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 6,
  },
  resultSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 6,
  },
});

export default CredentialQRTest; 