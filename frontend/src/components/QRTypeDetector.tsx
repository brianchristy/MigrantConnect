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
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';

const QRTypeDetector: React.FC = () => {
  const [scanned, setScanned] = useState(false);
  const [qrData, setQrData] = useState<string>('');
  const [qrType, setQrType] = useState<'service' | 'credential' | 'unknown' | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    setQrData(result.data);

    try {
      console.log('=== QR TYPE DETECTOR ===');
      console.log('QR Data:', result.data);
      
      const qrPayload = JSON.parse(result.data);
      console.log('Parsed payload:', qrPayload);
      console.log('Payload keys:', Object.keys(qrPayload));

      // Check if it's a service QR
      if (qrPayload.serviceType && qrPayload.verifierId) {
        setQrType('service');
        Alert.alert(
          'Service QR Code Detected',
          `This is a service QR code for: ${qrPayload.serviceType}\n\nUse "Scan Service QR" in the Verification Center.`,
          [
            { text: 'OK', onPress: () => setScanned(false) },
            { text: 'Copy Data', onPress: () => console.log('Service QR Data:', result.data) }
          ]
        );
        return;
      }

      // Check if it's a credential QR
      if (qrPayload.vc_type && qrPayload.encrypted_payload && qrPayload.valid_until) {
        setQrType('credential');
        Alert.alert(
          'Credential QR Code Detected',
          `This is a credential QR code for: ${qrPayload.vc_type}\n\nUse "Verify Credential QR" in the Verification Center.`,
          [
            { text: 'OK', onPress: () => setScanned(false) },
            { text: 'Copy Data', onPress: () => console.log('Credential QR Data:', result.data) }
          ]
        );
        return;
      }

      // Unknown format
      setQrType('unknown');
      Alert.alert(
        'Unknown QR Format',
        'This QR code format is not recognized. It might be:\n\n• A different type of QR code\n• Malformed data\n• Not a JSON format',
        [
          { text: 'OK', onPress: () => setScanned(false) },
          { text: 'Copy Data', onPress: () => console.log('Unknown QR Data:', result.data) }
        ]
      );

    } catch (error) {
      console.error('Error parsing QR:', error);
      setQrType('unknown');
      Alert.alert(
        'Invalid QR Format',
        'This QR code is not in JSON format. It might be:\n\n• A plain text QR code\n• A URL\n• A different format',
        [
          { text: 'OK', onPress: () => setScanned(false) },
          { text: 'Copy Data', onPress: () => console.log('Raw QR Data:', result.data) }
        ]
      );
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setQrData('');
    setQrType(null);
  };

  const getQRTypeInfo = () => {
    switch (qrType) {
      case 'service':
        return {
          title: 'Service QR Code',
          description: 'This QR code is for service centers (PDS shops, hospitals, etc.)',
          icon: 'storefront',
          color: '#FF6B35',
          action: 'Use "Scan Service QR" in Verification Center'
        };
      case 'credential':
        return {
          title: 'Credential QR Code',
          description: 'This QR code contains user credential information',
          icon: 'card',
          color: '#27AE60',
          action: 'Use "Verify Credential QR" in Verification Center'
        };
      case 'unknown':
        return {
          title: 'Unknown QR Format',
          description: 'This QR code format is not recognized',
          icon: 'help-circle',
          color: '#9B59B6',
          action: 'Check the QR code format or try a different QR code'
        };
      default:
        return null;
    }
  };

  const qrTypeInfo = getQRTypeInfo();

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Requesting permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera" size={64} color="#FF6B6B" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          This app needs camera access to scan QR codes.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>QR Type Detector</Text>
            <Text style={styles.headerSubtitle}>
              Scan any QR code to identify its type
            </Text>
          </View>

          <View style={styles.scanFrame}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Position any QR code within the frame
            </Text>
            <Text style={styles.subText}>
              This will identify if it's a service or credential QR
            </Text>
          </View>
        </View>
      </CameraView>

      {scanned && qrTypeInfo && (
        <View style={styles.resultOverlay}>
          <View style={styles.resultCard}>
            <View style={[styles.resultIcon, { backgroundColor: qrTypeInfo.color }]}>
              <Ionicons name={qrTypeInfo.icon as any} size={32} color="white" />
            </View>
            <Text style={styles.resultTitle}>{qrTypeInfo.title}</Text>
            <Text style={styles.resultDescription}>{qrTypeInfo.description}</Text>
            <Text style={styles.resultAction}>{qrTypeInfo.action}</Text>
            
            <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
              <Ionicons name="refresh" size={20} color="white" />
              <Text style={styles.resetButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {qrData && (
        <View style={styles.dataSection}>
          <Text style={styles.dataTitle}>QR Data (first 100 chars):</Text>
          <Text style={styles.dataText}>
            {qrData.length > 100 ? `${qrData.substring(0, 100)}...` : qrData}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    color: '#CCC',
    fontSize: 14,
    textAlign: 'center',
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  subText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: 300,
    width: '100%',
  },
  resultIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  resultAction: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dataSection: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 8,
  },
  dataTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dataText: {
    color: '#CCC',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QRTypeDetector; 