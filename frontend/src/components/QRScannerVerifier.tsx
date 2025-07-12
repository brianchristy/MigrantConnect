import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { VerifiableCredential } from '../services/credentialStorage';
import verificationService, { QRPayload, VerificationResponse } from '../services/verificationService';

interface QRScannerVerifierProps {
  service: string;
  onClose: () => void;
  onVerificationComplete: (result: VerificationResponse) => void;
}

const { width, height } = Dimensions.get('window');

const QRScannerVerifier: React.FC<QRScannerVerifierProps> = ({
  service,
  onClose,
  onVerificationComplete
}) => {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [verifierId] = useState(`verifier_${Date.now()}`);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (locationStatus === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Parse QR data
      const qrPayload: QRPayload = JSON.parse(result.data);
      
      // Validate QR payload
      if (!qrPayload.vc_type || !qrPayload.encrypted_payload || !qrPayload.valid_until) {
        throw new Error('Invalid QR code format');
      }

      // Check if QR is expired
      const expiryTime = new Date(qrPayload.valid_until);
      if (expiryTime <= new Date()) {
        throw new Error('QR code has expired');
      }

      // Decode credential
      const credentialData = Buffer.from(qrPayload.encrypted_payload, 'base64').toString();
      const credential: VerifiableCredential = JSON.parse(credentialData);

      // Show consent prompt
      const consentGiven = await showConsentPrompt(credential, service);
      
      if (!consentGiven) {
        setLoading(false);
        setScanned(false);
        return;
      }

      // Verify eligibility
      const verificationResult = await verificationService.verifyEligibility({
        vc: credential,
        service,
        verifierId,
        consentGiven: true,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : undefined,
        qrHash: qrPayload.nonce
      });

      onVerificationComplete(verificationResult);

    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        'Scan Error',
        error instanceof Error ? error.message : 'Failed to process QR code',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setLoading(false);
            }
          }
        ]
      );
    }
  };

  const showConsentPrompt = (credential: VerifiableCredential, service: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Consent Required',
        `Do you consent to share your ${getCredentialDisplayName(credential.type)} for ${getServiceDisplayName(service)} verification?`,
        [
          {
            text: 'Deny',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Consent',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  };

  const getCredentialDisplayName = (type: string) => {
    switch (type) {
      case 'RationCardVC':
        return 'Ration Card';
      case 'HealthCardVC':
        return 'Health Card';
      case 'EducationCardVC':
        return 'Education Card';
      case 'SkillCertVC':
        return 'Skill Certificate';
      default:
        return type;
    }
  };

  const getServiceDisplayName = (serviceId: string) => {
    switch (serviceId) {
      case 'ration_portability':
        return 'Ration Portability';
      case 'health_emergency':
        return 'Health Emergency';
      case 'education_scholarship':
        return 'Education Scholarship';
      case 'skill_training':
        return 'Skill Training';
      default:
        return serviceId;
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  const handleRequestPermission = async () => {
    const { status } = await requestPermission();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is required to scan QR codes');
    }
  };

  if (!permission) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
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
          This app needs camera access to scan QR codes for verification.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handleRequestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan QR Code</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Scanning Frame */}
          <View style={styles.scanFrame}>
            <View style={styles.corner} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Position the QR code within the frame
            </Text>
            <Text style={styles.serviceText}>
              Service: {getServiceDisplayName(service)}
            </Text>
          </View>

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="white" />
              <Text style={styles.loadingOverlayText}>Verifying...</Text>
            </View>
          )}
        </View>
      </CameraView>

      {/* Reset Button */}
      {scanned && !loading && (
        <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.resetButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  placeholder: {
    width: 40,
  },
  scanFrame: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 250,
    height: 250,
    marginLeft: -125,
    marginTop: -125,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#007AFF',
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: 0,
    left: 0,
  },
  cornerTopRight: {
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    right: 0,
    left: 'auto',
  },
  cornerBottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderTopWidth: 0,
    borderRightWidth: 0,
    bottom: 0,
    top: 'auto',
  },
  cornerBottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
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
  serviceText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    color: 'white',
    fontSize: 18,
    marginTop: 16,
  },
  resetButton: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default QRScannerVerifier; 