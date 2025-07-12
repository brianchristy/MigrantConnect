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

const MinimalScannerTest: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');

  const handleQRScanned = (data: string) => {
    setScannedData(data);
    setShowScanner(false);
    Alert.alert('Success!', `Scanned: ${data}`);
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
        <Ionicons name="qr-code-outline" size={64} color="#007AFF" />
        <Text style={styles.title}>Minimal QR Scanner Test</Text>
        <Text style={styles.subtitle}>
          Simple QR code scanning test
        </Text>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => setShowScanner(true)}
        >
          <Ionicons name="camera" size={24} color="white" />
          <Text style={styles.buttonText}>Start Scanner</Text>
        </TouchableOpacity>

        {scannedData ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Last Scanned:</Text>
            <Text style={styles.resultText}>{scannedData}</Text>
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
  },
  button: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  buttonText: {
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

export default MinimalScannerTest; 