import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VerificationResponse } from '../services/verificationService';

interface EligibilityResultDisplayProps {
  result: VerificationResponse;
  onClose: () => void;
  onNewVerification: () => void;
}

const EligibilityResultDisplay: React.FC<EligibilityResultDisplayProps> = ({
  result,
  onClose,
  onNewVerification
}) => {
  const isEligible = result.eligible;

  const getStatusIcon = () => {
    return isEligible ? 'checkmark-circle' : 'close-circle';
  };

  const getStatusColor = () => {
    return isEligible ? '#4CAF50' : '#F44336';
  };

  const getStatusText = () => {
    return isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE';
  };

  const getStatusDescription = () => {
    return isEligible 
      ? 'This person is eligible for the requested service'
      : 'This person is not eligible for the requested service';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Result</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon()} 
              size={48} 
              color={getStatusColor()} 
            />
            <View style={styles.statusTextContainer}>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
              <Text style={styles.statusDescription}>
                {getStatusDescription()}
              </Text>
            </View>
          </View>
        </View>

        {/* Entitlement Card */}
        {isEligible && result.entitlement && (
          <View style={styles.entitlementCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="gift" size={24} color="#FF9800" />
              <Text style={styles.cardTitle}>Entitlement</Text>
            </View>
            <Text style={styles.entitlementText}>{result.entitlement}</Text>
          </View>
        )}

        {/* Reason Card */}
        <View style={styles.reasonCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle" size={24} color="#2196F3" />
            <Text style={styles.cardTitle}>Reason</Text>
          </View>
          <Text style={styles.reasonText}>{result.reason}</Text>
        </View>

        {/* Verification Details */}
        <View style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="time" size={24} color="#9C27B0" />
            <Text style={styles.cardTitle}>Verification Details</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Timestamp:</Text>
            <Text style={styles.detailValue}>
              {formatTimestamp(result.timestamp)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
              {result.success ? 'Success' : 'Failed'}
            </Text>
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
            <Text style={styles.cardTitle}>Security Notice</Text>
          </View>
          <Text style={styles.securityText}>
            This verification was conducted using secure Verifiable Credentials. 
            The result is cryptographically signed and tamper-proof.
          </Text>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.newVerificationButton} onPress={onNewVerification}>
          <Ionicons name="refresh" size={20} color="white" />
          <Text style={styles.newVerificationButtonText}>New Verification</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.closeResultButton} onPress={onClose}>
          <Text style={styles.closeResultButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  closeButton: {
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
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 16,
    color: '#666',
  },
  entitlementCard: {
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
  reasonCard: {
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
  detailsCard: {
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
  securityCard: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginLeft: 8,
  },
  entitlementText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9800',
  },
  reasonText: {
    fontSize: 16,
    color: '#2C3E50',
    lineHeight: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '600',
  },
  securityText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    gap: 12,
  },
  newVerificationButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newVerificationButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  closeResultButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeResultButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EligibilityResultDisplay; 