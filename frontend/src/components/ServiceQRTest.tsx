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
import ServiceQRScanner from './ServiceQRScanner';

const ServiceQRTest: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [testResult, setTestResult] = useState<string>('');

  // Test service QR data from the generated service QR
  const testServiceQRData = {
    serviceType: "pds_verification",
    verifierId: "pds-shop-001",
    criteria: {
      cardTypes: ["APL", "BPL", "AAY"],
      requiresDocumentVerification: true,
      maxFamilySize: 10,
      portabilityEnabled: true
    },
    nonce: 1752300036289,
    timestamp: "2025-07-12T06:00:36.289Z"
  };

  const handleServiceQRScanned = (qrData: string) => {
    console.log('Service QR scanned:', qrData);
    setTestResult(qrData);
    setShowScanner(false);
    
    Alert.alert(
      'Service QR Scanned Successfully!',
      'The service QR code was processed correctly. Check the console for details.',
      [{ text: 'OK' }]
    );
  };

  const testManualQRData = () => {
    try {
      const qrString = JSON.stringify(testServiceQRData);
      console.log('Testing with service QR data:', qrString);
      
      // Parse and validate the QR data
      const qrPayload = JSON.parse(qrString);
      
      if (!qrPayload.serviceType || !qrPayload.verifierId) {
        Alert.alert('Test Error', 'Invalid service QR data format');
        return;
      }

      console.log('Service QR data is valid');
      console.log('Service Type:', qrPayload.serviceType);
      console.log('Verifier ID:', qrPayload.verifierId);
      
      Alert.alert(
        'Service QR Data Valid',
        `Service Type: ${qrPayload.serviceType}\nVerifier ID: ${qrPayload.verifierId}\n\nThis is a valid service QR code format.`,
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
      <ServiceQRScanner
        onQRScanned={handleServiceQRScanned}
        onClose={() => setShowScanner(false)}
        verifierId="test-service-verifier"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="storefront" size={32} color="#FF6B35" />
        <Text style={styles.headerTitle}>Service QR Test</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service QR Testing</Text>
          <Text style={styles.sectionDescription}>
            This component helps test service QR scanning functionality.
          </Text>
        </View>

        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Manual QR Data Test</Text>
          <Text style={styles.testDescription}>
            Test the service QR data parsing without scanning
          </Text>
          
          <TouchableOpacity style={styles.testButton} onPress={testManualQRData}>
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.testButtonText}>Test QR Data</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.testSection}>
          <Text style={styles.testTitle}>Scanner Test</Text>
          <Text style={styles.testDescription}>
            Open the service QR scanner
          </Text>
          
          <TouchableOpacity style={styles.testButton} onPress={() => setShowScanner(true)}>
            <Ionicons name="camera" size={20} color="white" />
            <Text style={styles.testButtonText}>Open Scanner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.qrDataSection}>
          <Text style={styles.qrDataTitle}>Test Service QR Data Format</Text>
          <Text style={styles.qrDataText}>
            {JSON.stringify(testServiceQRData, null, 2)}
          </Text>
        </View>

        {testResult && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Scan Result</Text>
            <Text style={styles.resultText}>
              {testResult.length > 200 ? `${testResult.substring(0, 200)}...` : testResult}
            </Text>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Service QR vs Credential QR</Text>
          <Text style={styles.infoText}>
            • <Text style={styles.bold}>Service QR:</Text> Used by service centers (PDS shops, hospitals, etc.){'\n'}
            • <Text style={styles.bold}>Credential QR:</Text> Used by users to share their credentials{'\n\n'}
            <Text style={styles.bold}>Service QR Format:</Text>{'\n'}
            - serviceType: Type of service{'\n'}
            - verifierId: ID of the service center{'\n'}
            - criteria: Eligibility criteria{'\n'}
            - nonce: Unique identifier{'\n\n'}
            <Text style={styles.bold}>Credential QR Format:</Text>{'\n'}
            - vc_type: Type of credential{'\n'}
            - encrypted_payload: Base64 encoded credential{'\n'}
            - valid_until: Expiry timestamp{'\n'}
            - nonce: Unique identifier
          </Text>
        </View>
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
    backgroundColor: '#FF6B35',
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
  infoSection: {
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
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#2C3E50',
  },
});

export default ServiceQRTest; 