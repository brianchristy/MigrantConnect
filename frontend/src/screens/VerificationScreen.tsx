import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ServiceQRDisplay from '../components/ServiceQRDisplay';
import QRScannerVerifier from '../components/QRScannerVerifier';
import ServiceQRScanner from '../components/ServiceQRScanner';
import ServiceQRTest from '../components/ServiceQRTest';
import CredentialSelector from '../components/CredentialSelector';
import EligibilityResultDisplay from '../components/EligibilityResultDisplay';
import MinimalScannerTest from '../components/MinimalScannerTest';
import CredentialVerificationScanner from '../components/CredentialVerificationScanner';
import CredentialQRTest from '../components/CredentialQRTest';
import QRTypeDetector from '../components/QRTypeDetector';
import ServiceVerificationPopup from '../components/ServiceVerificationPopup';
import SimpleCredentialSelector from '../components/SimpleCredentialSelector';
import { useCredentialStorage, VerifiableCredential } from '../services/credentialStorage';
import verificationService, { VerificationResponse } from '../services/verificationService';

type VerificationMode = 'menu' | 'generate' | 'scan' | 'result' | 'test' | 'credential-verify' | 'credential-test' | 'qr-detector' | 'service-test';

const VerificationScreen: React.FC = () => {
  const [mode, setMode] = useState<VerificationMode>('menu');
  const [selectedCredential, setSelectedCredential] = useState<any>(null);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [scannedQRData, setScannedQRData] = useState<any>(null);
  const [showServiceVerification, setShowServiceVerification] = useState(false);
  const { credentials } = useCredentialStorage();

  const handleServiceQRScan = async (qrData: string) => {
    try {
      console.log('=== VERIFICATION SCREEN: QR Data received ===');
      console.log('QR Data:', qrData);
      console.log('Current mode:', mode);
      
      // Try to parse as JSON first
      let qrPayload;
      try {
        qrPayload = JSON.parse(qrData);
      } catch (parseError) {
        console.log('QR data is not JSON, treating as plain text');
        // If it's not JSON, show the raw data
        Alert.alert('QR Code Scanned', `Raw data: ${qrData}`, [
          { text: 'OK', onPress: () => setMode('menu') }
        ]);
        return;
      }
      
      console.log('Parsed QR payload:', qrPayload);
      
      // Check if this is a service QR code
      if (qrPayload.serviceType) {
        console.log('Service QR detected');
        // Reset previous verification state when starting a new service verification
        setSelectedCredential(null);
        setVerificationResult(null);
        setShowServiceVerification(false);
        setScannedQRData(qrPayload);
        setMode('scan');
        return;
      }
      
      // Check if this is a credential QR code
      if (qrPayload.vc_type && qrPayload.encrypted_payload) {
        console.log('Credential QR detected');
        await handleCredentialQRScan(qrPayload);
        return;
      }
      
      // Unknown QR format
      Alert.alert('Unknown QR Format', 'This QR code format is not recognized. Please scan a valid service or credential QR code.', [
        { text: 'OK', onPress: () => setMode('menu') }
      ]);
    } catch (error) {
      console.error('Error handling QR scan:', error);
      Alert.alert('Error', 'Failed to process QR code data');
    }
  };

  const handleCredentialQRScan = async (qrPayload: any) => {
    try {
      console.log('Processing credential QR:', qrPayload);
      
      // Validate QR payload
      if (!qrPayload.vc_type || !qrPayload.encrypted_payload || !qrPayload.valid_until) {
        throw new Error('Invalid credential QR code format');
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

      // Show service selection dialog
      const selectedService = await showServiceSelectionDialog();
      if (!selectedService) {
        return; // User cancelled
      }

      // Show consent prompt
      const consentGiven = await showConsentPrompt(credential, selectedService);
      if (!consentGiven) {
        return;
      }

      // Verify eligibility
      const verificationResult = await verificationService.verifyEligibility({
        vc: credential,
        service: selectedService,
        verifierId: `mobile-app-verifier-${Date.now()}`,
        consentGiven: true,
        qrHash: qrPayload.nonce
      });

      setVerificationResult(verificationResult);
      setMode('result');

    } catch (error) {
      console.error('Error processing credential QR:', error);
      Alert.alert(
        'Credential QR Error',
        error instanceof Error ? error.message : 'Failed to process credential QR code',
        [{ text: 'OK', onPress: () => setMode('menu') }]
      );
    }
  };

  const showServiceSelectionDialog = (): Promise<string | null> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Select Service',
        'Choose the service for which you want to verify this credential:',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
          { text: 'PDS Verification', onPress: () => resolve('pds_verification') },
          { text: 'Health Emergency', onPress: () => resolve('health_emergency') },
          { text: 'Education Scholarship', onPress: () => resolve('education_scholarship') },
          { text: 'Skill Training', onPress: () => resolve('skill_training') },
        ]
      );
    });
  };

  const showConsentPrompt = (credential: VerifiableCredential, service: string): Promise<boolean> => {
    return new Promise((resolve) => {
      Alert.alert(
        'Consent Required',
        `Do you consent to share your ${getCredentialDisplayName(credential.type)} for ${getServiceDisplayName(service)} verification?`,
        [
          { text: 'Deny', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Consent', onPress: () => resolve(true) }
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

  const handleCredentialSelection = async (storedCredential: any) => {
    if (!scannedQRData) {
      Alert.alert('Error', 'No service QR data available');
      return;
    }

    try {
      console.log('Stored credential selected for verification:', storedCredential);
      console.log('Service type from QR:', scannedQRData.serviceType);
      
      setSelectedCredential(storedCredential);

      // Check if credential has an ID
      if (!storedCredential.id) {
        console.error('Stored credential missing ID:', storedCredential);
        Alert.alert('Error', 'Selected credential is missing ID. Please try selecting a different credential.');
        return;
      }

      // For testing: Use a hardcoded credential ID that exists in the backend
      // In a real app, you would sync credentials between frontend and backend
      const testCredentialIds: { [key: string]: string } = {
        'RationCardVC': '687229a01730debcbabbe460',
        'HealthCardVC': '687229a01730debcbabbe464',
        'EducationCardVC': '687229a01730debcbabbe465',
        'SkillCertVC': '687229a01730debcbabbe466'
      };
      
      const backendCredentialId = testCredentialIds[storedCredential.credential.type];
      
      if (!backendCredentialId) {
        Alert.alert('Error', 'No matching backend credential found for this type');
        return;
      }

      const verificationRequest = {
        qrPayload: {
          credentialId: backendCredentialId,
          serviceType: scannedQRData.serviceType,
          verifierId: scannedQRData.verifierId,
          nonce: scannedQRData.nonce
        },
        verifierId: scannedQRData.verifierId,
        consentGiven: true,
        location: {
          latitude: 0, // Replace with actual location if available
          longitude: 0
        }
      };

      console.log('Verification request:', verificationRequest);

      // Call verification service
      const result = await verificationService.verifyEligibility(verificationRequest);
      console.log('Verification result:', result);
      setVerificationResult(result);
      setShowServiceVerification(true);
      setMode('result');
    } catch (error: any) {
      console.error('Verification error:', error);
      Alert.alert('Verification Failed', error.message || 'Unknown error occurred');
      setMode('scan');
    }
  };

  const handleNewVerification = () => {
    setMode('menu');
    setSelectedCredential(null);
    setVerificationResult(null);
    setScannedQRData(null);
    setShowServiceVerification(false);
  };

  const handleCredentialVerificationComplete = (result: VerificationResponse) => {
    console.log('Credential verification completed:', result);
    setVerificationResult(result);
    setShowServiceVerification(true);
    setMode('result');
  };

  const renderMenu = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verification Center</Text>
        <Text style={styles.headerSubtitle}>
          Generate service QR codes or scan QR codes for eligibility verification
        </Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('generate')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#4ECDC4' }]}>
            <MaterialIcons name="qr-code" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Generate Service QR</Text>
            <Text style={styles.menuDescription}>
              Create QR codes for service centers (PDS, Healthcare, etc.)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('scan')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FF6B35' }]}>
            <MaterialIcons name="qr-code-scanner" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Scan Service QR</Text>
            <Text style={styles.menuDescription}>
              Scan service QR codes to verify eligibility
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('credential-verify')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#27AE60' }]}>
            <MaterialIcons name="verified-user" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Verify Credential QR</Text>
            <Text style={styles.menuDescription}>
              Scan credential QR codes for direct verification
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('test')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#9B59B6' }]}>
            <MaterialIcons name="bug-report" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Test Scanner</Text>
            <Text style={styles.menuDescription}>
              Test basic QR scanner functionality
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('credential-test')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#E67E22' }]}>
            <MaterialIcons name="qr-code-2" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Test Credential QR</Text>
            <Text style={styles.menuDescription}>
              Test credential QR scanning and verification
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('qr-detector')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#8E44AD' }]}>
            <MaterialIcons name="search" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>QR Type Detector</Text>
            <Text style={styles.menuDescription}>
              Identify what type of QR code you have
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => setMode('service-test')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#FF6B35' }]}>
            <MaterialIcons name="storefront" size={32} color="white" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>Test Service QR</Text>
            <Text style={styles.menuDescription}>
              Test service QR scanning functionality
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#666" />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color="#007AFF" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              1. Service centers display QR codes with eligibility criteria{'\n'}
              2. Users scan service QR codes to verify eligibility{'\n'}
              3. Or scan credential QR codes for direct verification{'\n'}
              4. System verifies document genuineness and eligibility{'\n'}
              5. Results show entitlements and verification status
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderGenerateMode = () => (
    <ServiceQRDisplay
      onServiceSelect={(service) => {
        console.log('Service selected:', service.name);
      }}
      showQR={true}
    />
  );

  const renderScanMode = () => {
    console.log('=== RENDER SCAN MODE ===');
    console.log('scannedQRData:', scannedQRData);
    console.log('selectedCredential:', selectedCredential);
    console.log('mode:', mode);
    
    // If we have scanned QR data but no selected credential, show credential selection
    if (scannedQRData && !selectedCredential) {
      return (
        <View style={styles.container}>
          <View style={styles.scanHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode('menu')}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
              <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanContent}>
            <Text style={styles.scanTitle}>Select Credential</Text>
            <Text style={styles.scanSubtitle}>
              Choose a credential to verify for {scannedQRData.serviceType}
            </Text>
            
            <SimpleCredentialSelector
              onCredentialSelect={handleCredentialSelection}
              serviceType={scannedQRData.serviceType}
              selectedCredential={selectedCredential}
            />
          </View>
        </View>
      );
    }

    // If we have both scanned QR data and selected credential, show verification status
    if (scannedQRData && selectedCredential) {
      return (
        <View style={styles.container}>
          <View style={styles.scanHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setMode('menu')}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
              <Text style={styles.backButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.scanContent}>
            <Text style={styles.scanTitle}>Verification in Progress</Text>
            <Text style={styles.scanSubtitle}>
              Verifying {selectedCredential.credential.type} for {scannedQRData.serviceType}
            </Text>
            
            <View style={styles.verificationStatus}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.verificationText}>Processing verification...</Text>
            </View>
          </View>
        </View>
      );
    }

    // Default: show the service QR scanner
    return (
      <ServiceQRScanner
        onQRScanned={handleServiceQRScan}
        onClose={() => setMode('menu')}
        verifierId="mobile-app-verifier"
      />
    );
  };

  const renderResultMode = () => (
    <EligibilityResultDisplay
      result={verificationResult}
      onClose={() => setMode('menu')}
      onNewVerification={handleNewVerification}
    />
  );

  const renderTestMode = () => (
    <View style={styles.container}>
      <View style={styles.scanHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setMode('menu')}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
          <Text style={styles.backButtonText}>Back to Menu</Text>
        </TouchableOpacity>
      </View>
      <MinimalScannerTest />
    </View>
  );

  const renderCredentialVerifyMode = () => (
    <CredentialVerificationScanner
      onVerificationComplete={handleCredentialVerificationComplete}
      onClose={() => setMode('menu')}
      verifierId="mobile-app-verifier"
    />
  );

  const renderCredentialTestMode = () => (
    <CredentialQRTest />
  );

  const renderQRDetectorMode = () => (
    <QRTypeDetector />
  );

  const renderServiceTestMode = () => (
    <ServiceQRTest />
  );

  const renderContent = () => {
    switch (mode) {
      case 'generate':
        return renderGenerateMode();
      case 'scan':
        return renderScanMode();
      case 'result':
        return renderResultMode();
      case 'test':
        return renderTestMode();
      case 'credential-verify':
        return renderCredentialVerifyMode();
      case 'credential-test':
        return renderCredentialTestMode();
      case 'qr-detector':
        return renderQRDetectorMode();
      case 'service-test':
        return renderServiceTestMode();
      default:
        return renderMenu();
    }
  };

  return (
    <View style={styles.container}>
      {renderContent()}
      
      {/* Service Verification Popup */}
      {verificationResult && (
        <ServiceVerificationPopup
          visible={showServiceVerification}
          onClose={() => setShowServiceVerification(false)}
          verificationResult={verificationResult}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  menuContainer: {
    flex: 1,
    padding: 20,
  },
  menuCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  menuDescription: {
    fontSize: 14,
    color: '#666',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  scanContent: {
    flex: 1,
    padding: 20,
  },
  scanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  verificationStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  verificationText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default VerificationScreen; 