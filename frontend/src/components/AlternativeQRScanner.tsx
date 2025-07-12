import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { VerifiableCredential } from '../services/credentialStorage';
import verificationService, { QRPayload, VerificationResponse } from '../services/verificationService';

interface AlternativeQRScannerProps {
  service?: string;
  onClose?: () => void;
  onVerificationComplete?: (result: VerificationResponse) => void;
  verifierId?: string;
  onQRScanned?: (qrData: string) => void;
}

const { width, height } = Dimensions.get('window');

const AlternativeQRScanner: React.FC<AlternativeQRScannerProps> = ({
  service,
  onClose,
  onVerificationComplete,
  verifierId: passedVerifierId,
  onQRScanned
}) => {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [verifierId] = useState(passedVerifierId || `verifier_${Date.now()}`);
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
      console.log('QR Code scanned:', result.data);
      
      // If onQRScanned is provided, use the new flow
      if (onQRScanned) {
        onQRScanned(result.data);
        setLoading(false);
        return;
      }

      // Legacy flow for backward compatibility
      if (!service || !onVerificationComplete) {
        throw new Error('Service and verification callback required for legacy flow');
      }

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
      const consentGiven = await showConsentPrompt(credential, service || 'unknown');
      
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
      case 'pds_verification':
        return 'PDS Verification';
      default:
        return serviceId;
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setLoading(false);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
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
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
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
          {/* Header */}
          <View style={styles.header}>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            )}
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
            {service && (
              <Text style={styles.serviceText}>
                Service: {getServiceDisplayName(service)}
              </Text>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
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
    marginBottom: 10,
  },
  serviceText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
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
    fontSize: 16,
    marginTop: 10,
  },
  resetButton: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 20,
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
    marginBottom: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AlternativeQRScanner; 