import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerifiableCredential } from '../services/credentialStorage';

interface ConsentModalProps {
  visible: boolean;
  credential: VerifiableCredential;
  service: string;
  verifierInfo?: string;
  onConsent: () => void;
  onDeny: () => void;
}

const ConsentModal: React.FC<ConsentModalProps> = ({
  visible,
  credential,
  service,
  verifierInfo,
  onConsent,
  onDeny
}) => {
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

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onDeny}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconContainer, { backgroundColor: getCredentialColor(credential.type) }]}>
              <Ionicons name={getCredentialIcon(credential.type)} size={32} color="white" />
            </View>
            <Text style={styles.headerTitle}>Consent Required</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Credential Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Credential to Share</Text>
              <View style={styles.credentialInfo}>
                <Text style={styles.credentialName}>
                  {getCredentialDisplayName(credential.type)}
                </Text>
                <Text style={styles.credentialIssuer}>
                  Issued by: {credential.issuedBy}
                </Text>
                <Text style={styles.credentialStatus}>
                  Status: {credential.status}
                </Text>
              </View>
            </View>

            {/* Service Info */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Service Requested</Text>
              <Text style={styles.serviceName}>
                {getServiceDisplayName(service)}
              </Text>
              <Text style={styles.serviceDescription}>
                This service will verify your eligibility for the requested benefit.
              </Text>
            </View>

            {/* Verifier Info */}
            {verifierInfo && (
              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Verifier Information</Text>
                <Text style={styles.verifierInfo}>{verifierInfo}</Text>
              </View>
            )}

            {/* Privacy Notice */}
            <View style={styles.privacyCard}>
              <View style={styles.privacyHeader}>
                <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
                <Text style={styles.privacyTitle}>Privacy & Security</Text>
              </View>
              <Text style={styles.privacyText}>
                • Only necessary information will be shared{'\n'}
                • Your data is encrypted and secure{'\n'}
                • This verification will be logged for audit purposes{'\n'}
                • You can revoke access at any time
              </Text>
            </View>

            {/* What Will Be Shared */}
            <View style={styles.shareCard}>
              <Text style={styles.shareTitle}>Information to be Shared:</Text>
              <View style={styles.shareItem}>
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
                <Text style={styles.shareText}>Credential type and validity</Text>
              </View>
              <View style={styles.shareItem}>
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
                <Text style={styles.shareText}>Eligibility status</Text>
              </View>
              <View style={styles.shareItem}>
                <Ionicons name="checkmark" size={16} color="#4CAF50" />
                <Text style={styles.shareText}>Verification timestamp</Text>
              </View>
              <View style={styles.shareItem}>
                <Ionicons name="close" size={16} color="#F44336" />
                <Text style={styles.shareText}>Personal identification details</Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.denyButton} onPress={onDeny}>
              <Ionicons name="close" size={20} color="#F44336" />
              <Text style={styles.denyButtonText}>Deny</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.consentButton} onPress={onConsent}>
              <Ionicons name="checkmark" size={20} color="white" />
              <Text style={styles.consentButtonText}>Consent & Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxHeight: '90%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  credentialInfo: {
    marginTop: 8,
  },
  credentialName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  credentialIssuer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  credentialStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
  },
  verifierInfo: {
    fontSize: 14,
    color: '#666',
  },
  privacyCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  privacyText: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  shareCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  shareTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  shareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  shareText: {
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  denyButton: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  denyButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  consentButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  consentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ConsentModal; 