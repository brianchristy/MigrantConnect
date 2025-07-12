import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCodeGenerator from './QRCodeGenerator';
import QRScannerVerifier from './QRScannerVerifier';
import EligibilityResultDisplay from './EligibilityResultDisplay';
import ConsentModal from './ConsentModal';
import credentialStorage, { VerifiableCredential } from '../services/credentialStorage';
import verificationService, { VerificationResponse } from '../services/verificationService';

interface QRVerificationTestProps {
  onClose: () => void;
}

const QRVerificationTest: React.FC<QRVerificationTestProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'menu' | 'generate' | 'scan' | 'result'>('menu');
  const [credentials, setCredentials] = useState<VerifiableCredential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<VerifiableCredential | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentData, setConsentData] = useState<any>(null);

  const services = [
    { id: 'ration_portability', name: 'Ration Portability', description: 'ONORC scheme verification' },
    { id: 'health_emergency', name: 'Health Emergency', description: 'Emergency health services' },
    { id: 'education_scholarship', name: 'Education Scholarship', description: 'Educational scholarships' },
    { id: 'skill_training', name: 'Skill Training', description: 'Skill development programs' }
  ];

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      console.log('Loading credentials...');
      
      const storedCredentials = await credentialStorage.getAllCredentials();
      console.log('Stored credentials count:', storedCredentials.length);
      
      if (storedCredentials.length === 0) {
        console.log('No credentials found, loading sample credentials...');
        // Load sample credentials if none exist
        await credentialStorage.loadSampleCredentials();
        const sampleCredentials = await credentialStorage.getAllCredentials();
        console.log('Sample credentials loaded:', sampleCredentials.length);
        setCredentials(sampleCredentials.map(sc => sc.credential));
      } else {
        console.log('Using existing credentials:', storedCredentials.length);
        setCredentials(storedCredentials.map(sc => sc.credential));
      }
    } catch (error: any) {
      console.error('Error loading credentials:', error);
      Alert.alert('Error', `Failed to load credentials: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = (credential: VerifiableCredential, service: string) => {
    setSelectedCredential(credential);
    setSelectedService(service);
    setMode('generate');
  };

  const handleScanQR = (service: string) => {
    setSelectedService(service);
    setMode('scan');
  };

  const handleConsentRequired = (data: any) => {
    setConsentData(data);
    setShowConsentModal(true);
  };

  const handleConsentResult = async (consentGiven: boolean) => {
    setShowConsentModal(false);
    
    if (!consentGiven) {
      Alert.alert('Consent Denied', 'Verification cancelled by user');
      return;
    }

    // In a real scenario, this would trigger the actual verification
    Alert.alert('Consent Given', 'Verification would proceed with user consent');
  };

  const handleVerificationComplete = (result: VerificationResponse) => {
    setVerificationResult(result);
    setMode('result');
  };

  const resetTest = () => {
    setMode('menu');
    setSelectedCredential(null);
    setSelectedService('');
    setVerificationResult(null);
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
    const service = services.find(s => s.id === serviceId);
    return service ? service.name : serviceId;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading credentials...</Text>
      </View>
    );
  }

  if (mode === 'generate' && selectedCredential && selectedService) {
    return (
      <QRCodeGenerator
        credential={selectedCredential}
        service={selectedService}
        onClose={() => setMode('menu')}
        onConsentRequired={handleConsentRequired}
      />
    );
  }

  if (mode === 'scan' && selectedService) {
    return (
      <QRScannerVerifier
        service={selectedService}
        onClose={() => setMode('menu')}
        onVerificationComplete={handleVerificationComplete}
      />
    );
  }

  if (mode === 'result' && verificationResult) {
    return (
      <EligibilityResultDisplay
        result={verificationResult}
        onClose={resetTest}
        onNewVerification={resetTest}
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.title}>QR Verification Test</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Available Credentials */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Credentials</Text>
          {credentials.map((credential, index) => (
            <View key={index} style={styles.credentialCard}>
              <View style={styles.credentialHeader}>
                <Ionicons name="card" size={20} color="#2196F3" />
                <Text style={styles.credentialType}>
                  {getCredentialDisplayName(credential.type)}
                </Text>
                <View style={[styles.statusBadge, 
                  credential.status === 'active' ? styles.activeBadge : styles.inactiveBadge]}>
                  <Text style={styles.statusText}>{credential.status}</Text>
                </View>
              </View>
              <Text style={styles.credentialDetails}>
                Issued by: {credential.issuedBy}
              </Text>
              <Text style={styles.credentialDetails}>
                Expires: {new Date(credential.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </View>

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          {services.map((service) => (
            <View key={service.id} style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              
              <View style={styles.serviceActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleGenerateQR(credentials[0], service.id)}
                >
                  <Ionicons name="qr-code" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Generate QR</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.scanButton]}
                  onPress={() => handleScanQR(service.id)}
                >
                  <Ionicons name="scan" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Scan QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Test Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Test Instructions</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionText}>
              1. <Text style={styles.bold}>Generate QR:</Text> Create a QR code with a credential for a specific service
            </Text>
            <Text style={styles.instructionText}>
              2. <Text style={styles.bold}>Scan QR:</Text> Use another device or simulator to scan the generated QR code
            </Text>
            <Text style={styles.instructionText}>
              3. <Text style={styles.bold}>Verify:</Text> The system will check eligibility based on backend rules
            </Text>
            <Text style={styles.instructionText}>
              4. <Text style={styles.bold}>Consent:</Text> User consent is required before verification proceeds
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Consent Modal */}
      {showConsentModal && consentData && (
        <ConsentModal
          visible={showConsentModal}
          credential={consentData.credential}
          service={consentData.service}
          verifierInfo="Test Verifier"
          onConsent={() => handleConsentResult(true)}
          onDeny={() => handleConsentResult(false)}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  credentialCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  credentialType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
  },
  credentialDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    marginBottom: 12,
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
  serviceActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  instructionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
});

export default QRVerificationTest; 