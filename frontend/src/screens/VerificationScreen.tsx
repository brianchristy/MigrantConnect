import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiableCredential } from '../services/credentialStorage';
import { VerificationResponse } from '../services/verificationService';
import CredentialSelector from '../components/CredentialSelector';
import QRCodeGenerator from '../components/QRCodeGenerator';
import QRScannerVerifier from '../components/QRScannerVerifier';
import EligibilityResultDisplay from '../components/EligibilityResultDisplay';
import ConsentModal from '../components/ConsentModal';
import QRVerificationTest from '../components/QRVerificationTest';
import APITest from '../components/APITest';

type VerificationMode = 'user' | 'verifier' | 'test' | 'api-test';
type ScreenState = 'selector' | 'qr-generator' | 'qr-scanner' | 'result' | 'test' | 'api-test';

interface VerificationScreenProps {
  navigation: any;
  route: any;
}

const VerificationScreen: React.FC<VerificationScreenProps> = ({ navigation, route }) => {
  const [mode, setMode] = useState<VerificationMode>('user');
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('selector');
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [consentData, setConsentData] = useState<any>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);

  const handleCredentialSelect = (credential: VerifiableCredential, service: string) => {
    setSelectedCredential(credential);
    setSelectedService(service);
    
    if (mode === 'user') {
      setCurrentScreen('qr-generator');
    } else {
      setCurrentScreen('qr-scanner');
    }
  };

  const handleConsentRequired = (data: any) => {
    setConsentData(data);
    setShowConsentModal(true);
  };

  const handleConsent = () => {
    setShowConsentModal(false);
    // In a real app, you would proceed with the verification here
    // For now, we'll just show a success message
    Alert.alert('Success', 'Credential shared successfully!');
  };

  const handleDenyConsent = () => {
    setShowConsentModal(false);
    // Reset to selector screen
    setCurrentScreen('selector');
  };

  const handleVerificationComplete = (result: VerificationResponse) => {
    setVerificationResult(result);
    setCurrentScreen('result');
  };

  const handleNewVerification = () => {
    setCurrentScreen('selector');
    setSelectedCredential(null);
    setSelectedService('');
    setVerificationResult(null);
  };

  const handleClose = () => {
    if (currentScreen === 'selector') {
      navigation.goBack();
    } else {
      setCurrentScreen('selector');
      setSelectedCredential(null);
      setSelectedService('');
      setVerificationResult(null);
    }
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'selector':
        return (
          <View style={styles.container}>
            {/* Mode Selector */}
            <View style={styles.modeSelector}>
              <TouchableOpacity
                style={[styles.modeButton, mode === 'user' && styles.activeModeButton]}
                onPress={() => setMode('user')}
              >
                <Ionicons 
                  name="person" 
                  size={24} 
                  color={mode === 'user' ? 'white' : '#007AFF'} 
                />
                <Text style={[styles.modeText, mode === 'user' && styles.activeModeText]}>
                  Share Credential
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modeButton, mode === 'verifier' && styles.activeModeButton]}
                onPress={() => setMode('verifier')}
              >
                <Ionicons 
                  name="scan" 
                  size={24} 
                  color={mode === 'verifier' ? 'white' : '#007AFF'} 
                />
                <Text style={[styles.modeText, mode === 'verifier' && styles.activeModeText]}>
                  Verify Credential
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, mode === 'test' && styles.activeModeButton]}
                onPress={() => setMode('test')}
              >
                <Ionicons 
                  name="flask" 
                  size={24} 
                  color={mode === 'test' ? 'white' : '#007AFF'} 
                />
                <Text style={[styles.modeText, mode === 'test' && styles.activeModeText]}>
                  Test QR System
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeButton, mode === 'api-test' && styles.activeModeButton]}
                onPress={() => setMode('api-test')}
              >
                <Ionicons 
                  name="bug" 
                  size={24} 
                  color={mode === 'api-test' ? 'white' : '#007AFF'} 
                />
                <Text style={[styles.modeText, mode === 'api-test' && styles.activeModeText]}>
                  API Test
                </Text>
              </TouchableOpacity>
            </View>

            {mode === 'test' ? (
              <QRVerificationTest onClose={handleClose} />
            ) : mode === 'api-test' ? (
              <APITest />
            ) : (
              <CredentialSelector
                onCredentialSelect={handleCredentialSelect}
                mode={mode as 'user' | 'verifier'}
              />
            )}
          </View>
        );

      case 'qr-generator':
        return selectedCredential ? (
          <QRCodeGenerator
            credential={selectedCredential}
            service={selectedService}
            onClose={handleClose}
            onConsentRequired={handleConsentRequired}
          />
        ) : null;

      case 'qr-scanner':
        return (
          <QRScannerVerifier
            service={selectedService}
            onClose={handleClose}
            onVerificationComplete={handleVerificationComplete}
          />
        );

      case 'result':
        return verificationResult ? (
          <EligibilityResultDisplay
            result={verificationResult}
            onClose={handleClose}
            onNewVerification={handleNewVerification}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === 'user' ? 'Share Credential' : 
           mode === 'verifier' ? 'Verify Credential' : 
           mode === 'test' ? 'Test QR System' : 
           mode === 'api-test' ? 'API Test' : 'Verification'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Content */}
      {renderCurrentScreen()}

      {/* Consent Modal */}
      {consentData && (
        <ConsentModal
          visible={showConsentModal}
          credential={consentData.credential}
          service={consentData.service}
          verifierInfo="Government Service Provider"
          onConsent={handleConsent}
          onDeny={handleDenyConsent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  placeholder: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  modeSelector: {
    flexDirection: 'column',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  activeModeButton: {
    backgroundColor: '#007AFF',
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  activeModeText: {
    color: 'white',
  },
});

export default VerificationScreen; 