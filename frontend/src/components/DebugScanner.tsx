import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AlternativeQRScanner from './AlternativeQRScanner';

interface DebugInfo {
  timestamp: string;
  message: string;
  data?: any;
}

const DebugScanner: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedData, setScannedData] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<DebugInfo[]>([]);

  const addDebugLog = (message: string, data?: any) => {
    const log: DebugInfo = {
      timestamp: new Date().toISOString(),
      message,
      data
    };
    console.log(`[DEBUG] ${message}`, data);
    setDebugLogs(prev => [...prev, log]);
  };

  const handleQRScanned = (data: string) => {
    addDebugLog('QR Code scanned successfully', { data });
    setScannedData(data);
    setShowScanner(false);
    
    Alert.alert(
      'QR Code Scanned!',
      `Data: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => {
            addDebugLog('Starting new scan');
            setShowScanner(true);
          }
        },
        {
          text: 'Close',
          style: 'cancel'
        }
      ]
    );
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  const testScanner = () => {
    addDebugLog('Manual test triggered');
    // Simulate a scan for testing
    const testData = 'Test QR Code Data - ' + new Date().toISOString();
    setScannedData(testData);
    addDebugLog('Test data set', { testData });
  };

  if (showScanner) {
    return (
      <AlternativeQRScanner
        onQRScanned={handleQRScanned}
        onClose={() => {
          addDebugLog('Scanner closed by user');
          setShowScanner(false);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="bug" size={32} color="#007AFF" />
        <Text style={styles.headerTitle}>Debug QR Scanner</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={styles.scanButton} 
            onPress={() => {
              addDebugLog('Scanner button pressed');
              setShowScanner(true);
            }}
          >
            <Ionicons name="camera" size={24} color="white" />
            <Text style={styles.scanButtonText}>Start Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testScanner}
          >
            <Ionicons name="play" size={20} color="#007AFF" />
            <Text style={styles.testButtonText}>Test Data</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={clearLogs}
          >
            <Ionicons name="trash" size={20} color="#FF6B6B" />
            <Text style={styles.clearButtonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        {scannedData ? (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Last Scanned Data:</Text>
            <Text style={styles.resultText}>
              {scannedData.length > 100 
                ? `${scannedData.substring(0, 100)}...` 
                : scannedData
              }
            </Text>
          </View>
        ) : null}

        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Debug Logs ({debugLogs.length})</Text>
          <ScrollView style={styles.logsScroll}>
            {debugLogs.length === 0 ? (
              <Text style={styles.noLogsText}>No debug logs yet</Text>
            ) : (
              debugLogs.map((log, index) => (
                <View key={index} style={styles.logItem}>
                  <Text style={styles.logTimestamp}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </Text>
                  <Text style={styles.logMessage}>{log.message}</Text>
                  {log.data && (
                    <Text style={styles.logData}>
                      {JSON.stringify(log.data, null, 2)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
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
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginLeft: 10,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  testButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginRight: 10,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  clearButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  resultContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  logsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 10,
  },
  logsScroll: {
    flex: 1,
  },
  noLogsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
  },
  logItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  logTimestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  logMessage: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    marginBottom: 4,
  },
  logData: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#F8F9FA',
    padding: 4,
    borderRadius: 4,
  },
});

export default DebugScanner; 