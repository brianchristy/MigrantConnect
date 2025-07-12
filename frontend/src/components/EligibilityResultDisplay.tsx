import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { VerificationResponse, DocumentVerification, PDSEntitlement } from '../services/verificationService';

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

  const getEligibilityStatusIcon = () => {
    return isEligible ? 'checkmark-circle' : 'close-circle';
  };

  const getEligibilityStatusColor = () => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      default:
        return '#757575';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return 'checkmark-circle';
      case 'pending':
        return 'time-outline';
      case 'rejected':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const renderDocumentVerification = () => {
    if (!result.documentVerification) return null;

    const docVer = result.documentVerification;

    return (
      <View style={styles.verificationCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="verified-user" size={24} color={getStatusColor(docVer.verificationStatus)} />
          <Text style={styles.cardTitle}>Document Verification</Text>
        </View>
        
        <View style={styles.statusRow}>
          <Ionicons
            name={getStatusIcon(docVer.verificationStatus)}
            size={20}
            color={getStatusColor(docVer.verificationStatus)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(docVer.verificationStatus) }]}>
            {docVer.verificationStatus.toUpperCase()}
          </Text>
        </View>

        {docVer.issues.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.sectionTitle}>Issues Found:</Text>
            {docVer.issues.map((issue, index) => (
              <View key={index} style={styles.issueItem}>
                <MaterialIcons name="error" size={16} color="#F44336" />
                <Text style={styles.issueText}>{issue}</Text>
              </View>
            ))}
          </View>
        )}

        {docVer.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Recommendations:</Text>
            {docVer.recommendations.map((rec, index) => (
              <View key={index} style={styles.recommendationItem}>
                <MaterialIcons name="lightbulb" size={16} color="#2196F3" />
                <Text style={styles.recommendationText}>{rec}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderPDSEntitlement = () => {
    if (!result.entitlement || typeof result.entitlement === 'string') {
      return (
        <View style={styles.entitlementCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="gift" size={24} color="#FF9800" />
            <Text style={styles.cardTitle}>Entitlement</Text>
          </View>
          <Text style={styles.entitlementText}>
            {result.entitlement || 'No entitlement information available'}
          </Text>
        </View>
      );
    }

    const entitlement = result.entitlement as PDSEntitlement;

    return (
      <View style={styles.entitlementCard}>
        <View style={styles.cardHeader}>
          <Ionicons name="gift" size={24} color="#FF9800" />
          <Text style={styles.cardTitle}>PDS Monthly Entitlements</Text>
        </View>
        
        <View style={styles.entitlementHeader}>
          <View style={[styles.chip, { borderColor: entitlement.portabilityStatus === 'enabled' ? '#4CAF50' : '#F44336' }]}>
            <Text style={[styles.chipText, { color: entitlement.portabilityStatus === 'enabled' ? '#4CAF50' : '#F44336' }]}>
              {entitlement.portabilityStatus === 'enabled' ? 'Portable' : 'Non-Portable'}
            </Text>
          </View>
          <Text style={styles.totalValue}>
            Total Value: ₹{entitlement.totalMonthlyValue}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Monthly Entitlements:</Text>
        {Object.entries(entitlement.monthlyEntitlements).map(([item, details]) => (
          <View key={item} style={styles.entitlementItem}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
              <Text style={styles.itemQuantity}>
                {details.quantity} {details.unit}
              </Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemPrice}>₹{details.price}/{details.unit}</Text>
              <Text style={styles.itemTotal}>Total: ₹{details.totalPrice}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.locationInfo}>
          <Text style={styles.sectionTitle}>Location Information:</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="home" size={16} color="#666" />
            <Text style={styles.locationText}>Home State: {entitlement.homeState}</Text>
          </View>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={16} color="#666" />
            <Text style={styles.locationText}>Current State: {entitlement.currentState}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderWarnings = () => {
    if (!result.warnings || result.warnings.length === 0) return null;

    return (
      <View style={styles.warningCard}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="warning" size={24} color="#FF9800" />
          <Text style={styles.cardTitle}>Warnings</Text>
        </View>
        {result.warnings.map((warning, index) => (
          <View key={index} style={styles.warningItem}>
            <MaterialIcons name="info" size={16} color="#FF9800" />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ))}
      </View>
    );
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

        {/* Document Verification */}
        {renderDocumentVerification()}

        {/* Entitlement Card */}
        {isEligible && result.entitlement && renderPDSEntitlement()}

        {/* Warnings */}
        {renderWarnings()}

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
  // New styles for document verification and PDS entitlements
  verificationCard: {
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  issuesContainer: {
    marginTop: 12,
  },
  recommendationsContainer: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  issueText: {
    marginLeft: 8,
    color: '#F44336',
    flex: 1,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationText: {
    marginLeft: 8,
    color: '#2196F3',
    flex: 1,
  },
  entitlementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  entitlementItem: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  locationInfo: {
    marginTop: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    marginLeft: 8,
    color: '#666',
  },
  warningCard: {
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
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningText: {
    marginLeft: 8,
    color: '#FF9800',
    flex: 1,
  },
});

export default EligibilityResultDisplay; 