import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from '../i18n';
import { Language } from '../i18n';

interface LanguageSelectionScreenProps {
  onLanguageSelect: (language: Language) => void;
  isRegistration?: boolean;
}

const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onLanguageSelect,
  isRegistration = true,
}) => {
  const { t, languageNames } = useTranslation();

  const handleLanguageSelect = (language: Language) => {
    onLanguageSelect(language);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.language.title}</Text>
          <Text style={styles.subtitle}>{t.language.subtitle}</Text>
        </View>

        <View style={styles.languageContainer}>
          {Object.entries(languageNames).map(([code, name]) => (
            <TouchableOpacity
              key={code}
              style={styles.languageCard}
              onPress={() => handleLanguageSelect(code as Language)}
              activeOpacity={0.7}
            >
              <View style={styles.languageContent}>
                <Text style={styles.languageName}>{name}</Text>
                <Text style={styles.languageCode}>{code.toUpperCase()}</Text>
              </View>
              <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {isRegistration && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t.language.languagePreferenceDesc}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
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
    lineHeight: 22,
  },
  languageContainer: {
    marginBottom: 30,
  },
  languageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  languageCode: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LanguageSelectionScreen; 