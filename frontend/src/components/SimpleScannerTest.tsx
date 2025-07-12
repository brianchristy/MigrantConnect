import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlternativeQRScanner from './AlternativeQRScanner';

const SimpleScannerTest: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');

  const handleQRScanned = (data: string) => {
    setScannedData(data);
    setShowScanner(false);
    
    console.log('QR Code scanned successfully!');
    console.log('Data:', data);
    
    Alert.alert(
      'QR Code Scanned!',
      `Data: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => {
            setScannedData('');
            setShowScanner(true);
          }
        },
        {
          text: 'Close',
          style: 'cancel'
        }
      ]
    );
  };

  if (showScanner) {
    return (
      <AlternativeQRScanner
        onQRScanned={handleQRScanned}
        onClose={() => setShowScanner(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="qr-code" size={80} color="#007AFF" />
        <Text style={styles.title}>Simple QR Scanner Test</Text>
        <Text style={styles.subtitle}>
          Test the QR scanner functionality
        </Text>
        
        <TouchableOpacity 
          style={styles.scanButton} 
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.scanButtonText}>Start Scanner</Text>
        </TouchableOpacity>

        {scannedData ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Last Scanned Data:</Text>
            <Text style={styles.resultText}>
              {scannedData.length > 50 
                ? `${scannedData.substring(0, 50)}...` 
                : scannedData
              }
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default SimpleScannerTest; 