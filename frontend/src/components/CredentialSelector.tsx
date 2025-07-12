import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import credentialStorage, { StoredCredential, VerifiableCredential } from '../services/credentialStorage';
import verificationService, { ServiceInfo } from '../services/verificationService';

interface CredentialSelectorProps {
  onCredentialSelect: (credential: VerifiableCredential, service: string) => void;
  mode: 'user' | 'verifier';
}

const CredentialSelector: React.FC<CredentialSelectorProps> = ({ onCredentialSelect, mode }) => {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<StoredCredential | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load credentials
      const storedCredentials = await credentialStorage.getAllCredentials();
      setCredentials(storedCredentials);

      // Load services
      const availableServices = await verificationService.getAvailableServices();
      setServices(availableServices);

      // If no credentials exist, load sample ones
      if (storedCredentials.length === 0) {
        await credentialStorage.loadSampleCredentials();
        const newCredentials = await credentialStorage.getAllCredentials();
        setCredentials(newCredentials);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load credentials and services');
    } finally {
      setLoading(false);
    }
  };

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case 'RationCardVC':
        return 'restaurant';
      case 'HealthCardVC':
        return 'medical';
      case 'EducationCardVC':
        return 'school';
      case 'SkillCertVC':
        return 'briefcase';
      default:
        return 'card';
    }
  };

  const getCredentialColor = (type: string) => {
    switch (type) {
      case 'RationCardVC':
        return '#FF6B6B';
      case 'HealthCardVC':
        return '#4ECDC4';
      case 'EducationCardVC':
        return '#45B7D1';
      case 'SkillCertVC':
        return '#96CEB4';
      default:
        return '#95A5A6';
    }
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

  const handleCredentialSelect = (credential: StoredCredential) => {
    setSelectedCredential(credential);
    
    // Auto-select compatible service
    const compatibleService = services.find(service => 
      service.credentialTypes.includes(credential.credential.type)
    );
    
    if (compatibleService) {
      setSelectedService(compatibleService.id);
    }
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleConfirm = () => {
    if (!selectedCredential || !selectedService) {
      Alert.alert('Selection Required', 'Please select both a credential and a service');
      return;
    }

    onCredentialSelect(selectedCredential.credential, selectedService);
  };

  const isCredentialCompatible = (credential: StoredCredential, service: ServiceInfo) => {
    return service.credentialTypes.includes(credential.credential.type);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading credentials...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>
        {mode === 'user' ? 'Select Credential to Share' : 'Select Service to Verify'}
      </Text>

      {/* Credentials Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Credentials</Text>
        {credentials.length === 0 ? (
          <Text style={styles.emptyText}>No credentials found</Text>
        ) : (
          credentials.map((credential) => (
            <TouchableOpacity
              key={credential.id}
              style={[
                styles.credentialCard,
                selectedCredential?.id === credential.id && styles.selectedCard,
                { borderLeftColor: getCredentialColor(credential.credential.type) }
              ]}
              onPress={() => handleCredentialSelect(credential)}
            >
              <View style={styles.credentialHeader}>
                <View style={[styles.iconContainer, { backgroundColor: getCredentialColor(credential.credential.type) }]}>
                  <Ionicons name={getCredentialIcon(credential.credential.type)} size={24} color="white" />
                </View>
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialName}>
                    {getCredentialDisplayName(credential.credential.type)}
                  </Text>
                  <Text style={styles.credentialIssuer}>
                    Issued by: {credential.credential.issuedBy}
                  </Text>
                  <Text style={styles.credentialStatus}>
                    Status: {credential.credential.status}
                  </Text>
                </View>
                {selectedCredential?.id === credential.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Services Section */}
      {selectedCredential && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Services</Text>
          {services
            .filter(service => isCredentialCompatible(selectedCredential, service))
            .map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  selectedService === service.id && styles.selectedCard
                ]}
                onPress={() => handleServiceSelect(service.id)}
              >
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceName}>{service.name}</Text>
                  <Text style={styles.serviceDescription}>{service.description}</Text>
                </View>
                {selectedService === service.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
        </View>
      )}

      {/* Confirm Button */}
      {selectedCredential && selectedService && (
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>
            {mode === 'user' ? 'Generate QR Code' : 'Start Verification'}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    margin: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    margin: 20,
  },
  credentialCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  credentialIssuer: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  credentialStatus: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  serviceCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default CredentialSelector; 