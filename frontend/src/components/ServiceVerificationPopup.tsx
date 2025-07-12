import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface ServiceDetails {
  name: string;
  description: string;
  icon: string;
  benefits: string[];
}

interface PDSEntitlement {
  cardType: string;
  familySize: number;
  monthlyEntitlements: {
    [key: string]: {
      quantity: number;
      unit: string;
      price: number;
      totalPrice: number;
    };
  };
  totalMonthlyValue: number;
  portabilityStatus: string;
  homeState: string;
  currentState: string;
}

interface ServiceVerificationPopupProps {
  visible: boolean;
  onClose: () => void;
  verificationResult: {
    eligible: boolean;
    reason: string;
    entitlement?: string | PDSEntitlement;
    serviceDetails?: ServiceDetails;
    documentVerification?: {
      isGenuine: boolean;
      verificationStatus: string;
      issues: string[];
      recommendations: string[];
    };
    warnings?: string[];
  };
}

const ServiceVerificationPopup: React.FC<ServiceVerificationPopupProps> = ({
  visible,
  onClose,
  verificationResult
}) => {
  const { eligible, reason, entitlement, serviceDetails, documentVerification, warnings } = verificationResult;

  const renderPDSEntitlement = (pdsEntitlement: PDSEntitlement) => (
    <View style={styles.entitlementContainer}>
      <View style={styles.entitlementHeader}>
        <Text style={styles.entitlementTitle}>Monthly Entitlements</Text>
        <Text style={styles.entitlementSubtitle}>
          {pdsEntitlement.cardType} • Family Size: {pdsEntitlement.familySize}
        </Text>
      </View>

      <View style={styles.entitlementsList}>
        {Object.entries(pdsEntitlement.monthlyEntitlements).map(([item, details]) => (
          <View key={item} style={styles.entitlementItem}>
            <View style={styles.entitlementItemHeader}>
              <Text style={styles.entitlementItemName}>{item}</Text>
              <Text style={styles.entitlementItemQuantity}>
                {details.quantity} {details.unit}
              </Text>
            </View>
            <View style={styles.entitlementItemDetails}>
              <Text style={styles.entitlementItemPrice}>
                ₹{details.price}/{details.unit}
              </Text>
              <Text style={styles.entitlementItemTotal}>
                Total: ₹{details.totalPrice}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.entitlementSummary}>
        <Text style={styles.entitlementTotalValue}>
          Total Monthly Value: ₹{pdsEntitlement.totalMonthlyValue}
        </Text>
        <Text style={styles.entitlementPortability}>
          Portability: {pdsEntitlement.portabilityStatus}
        </Text>
        <Text style={styles.entitlementLocation}>
          {pdsEntitlement.homeState} → {pdsEntitlement.currentState}
        </Text>
      </View>
    </View>
  );

  const renderSimpleEntitlement = (entitlement: string) => (
    <View style={styles.simpleEntitlement}>
      <MaterialIcons name="card-giftcard" size={24} color="#27AE60" />
      <Text style={styles.simpleEntitlementText}>{entitlement}</Text>
    </View>
  );

  const renderDocumentVerification = () => {
    if (!documentVerification) return null;

    return (
      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Document Verification</Text>
        <View style={styles.documentStatus}>
          <Ionicons
            name={documentVerification.isGenuine ? "checkmark-circle" : "close-circle"}
            size={24}
            color={documentVerification.isGenuine ? "#27AE60" : "#E74C3C"}
          />
          <Text style={[
            styles.documentStatusText,
            { color: documentVerification.isGenuine ? "#27AE60" : "#E74C3C" }
          ]}>
            {documentVerification.verificationStatus.toUpperCase()}
          </Text>
        </View>
        
        {documentVerification.issues.length > 0 && (
          <View style={styles.issuesContainer}>
            <Text style={styles.issuesTitle}>Issues Found:</Text>
            {documentVerification.issues.map((issue, index) => (
              <Text key={index} style={styles.issueText}>• {issue}</Text>
            ))}
          </View>
        )}

        {documentVerification.recommendations.length > 0 && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.recommendationsTitle}>Recommendations:</Text>
            {documentVerification.recommendations.map((rec, index) => (
              <Text key={index} style={styles.recommendationText}>• {rec}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWarnings = () => {
    if (!warnings || warnings.length === 0) return null;

    return (
      <View style={styles.warningsSection}>
        <Text style={styles.sectionTitle}>Warnings</Text>
        {warnings.map((warning, index) => (
          <View key={index} style={styles.warningItem}>
            <Ionicons name="warning" size={16} color="#F39C12" />
            <Text style={styles.warningText}>{warning}</Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.headerIcon}>
                {serviceDetails?.icon || '✅'}
              </Text>
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>
                  {serviceDetails?.name || 'Service Verification'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {serviceDetails?.description || 'Verification completed'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Eligibility Status */}
            <View style={styles.statusSection}>
              <View style={styles.statusIndicator}>
                <Ionicons
                  name={eligible ? "checkmark-circle" : "close-circle"}
                  size={48}
                  color={eligible ? "#27AE60" : "#E74C3C"}
                />
                <Text style={[
                  styles.statusText,
                  { color: eligible ? "#27AE60" : "#E74C3C" }
                ]}>
                  {eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                </Text>
              </View>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>

            {/* Entitlements */}
            {eligible && entitlement && (
              <View style={styles.entitlementSection}>
                <Text style={styles.sectionTitle}>Your Entitlements</Text>
                {typeof entitlement === 'string' 
                  ? renderSimpleEntitlement(entitlement)
                  : renderPDSEntitlement(entitlement)
                }
              </View>
            )}

            {/* Service Benefits */}
            {eligible && serviceDetails?.benefits && (
              <View style={styles.benefitsSection}>
                <Text style={styles.sectionTitle}>Service Benefits</Text>
                {serviceDetails.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Ionicons name="checkmark" size={16} color="#27AE60" />
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Document Verification */}
            {renderDocumentVerification()}

            {/* Warnings */}
            {renderWarnings()}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.closeModalButton} onPress={onClose}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: height * 0.95,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusIndicator: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  reasonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  entitlementSection: {
    marginBottom: 24,
  },
  simpleEntitlement: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  simpleEntitlementText: {
    fontSize: 16,
    color: '#27AE60',
    fontWeight: '600',
    marginLeft: 12,
  },
  entitlementContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  entitlementHeader: {
    marginBottom: 16,
  },
  entitlementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  entitlementSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  entitlementsList: {
    marginBottom: 16,
  },
  entitlementItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  entitlementItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entitlementItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  entitlementItemQuantity: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  entitlementItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  entitlementItemPrice: {
    fontSize: 14,
    color: '#666',
  },
  entitlementItemTotal: {
    fontSize: 14,
    color: '#27AE60',
    fontWeight: '600',
  },
  entitlementSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  entitlementTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 4,
  },
  entitlementPortability: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  entitlementLocation: {
    fontSize: 14,
    color: '#666',
  },
  benefitsSection: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  documentSection: {
    marginBottom: 24,
  },
  documentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  documentStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  issuesContainer: {
    marginBottom: 12,
  },
  issuesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 14,
    color: '#E74C3C',
    marginLeft: 8,
    marginBottom: 2,
  },
  recommendationsContainer: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F39C12',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 14,
    color: '#F39C12',
    marginLeft: 8,
    marginBottom: 2,
  },
  warningsSection: {
    marginBottom: 24,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#F39C12',
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceVerificationPopup; 