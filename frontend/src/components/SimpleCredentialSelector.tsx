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

interface SimpleCredentialSelectorProps {
  onCredentialSelect: (credential: StoredCredential) => void;
  serviceType?: string;
  selectedCredential?: any;
}

const SimpleCredentialSelector: React.FC<SimpleCredentialSelectorProps> = ({ 
  onCredentialSelect, 
  serviceType,
  selectedCredential: passedSelectedCredential
}) => {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCredential, setSelectedCredential] = useState<StoredCredential | null>(null);

  useEffect(() => {
    loadCredentials();
  }, []);

  useEffect(() => {
    if (passedSelectedCredential) {
      setSelectedCredential(passedSelectedCredential);
    }
  }, [passedSelectedCredential]);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      
      // Load credentials
      const storedCredentials = await credentialStorage.getAllCredentials();

      // If no credentials exist, load sample ones
      if (storedCredentials.length === 0) {
        await credentialStorage.loadSampleCredentials();
        const newCredentials = await credentialStorage.getAllCredentials();
        setCredentials(newCredentials);
      } else {
        setCredentials(storedCredentials);
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      Alert.alert('Error', 'Failed to load credentials');
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

  const isCredentialCompatible = (credential: StoredCredential) => {
    if (!serviceType) return true;
    
    // Check if credential type is compatible with service type
    const serviceCredentialMap: { [key: string]: string[] } = {
      'pds_verification': ['RationCardVC'],
      'ration_portability': ['RationCardVC'],
      'health_emergency': ['HealthCardVC'],
      'education_scholarship': ['EducationCardVC'],
      'skill_training': ['SkillCertVC']
    };
    
    const compatibleTypes = serviceCredentialMap[serviceType] || [];
    return compatibleTypes.includes(credential.credential.type);
  };

  const handleCredentialSelect = (credential: StoredCredential) => {
    setSelectedCredential(credential);
  };

  const handleConfirm = () => {
    if (!selectedCredential) {
      Alert.alert('Selection Required', 'Please select a credential to proceed');
      return;
    }

    // Pass the full credential object with _id, not just the inner credential
    onCredentialSelect(selectedCredential);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading credentials...</Text>
      </View>
    );
  }

  const compatibleCredentials = credentials.filter(isCredentialCompatible);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Select Credential to Share</Text>
      
      {serviceType && (
        <Text style={styles.subtitle}>
          Service: {getServiceDisplayName(serviceType)}
        </Text>
      )}

      {/* Credentials Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Credentials</Text>
        {compatibleCredentials.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="alert-circle" size={48} color="#95A5A6" />
            <Text style={styles.emptyText}>No compatible credentials found</Text>
            <Text style={styles.emptySubtext}>
              You need a {getCredentialDisplayName(getRequiredCredentialType(serviceType))} for this service
            </Text>
          </View>
        ) : (
          compatibleCredentials.map((credential) => (
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
                  {credential.credential.credentialSubject?.beneficiary_name && (
                    <Text style={styles.credentialHolder}>
                      Holder: {credential.credential.credentialSubject.beneficiary_name}
                    </Text>
                  )}
                </View>
                {selectedCredential?.id === credential.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Confirm Button */}
      {selectedCredential && (
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
          <Text style={styles.confirmButtonText}>Start Verification</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

const getServiceDisplayName = (serviceId: string) => {
  switch (serviceId) {
    case 'pds_verification':
      return 'PDS Verification';
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

const getRequiredCredentialType = (serviceType?: string) => {
  switch (serviceType) {
    case 'pds_verification':
    case 'ration_portability':
      return 'RationCardVC';
    case 'health_emergency':
      return 'HealthCardVC';
    case 'education_scholarship':
      return 'EducationCardVC';
    case 'skill_training':
      return 'SkillCertVC';
    default:
      return 'Unknown';
  }
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
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
    marginTop: 8,
    textAlign: 'center',
  },
  credentialCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginRight: 16,
  },
  credentialInfo: {
    flex: 1,
  },
  credentialName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  credentialIssuer: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  credentialStatus: {
    fontSize: 14,
    color: '#27AE60',
    marginBottom: 2,
  },
  credentialHolder: {
    fontSize: 14,
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default SimpleCredentialSelector; 