import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Modal
} from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { VerifiableCredential } from '../services/credentialStorage';
import verificationService, { QRPayload, VerificationResponse } from '../services/verificationService';

interface CredentialVerificationScannerProps {
  onVerificationComplete: (result: VerificationResponse) => void;
  onClose: () => void;
  verifierId?: string;
}

const { width, height } = Dimensions.get('window');

const CredentialVerificationScanner: React.FC<CredentialVerificationScannerProps> = ({
  onVerificationComplete,
  onClose,
  verifierId: passedVerifierId
}) => {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [verifierId] = useState(passedVerifierId || `mobile-verifier-${Date.now()}`);
  const [permission, requestPermission] = useCameraPermissions();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [scannedCredential, setScannedCredential] = useState<VerifiableCredential | null>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);

  useEffect(() => {
    requestLocationPermission();
    loadAvailableServices();
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

  const loadAvailableServices = async () => {
    try {
      const services = await verificationService.getAvailableServices();
      setAvailableServices(services);
    } catch (error) {
      console.error('Error loading services:', error);
      // Fallback services
      setAvailableServices([
        { id: 'pds_verification', name: 'PDS Verification', description: 'Verify ration card for PDS benefits' },
        { id: 'health_emergency', name: 'Health Emergency', description: 'Emergency healthcare verification' },
        { id: 'education_scholarship', name: 'Education Scholarship', description: 'Educational benefits verification' },
        { id: 'skill_training', name: 'Skill Training', description: 'Skill development program verification' }
      ]);
    }
  };

  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned) return;
    
    setScanned(true);
    setLoading(true);

    try {
      console.log('=== CREDENTIAL VERIFICATION SCANNER ===');
      console.log('QR Code scanned:', result.data);
      console.log('QR Data type:', typeof result.data);
      console.log('QR Data length:', result.data.length);
      
      // Parse QR data
      let qrPayload: QRPayload;
      try {
        qrPayload = JSON.parse(result.data);
        console.log('Parsed QR payload:', qrPayload);
        console.log('QR payload keys:', Object.keys(qrPayload));
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid QR code format - not a valid JSON');
      }
      
      // Validate QR payload
      console.log('Validating QR payload...');
      console.log('vc_type:', qrPayload.vc_type);
      console.log('encrypted_payload exists:', !!qrPayload.encrypted_payload);
      console.log('valid_until:', qrPayload.valid_until);
      
      if (!qrPayload.vc_type || !qrPayload.encrypted_payload || !qrPayload.valid_until) {
        console.error('Missing required fields:', {
          vc_type: !!qrPayload.vc_type,
          encrypted_payload: !!qrPayload.encrypted_payload,
          valid_until: !!qrPayload.valid_until
        });
        throw new Error('Invalid credential QR code format - missing required fields');
      }

      // Check if QR is expired
      const expiryTime = new Date(qrPayload.valid_until);
      if (expiryTime <= new Date()) {
        throw new Error('QR code has expired');
      }

      // Decode credential
      const credentialData = Buffer.from(qrPayload.encrypted_payload, 'base64').toString();
      const credential: VerifiableCredential = JSON.parse(credentialData);

      console.log('Decoded credential:', credential);
      setScannedCredential(credential);
      setShowServiceModal(true);
      setLoading(false);

    } catch (error) {
      console.error('Error processing QR code:', error);
      setLoading(false);
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
          },
          {
            text: 'Close',
            onPress: onClose
          }
        ]
      );
    }
  };

  const handleServiceSelection = async (serviceId: string) => {
    if (!scannedCredential) return;
    
    setShowServiceModal(false);
    setLoading(true);

    try {
      console.log('Selected service:', serviceId);
      console.log('Credential type:', scannedCredential.type);

      // Show consent prompt
      const consentGiven = await showConsentPrompt(scannedCredential, serviceId);
      
      if (!consentGiven) {
        setLoading(false);
        setScanned(false);
        setScannedCredential(null);
        return;
      }

      // Verify eligibility
      const verificationResult = await verificationService.verifyEligibility({
        vc: scannedCredential,
        service: serviceId,
        verifierId,
        consentGiven: true,
        location: location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        } : undefined,
        qrHash: scannedCredential.credentialSubject?.id || scannedCredential.credentialSubject?.aadhaarNumber || 'unknown'
      });

      console.log('Verification result:', verificationResult);
      
      // Return the eligibility proof
      onVerificationComplete(verificationResult);

    } catch (error) {
      console.error('Error during verification:', error);
      setLoading(false);
      Alert.alert(
        'Verification Error',
        error instanceof Error ? error.message : 'Failed to verify eligibility',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setScannedCredential(null);
              setLoading(false);
            }
          },
          {
            text: 'Close',
            onPress: onClose
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
      case 'pds_verification':
        return 'PDS Verification';
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
    setScannedCredential(null);
    setShowServiceModal(false);
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
          This app needs camera access to scan credential QR codes for verification.
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
    <SafeAreaView style={styles.container}>
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
            <Text style={styles.headerTitle}>Scan Credential QR</Text>
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
              Position the credential QR code within the frame
            </Text>
            <Text style={styles.subText}>
              This will verify your eligibility for services
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
      {scanned && !loading && !showServiceModal && (
        <TouchableOpacity style={styles.resetButton} onPress={resetScanner}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.resetButtonText}>Scan Again</Text>
        </TouchableOpacity>
      )}

      {/* Service Selection Modal */}
      <Modal
        visible={showServiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Service</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {scannedCredential && (
              <View style={styles.credentialInfo}>
                <Text style={styles.credentialTitle}>
                  {getCredentialDisplayName(scannedCredential.type)}
                </Text>
                <Text style={styles.credentialId}>
                  ID: {scannedCredential.credentialSubject?.id || scannedCredential.credentialSubject?.aadhaarNumber || 'Unknown'}
                </Text>
              </View>
            )}

            <Text style={styles.modalSubtitle}>
              Choose the service for verification:
            </Text>

            <View style={styles.serviceList}>
              {availableServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceItem}
                  onPress={() => handleServiceSelection(service.id)}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#007AFF" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setShowServiceModal(false);
                resetScanner();
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  subText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  credentialInfo: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  credentialId: {
    fontSize: 14,
    color: '#666',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  serviceList: {
    marginBottom: 20,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CredentialVerificationScanner; 