import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useCredentialStorage } from '../services/credentialStorage';

const QRCodeTestGenerator: React.FC = () => {
  const [selectedQRType, setSelectedQRType] = useState<'service' | 'credential' | null>(null);
  const [qrData, setQrData] = useState<string>('');
  const { credentials } = useCredentialStorage();

  const generateServiceQR = () => {
    const serviceQRPayload = {
      serviceType: 'pds_verification',
      verifierId: 'test-verifier-001',
      criteria: {
        cardTypes: ['APL', 'BPL', 'AAY'],
        requiresDocumentVerification: true,
        maxFamilySize: 10,
        portabilityEnabled: true
      },
      nonce: Date.now(),
      timestamp: new Date().toISOString()
    };

    const qrString = JSON.stringify(serviceQRPayload, null, 2);
    setQrData(qrString);
    setSelectedQRType('service');
  };

  const generateCredentialQR = () => {
    if (credentials.length === 0) {
      Alert.alert('No Credentials', 'Please add some credentials first to generate credential QR codes.');
      return;
    }

    // Use the first available credential
    const credential = credentials[0];
    
    // Create a mock credential QR payload (in real app, this would be encrypted)
    const credentialQRPayload = {
      vc_type: credential.credential.type,
      encrypted_payload: Buffer.from(JSON.stringify(credential.credential)).toString('base64'),
      valid_until: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      nonce: Date.now().toString()
    };

    const qrString = JSON.stringify(credentialQRPayload, null, 2);
    setQrData(qrString);
    setSelectedQRType('credential');
  };

  const clearQR = () => {
    setQrData('');
    setSelectedQRType(null);
  };

  const copyToClipboard = () => {
    // In a real app, you'd use Clipboard API
    Alert.alert('QR Data', qrData, [
      { text: 'OK' }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="qr-code" size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>QR Code Test Generator</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Generate Test QR Codes</Text>
          <Text style={styles.sectionSubtitle}>
            Create QR codes to test the scanner functionality
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.serviceButton]} 
            onPress={generateServiceQR}
          >
            <Ionicons name="business" size={24} color="white" />
            <Text style={styles.buttonText}>Generate Service QR</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.credentialButton]} 
            onPress={generateCredentialQR}
          >
            <Ionicons name="card" size={24} color="white" />
            <Text style={styles.buttonText}>Generate Credential QR</Text>
          </TouchableOpacity>

          {qrData && (
            <TouchableOpacity 
              style={[styles.button, styles.clearButton]} 
              onPress={clearQR}
            >
              <Ionicons name="trash" size={24} color="white" />
              <Text style={styles.buttonText}>Clear QR</Text>
            </TouchableOpacity>
          )}
        </View>

        {qrData && (
          <View style={styles.qrContainer}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>
                {selectedQRType === 'service' ? 'Service QR Code' : 'Credential QR Code'}
              </Text>
              <TouchableOpacity onPress={copyToClipboard}>
                <Ionicons name="copy" size={20} color="#007AFF" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrWrapper}>
              <QRCode 
                value={qrData}
                size={250}
                color="black"
                backgroundColor="white"
              />
            </View>

            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoTitle}>QR Data Preview:</Text>
              <Text style={styles.qrInfoText} numberOfLines={3}>
                {qrData.length > 100 ? `${qrData.substring(0, 100)}...` : qrData}
              </Text>
            </View>

            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>How to Test:</Text>
              <Text style={styles.instructionsText}>
                1. Open the Verification Center{'\n'}
                2. Choose "Scan QR Code"{'\n'}
                3. Scan this QR code{'\n'}
                4. The app should detect the QR type and process accordingly
              </Text>
            </View>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>QR Code Types:</Text>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Service QR Codes</Text>
            <Text style={styles.infoCardText}>
              • Contain service information (serviceType, verifierId, criteria){'\n'}
              • Used by service centers to define eligibility rules{'\n'}
              • When scanned, prompts user to select their credentials
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Credential QR Codes</Text>
            <Text style={styles.infoCardText}>
              • Contain encrypted credential data (vc_type, encrypted_payload){'\n'}
              • Used by users to share their credentials{'\n'}
              • When scanned, prompts user to select target service
            </Text>
          </View>
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
    justifyContent: 'center',
    paddingVertical: 20,
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
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  serviceButton: {
    backgroundColor: '#4ECDC4',
  },
  credentialButton: {
    backgroundColor: '#FF6B35',
  },
  clearButton: {
    backgroundColor: '#FF6B6B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  qrContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  qrWrapper: {
    alignItems: 'center',
    marginBottom: 15,
  },
  qrInfo: {
    marginBottom: 15,
  },
  qrInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 5,
  },
  qrInfoText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 4,
  },
  instructions: {
    backgroundColor: '#E8F4FD',
    padding: 15,
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 12,
    color: '#2C3E50',
    lineHeight: 18,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  infoCardText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});

export default QRCodeTestGenerator; 