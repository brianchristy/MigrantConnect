import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, SafeAreaView, ScrollView, Linking } from 'react-native';
import QRCode from '../components/QRCode';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import axios from 'axios';

export default function QRScreen({ route, navigation }: any) {
  const user = route?.params?.user;
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    if (user?.phone) {
      fetchDocuments(user.phone);
    }
  }, [user]);

  const fetchDocuments = async (phone: string) => {
    try {
      const res = await axios.get(`${process.env.API_BASE_URL}/api/documents/${phone}`);
      setUploadedDocs(res.data);
    } catch (err) {
      setUploadedDocs([]);
    }
  };

  const handleRequestPermission = async () => {
    const { status } = await requestPermission();
    setShowScanner(status === 'granted');
  };

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    setShowScanner(false);
    setScannedData(result.data);

    let parsed = null;
    try {
      parsed = JSON.parse(result.data);
    } catch (e) {}

    // If the QR contains a download link, open it directly
    if (parsed && parsed.download) {
      Linking.openURL(parsed.download);
    } else if (typeof result.data === 'string' && result.data.startsWith('http')) {
      Linking.openURL(result.data);
    } else {
      Alert.alert('QR Code Scanned', result.data);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Custom Navigation */}
        <View style={styles.navBar}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.navigate('Welcome', { user })}
          >
            <Text style={styles.backButtonText}>← Back to Welcome</Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>QR Code Manager</Text>
          <Text style={styles.headerSubtitle}>Generate and scan QR codes for your documents</Text>
        </View>

        {/* Available Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Documents</Text>
          {uploadedDocs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📄</Text>
              <Text style={styles.emptyTitle}>No documents uploaded</Text>
              <Text style={styles.emptySubtitle}>Upload documents in your profile to generate QR codes</Text>
            </View>
          ) : (
            <View style={styles.documentsGrid}>
              {uploadedDocs.map((doc, idx) => (
                <TouchableOpacity
                  key={doc._id || idx}
                  style={[
                    styles.documentCard,
                    selectedDoc?._id === doc._id && styles.selectedCard
                  ]}
                  onPress={() => setSelectedDoc(doc)}
                >
                  <Text style={styles.docIcon}>
                    {doc.type === 'aadhaar' ? '🆔' : 
                     doc.type === 'pan' ? '📋' : 
                     doc.type === 'ration' ? '🍞' : '💼'}
                  </Text>
                  <Text style={styles.docTitle}>{doc.type.charAt(0).toUpperCase() + doc.type.slice(1)}</Text>
                  <Text style={styles.docFileName}>{doc.fileName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* QR Code Display */}
        {selectedDoc && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QR Code</Text>
            <View style={styles.qrContainer}>
              <Text style={styles.qrTitle}>
                {selectedDoc.type.charAt(0).toUpperCase() + selectedDoc.type.slice(1)} Document
              </Text>
              <View style={styles.qrWrapper}>
                <QRCode value={JSON.stringify({ download: `${process.env.API_BASE_URL}/api/documents/${selectedDoc._id}/download` })} />
              </View>
              <TouchableOpacity 
                style={styles.hideButton} 
                onPress={() => setSelectedDoc(null)}
              >
                <Text style={styles.hideButtonText}>Hide QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Scanner Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scan QR Code</Text>
          <TouchableOpacity style={styles.scanButton} onPress={handleRequestPermission}>
            <Text style={styles.scanButtonText}>Open Scanner</Text>
          </TouchableOpacity>
          
          {showScanner && permission?.granted && (
            <View style={styles.scannerContainer}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarCodeScanned}
              />
            </View>
          )}
        </View>

        {/* Scanned Data Display */}
        {scannedData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scanned Data</Text>
            <View style={styles.scannedDataCard}>
              {(() => {
                let parsed = null;
                try {
                  parsed = JSON.parse(scannedData);
                } catch (e) {}
                return parsed ? (
                  <View>
                    {parsed.download && (
                      <TouchableOpacity 
                        style={styles.downloadLink}
                        onPress={() => Linking.openURL(parsed.download)}
                      >
                        <Text style={styles.downloadLinkText}>📥 Download Document</Text>
                      </TouchableOpacity>
                    )}
                    {parsed.phone && <Text style={styles.scannedText}>📱 Phone: {parsed.phone}</Text>}
                    {parsed.aadhaar && <Text style={styles.scannedText}>🆔 Aadhaar: {parsed.aadhaar}</Text>}
                    {parsed.name && <Text style={styles.scannedText}>👤 Name: {parsed.name}</Text>}
                  </View>
                ) : (
                  <Text style={styles.scannedText}>📄 Raw Data: {scannedData}</Text>
                );
              })()}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  navBar: {
    paddingTop: 40, // Reduced padding for better positioning
    paddingBottom: 10,
    alignItems: 'flex-start',
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3498db',
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10, // Add some spacing from nav bar
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  documentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCard: {
    borderColor: '#3498db',
    borderWidth: 2,
  },
  docIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
    textAlign: 'center',
  },
  docFileName: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  qrContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
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
    color: '#2c3e50',
    marginBottom: 16,
  },
  qrWrapper: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  hideButton: {
    backgroundColor: '#95a5a6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  hideButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scanButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 16,
    shadowColor: '#9b59b6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scannerContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  camera: {
    width: '100%',
    height: 300,
  },
  scannedDataCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  downloadLink: {
    backgroundColor: '#f39c12',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  downloadLinkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  scannedText: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 8,
  },
}); 