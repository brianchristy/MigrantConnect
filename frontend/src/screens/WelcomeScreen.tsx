import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Modal, ScrollView } from 'react-native';
import { useLanguage } from '../i18n/LanguageContext';
import { languageNames, Language } from '../i18n';

export default function WelcomeScreen({ route, navigation }: any) {
  const { translations: t, changeLanguage, currentLanguage } = useLanguage();
  const user = route?.params?.user;
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  const handleLanguageSelect = async (language: Language) => {
    try {
      await changeLanguage(language);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Language Switcher */}
      <View style={styles.languageSwitcher}>
        <TouchableOpacity 
          style={styles.globeButton} 
          onPress={() => setShowLanguageModal(true)}
        >
          <Text style={styles.globeIcon}>🌐</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            {t.welcome.greeting}{user && user.name ? `, ${user.name}` : ''}!
          </Text>
          <Text style={styles.subtitle}>{t.welcome.description}</Text>
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
            <Text style={styles.cardTitle}>{t.welcome.profileButton}</Text>
            <Text style={styles.cardSubtitle}>Manage your identity documents and profile information</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('QR', { user })}
          >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>📱</Text>
            </View>
            <Text style={styles.cardTitle}>{t.welcome.qrButton}</Text>
            <Text style={styles.cardSubtitle}>Generate and scan QR codes for your documents</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => navigation.navigate('Healthcare', { user })}
            >
            <View style={styles.cardIcon}>
              <Text style={styles.iconText}>🏥</Text>
            </View>
            <Text style={styles.cardTitle}>{t.welcome.healthcareButton}</Text>
            <Text style={styles.cardSubtitle}>Find nearby hospitals, clinics, and pharmacies</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.logoutButton} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.logoutButtonText}>{t.auth.logout}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              {Object.entries(languageNames).map(([code, name]) => (
                <TouchableOpacity
                  key={code}
                  style={[
                    styles.languageOption,
                    currentLanguage === code && styles.languageOptionSelected
                  ]}
                  onPress={() => handleLanguageSelect(code as Language)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    currentLanguage === code && styles.languageOptionTextSelected
                  ]}>
                    {name}
                  </Text>
                  {currentLanguage === code && (
                    <Text style={styles.languageOptionCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  languageSwitcher: {
    position: 'absolute',
    top: 60, // Adjust based on content padding
    right: 20,
    zIndex: 10,
  },
  globeButton: {
    backgroundColor: '#ffffff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  globeIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60, // Increased top padding for status bar
    paddingBottom: 20, // Add some bottom padding for the footer
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modalClose: {
    fontSize: 24,
    color: '#7f8c8d',
  },
  modalBody: {
    marginTop: 10,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  languageOptionSelected: {
    backgroundColor: '#e0e0e0',
  },
  languageOptionText: {
    fontSize: 18,
    color: '#34495e',
  },
  languageOptionTextSelected: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  languageOptionCheck: {
    fontSize: 20,
    color: '#27ae60',
  },
}); 