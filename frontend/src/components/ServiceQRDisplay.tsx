import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

interface ServiceCriteria {
  cardTypes?: string[];
  requiresDocumentVerification?: boolean;
  maxFamilySize?: number;
  portabilityEnabled?: boolean;
  requiresHealthCard?: boolean;
  maxCoverageAmount?: number;
  emergencyOnly?: boolean;
  requiresEducationCard?: boolean;
  maxScholarshipAmount?: number;
  academicYear?: string;
  requiresSkillCert?: boolean;
  maxTrainingDuration?: number;
  ageLimit?: number[];
}

interface ServiceQR {
  serviceType: string;
  verifierId: string;
  criteria: ServiceCriteria;
  nonce: number;
  timestamp: string;
}

interface Service {
  name: string;
  serviceType: string;
  verifierId: string;
  description: string;
  criteria: ServiceCriteria;
  icon: string;
  color: string;
}

const services: Service[] = [
  {
    name: 'PDS Verification',
    serviceType: 'pds_verification',
    verifierId: 'pds-shop-001',
    description: 'Public Distribution System - Ration Card Verification',
    criteria: {
      cardTypes: ['APL', 'BPL', 'AAY'],
      requiresDocumentVerification: true,
      maxFamilySize: 10,
      portabilityEnabled: true
    },
    icon: 'restaurant',
    color: '#FF6B35'
  },
  {
    name: 'Healthcare Emergency',
    serviceType: 'health_emergency',
    verifierId: 'hospital-emergency-001',
    description: 'Emergency Healthcare Access',
    criteria: {
      requiresHealthCard: true,
      maxCoverageAmount: 50000,
      emergencyOnly: true
    },
    icon: 'medical',
    color: '#4ECDC4'
  },
  {
    name: 'Education Scholarship',
    serviceType: 'education_scholarship',
    verifierId: 'education-dept-001',
    description: 'Educational Scholarship Verification',
    criteria: {
      requiresEducationCard: true,
      maxScholarshipAmount: 10000,
      academicYear: '2024-25'
    },
    icon: 'school',
    color: '#45B7D1'
  },
  {
    name: 'Skill Training',
    serviceType: 'skill_training',
    verifierId: 'skill-center-001',
    description: 'Skill Development Training Access',
    criteria: {
      requiresSkillCert: true,
      maxTrainingDuration: 6,
      ageLimit: [18, 45]
    },
    icon: 'build',
    color: '#96CEB4'
  }
];

interface ServiceQRDisplayProps {
  onServiceSelect?: (service: Service) => void;
  showQR?: boolean;
}

const ServiceQRDisplay: React.FC<ServiceQRDisplayProps> = ({
  onServiceSelect,
  showQR = true
}) => {
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [qrData, setQrData] = useState<string>('');

  const generateQRForService = (service: Service) => {
    const qrPayload: ServiceQR = {
      serviceType: service.serviceType,
      verifierId: service.verifierId,
      criteria: service.criteria,
      nonce: Date.now(),
      timestamp: new Date().toISOString()
    };

    const qrString = JSON.stringify(qrPayload);
    setQrData(qrString);
    setSelectedService(service);
  };

  const shareQR = async () => {
    if (!selectedService) return;

    try {
      const qrPayload: ServiceQR = {
        serviceType: selectedService.serviceType,
        verifierId: selectedService.verifierId,
        criteria: selectedService.criteria,
        nonce: Date.now(),
        timestamp: new Date().toISOString()
      };

      await Share.share({
        message: `Service QR for ${selectedService.name}\n\nQR Data: ${JSON.stringify(qrPayload, null, 2)}`,
        title: `${selectedService.name} QR Code`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  const renderCriteria = (criteria: ServiceCriteria) => {
    const criteriaItems = [];

    if (criteria.cardTypes) {
      criteriaItems.push(`Card Types: ${criteria.cardTypes.join(', ')}`);
    }
    if (criteria.requiresDocumentVerification !== undefined) {
      criteriaItems.push(`Document Verification: ${criteria.requiresDocumentVerification ? 'Required' : 'Not Required'}`);
    }
    if (criteria.maxFamilySize) {
      criteriaItems.push(`Max Family Size: ${criteria.maxFamilySize}`);
    }
    if (criteria.portabilityEnabled !== undefined) {
      criteriaItems.push(`Portability: ${criteria.portabilityEnabled ? 'Enabled' : 'Disabled'}`);
    }
    if (criteria.maxCoverageAmount) {
      criteriaItems.push(`Max Coverage: ₹${criteria.maxCoverageAmount.toLocaleString()}`);
    }
    if (criteria.maxScholarshipAmount) {
      criteriaItems.push(`Max Scholarship: ₹${criteria.maxScholarshipAmount.toLocaleString()}`);
    }
    if (criteria.academicYear) {
      criteriaItems.push(`Academic Year: ${criteria.academicYear}`);
    }
    if (criteria.maxTrainingDuration) {
      criteriaItems.push(`Max Training Duration: ${criteria.maxTrainingDuration} months`);
    }
    if (criteria.ageLimit) {
      criteriaItems.push(`Age Limit: ${criteria.ageLimit[0]}-${criteria.ageLimit[1]} years`);
    }

    return criteriaItems.map((item, index) => (
      <View key={index} style={styles.criteriaItem}>
        <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
        <Text style={styles.criteriaText}>{item}</Text>
      </View>
    ));
  };

  const renderServiceCard = (service: Service) => (
    <TouchableOpacity
      key={service.serviceType}
      style={[styles.serviceCard, { borderLeftColor: service.color }]}
      onPress={() => {
        generateQRForService(service);
        onServiceSelect?.(service);
      }}
    >
      <View style={styles.serviceHeader}>
        <View style={[styles.serviceIcon, { backgroundColor: service.color }]}>
          <MaterialIcons name={service.icon as any} size={24} color="white" />
        </View>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceDescription}>{service.description}</Text>
          <Text style={styles.verifierId}>Verifier: {service.verifierId}</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Service QR Codes</Text>
        <Text style={styles.headerSubtitle}>
          Select a service to generate QR code for eligibility verification
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedService ? (
          <View>
            <Text style={styles.sectionTitle}>Available Services</Text>
            {services.map(renderServiceCard)}
          </View>
        ) : (
          <View style={styles.qrContainer}>
            <View style={styles.qrHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedService(null)}
              >
                <Ionicons name="arrow-back" size={24} color="#007AFF" />
                <Text style={styles.backButtonText}>Back to Services</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.serviceDetails}>
              <View style={[styles.serviceIcon, { backgroundColor: selectedService.color }]}>
                <MaterialIcons name={selectedService.icon as any} size={32} color="white" />
              </View>
              <View style={styles.serviceDetailsInfo}>
                <Text style={styles.selectedServiceName}>{selectedService.name}</Text>
                <Text style={styles.selectedServiceDescription}>
                  {selectedService.description}
                </Text>
                <Text style={styles.verifierId}>Verifier ID: {selectedService.verifierId}</Text>
              </View>
            </View>

            {showQR && qrData && (
              <View style={styles.qrCodeContainer}>
                <Text style={styles.qrTitle}>Scan this QR code</Text>
                <View style={styles.qrCodeWrapper}>
                  <QRCode value={qrData} size={250} />
                </View>
                <Text style={styles.qrInstructions}>
                  Users can scan this QR code with their mobile app to verify eligibility
                </Text>
                
                <TouchableOpacity style={styles.shareButton} onPress={shareQR}>
                  <Ionicons name="share-outline" size={20} color="white" />
                  <Text style={styles.shareButtonText}>Share QR Data</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.criteriaContainer}>
              <Text style={styles.criteriaTitle}>Eligibility Criteria</Text>
              {renderCriteria(selectedService.criteria)}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoTitle}>How it works</Text>
              <View style={styles.infoItem}>
                <MaterialIcons name="qr-code-scanner" size={20} color="#007AFF" />
                <Text style={styles.infoText}>User scans this QR code with their mobile app</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="credit-card" size={20} color="#007AFF" />
                <Text style={styles.infoText}>App prompts user to select their credentials</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="verified" size={20} color="#007AFF" />
                <Text style={styles.infoText}>System verifies document genuineness and eligibility</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="check-circle" size={20} color="#007AFF" />
                <Text style={styles.infoText}>Result shows entitlements and verification status</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  serviceCard: {
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
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  verifierId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  qrContainer: {
    flex: 1,
  },
  qrHeader: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceDetailsInfo: {
    flex: 1,
    marginLeft: 12,
  },
  selectedServiceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  selectedServiceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  qrCodeContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 16,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  criteriaContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  criteriaTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  criteriaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  criteriaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
});

export default ServiceQRDisplay; 