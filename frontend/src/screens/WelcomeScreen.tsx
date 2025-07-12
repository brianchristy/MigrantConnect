import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';

export default function WelcomeScreen({ route, navigation }: any) {
  const user = route?.params?.user;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome{user && user.name ? `, ${user.name}` : ''}!
          </Text>
          <Text style={styles.subtitle}>Your portable digital identity platform</Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Profile', { phone: user?.phone })}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>📄</Text>
            </View>
            <Text style={styles.cardTitle}>Manage Documents</Text>
            <Text style={styles.cardSubtitle}>Upload and manage your identity documents</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('QR', { user })}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <Text style={styles.cardTitle}>QR Codes</Text>
            <Text style={styles.cardSubtitle}>Generate and scan QR codes for documents</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Healthcare', { user })}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>🏥</Text>
            </View>
            <Text style={styles.cardTitle}>Healthcare Services</Text>
            <Text style={styles.cardSubtitle}>Find nearby hospitals, clinics, and pharmacies</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60, // Increased top padding for status bar
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 20, // Add some top margin
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  cardIcon: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
  footer: {
    paddingBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: '#e74c3c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 