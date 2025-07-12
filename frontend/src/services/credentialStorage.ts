import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface VerifiableCredential {
  type: 'RationCardVC' | 'HealthCardVC' | 'EducationCardVC' | 'SkillCertVC';
  issuedBy: string;
  issuedAt: string;
  expiresAt: string;
  credentialSubject: any;
  proof?: {
    type: string;
    created: string;
    verificationMethod: string;
    proofPurpose: string;
    proofValue: string;
  };
  status: 'active' | 'revoked' | 'expired';
}

export interface StoredCredential {
  id: string;
  credential: VerifiableCredential;
  encrypted: boolean;
  createdAt: string;
  lastAccessed: string;
}

class CredentialStorageService {
  private readonly CREDENTIALS_KEY = 'migrant_credentials';
  private readonly ENCRYPTION_KEY = 'migrant_encryption_key';

  async storeCredential(credential: VerifiableCredential): Promise<string> {
    try {
      const id = this.generateCredentialId(credential);
      const storedCredential: StoredCredential = {
        id,
        credential,
        encrypted: false, // Changed to false since we're using base64 encoding
        createdAt: new Date().toISOString(),
        lastAccessed: new Date().toISOString()
      };

      // Encode the credential before storing
      const encodedData = this.encryptCredential(storedCredential);
      
      try {
        // Try SecureStore first
        await SecureStore.setItemAsync(`${this.CREDENTIALS_KEY}_${id}`, encodedData);
      } catch (secureStoreError) {
        console.warn('SecureStore failed, falling back to AsyncStorage:', secureStoreError);
        // Fallback to AsyncStorage
        await AsyncStorage.setItem(`${this.CREDENTIALS_KEY}_${id}`, encodedData);
      }

      // Update the credentials list
      await this.updateCredentialsList(id, storedCredential);

      return id;
    } catch (error) {
      console.error('Error storing credential:', error);
      throw new Error('Failed to store credential');
    }
  }

  async getCredential(id: string): Promise<VerifiableCredential | null> {
    try {
      let encodedData = await SecureStore.getItemAsync(`${this.CREDENTIALS_KEY}_${id}`);
      
      if (!encodedData) {
        // Try AsyncStorage as fallback
        encodedData = await AsyncStorage.getItem(`${this.CREDENTIALS_KEY}_${id}`);
      }
      
      if (!encodedData) {
        return null;
      }

      const storedCredential = this.decryptCredential(encodedData);
      
      // Update last accessed time
      storedCredential.lastAccessed = new Date().toISOString();
      const updatedEncodedData = this.encryptCredential(storedCredential);
      
      try {
        await SecureStore.setItemAsync(`${this.CREDENTIALS_KEY}_${id}`, updatedEncodedData);
      } catch (secureStoreError) {
        await AsyncStorage.setItem(`${this.CREDENTIALS_KEY}_${id}`, updatedEncodedData);
      }

      return storedCredential.credential;
    } catch (error) {
      console.error('Error retrieving credential:', error);
      return null;
    }
  }

  async getAllCredentials(): Promise<StoredCredential[]> {
    try {
      let credentialsList = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
      
      if (!credentialsList) {
        // Try AsyncStorage as fallback
        credentialsList = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      }
      
      if (!credentialsList) {
        return [];
      }

      const credentialIds: string[] = JSON.parse(credentialsList);
      const credentials: StoredCredential[] = [];

      for (const id of credentialIds) {
        let encodedData = await SecureStore.getItemAsync(`${this.CREDENTIALS_KEY}_${id}`);
        
        if (!encodedData) {
          // Try AsyncStorage as fallback
          encodedData = await AsyncStorage.getItem(`${this.CREDENTIALS_KEY}_${id}`);
        }
        
        if (encodedData) {
          const storedCredential = this.decryptCredential(encodedData);
          credentials.push(storedCredential);
        }
      }

      return credentials.sort((a, b) => 
        new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
      );
    } catch (error) {
      console.error('Error retrieving all credentials:', error);
      return [];
    }
  }

  async deleteCredential(id: string): Promise<boolean> {
    try {
      try {
        await SecureStore.deleteItemAsync(`${this.CREDENTIALS_KEY}_${id}`);
      } catch (secureStoreError) {
        await AsyncStorage.removeItem(`${this.CREDENTIALS_KEY}_${id}`);
      }
      
      // Remove from credentials list
      let credentialsList = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
      if (!credentialsList) {
        credentialsList = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
      }
      
      if (credentialsList) {
        const credentialIds: string[] = JSON.parse(credentialsList);
        const updatedIds = credentialIds.filter(credId => credId !== id);
        const updatedList = JSON.stringify(updatedIds);
        
        try {
          await SecureStore.setItemAsync(this.CREDENTIALS_KEY, updatedList);
        } catch (secureStoreError) {
          await AsyncStorage.setItem(this.CREDENTIALS_KEY, updatedList);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting credential:', error);
      return false;
    }
  }

  async getCredentialsByType(type: VerifiableCredential['type']): Promise<StoredCredential[]> {
    const allCredentials = await this.getAllCredentials();
    return allCredentials.filter(cred => cred.credential.type === type);
  }

  private generateCredentialId(credential: VerifiableCredential): string {
    const data = `${credential.type}_${credential.issuedBy}_${credential.issuedAt}`;
    // Simple hash function that doesn't require crypto
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  }

  private encryptCredential(data: StoredCredential): string {
    const jsonString = JSON.stringify(data);
    // Simple base64 encoding instead of encryption for now
    return btoa(jsonString);
  }

  private decryptCredential(encryptedData: string): StoredCredential {
    // Simple base64 decoding
    const decryptedString = atob(encryptedData);
    return JSON.parse(decryptedString);
  }

  private async updateCredentialsList(id: string, storedCredential: StoredCredential): Promise<void> {
    let existingList = await SecureStore.getItemAsync(this.CREDENTIALS_KEY);
    
    if (!existingList) {
      existingList = await AsyncStorage.getItem(this.CREDENTIALS_KEY);
    }
    
    let credentialIds: string[] = [];
    
    if (existingList) {
      credentialIds = JSON.parse(existingList);
    }

    if (!credentialIds.includes(id)) {
      credentialIds.push(id);
      const updatedList = JSON.stringify(credentialIds);
      
      try {
        await SecureStore.setItemAsync(this.CREDENTIALS_KEY, updatedList);
      } catch (secureStoreError) {
        await AsyncStorage.setItem(this.CREDENTIALS_KEY, updatedList);
      }
    }
  }

  // Sample credentials for testing
  async loadSampleCredentials(): Promise<void> {
    const sampleCredentials: VerifiableCredential[] = [
      {
        type: 'RationCardVC',
        issuedBy: 'FoodDept_Bihar',
        issuedAt: '2024-01-15T10:00:00Z',
        expiresAt: '2025-12-31T23:59:59Z',
        credentialSubject: {
          userId: 'user123',
          entitlement: '5kg/month',
          ONORC_enabled: true,
          last_claimed: '2024-06-15',
          family_size: 4,
          card_number: 'RAT123456789'
        },
        status: 'active'
      },
      {
        type: 'HealthCardVC',
        issuedBy: 'HealthDept_Bihar',
        issuedAt: '2024-03-20T14:30:00Z',
        expiresAt: '2025-03-20T14:30:00Z',
        credentialSubject: {
          userId: 'user123',
          coverage_type: 'emergency_health',
          coverage_amount: 'Up to ₹50,000',
          valid_until: '2025-03-20T14:30:00Z',
          hospital_network: ['AIIMS', 'PMCH', 'Private Hospitals'],
          card_number: 'HEALTH987654321'
        },
        status: 'active'
      },
      {
        type: 'EducationCardVC',
        issuedBy: 'EducationDept_Bihar',
        issuedAt: '2024-02-10T09:15:00Z',
        expiresAt: '2025-02-10T09:15:00Z',
        credentialSubject: {
          userId: 'user123',
          scholarship_amount: '₹10,000/year',
          education_level: 'secondary',
          institution_type: 'government',
          academic_year: '2024-25',
          card_number: 'EDU456789123'
        },
        status: 'active'
      }
    ];

    for (const credential of sampleCredentials) {
      await this.storeCredential(credential);
    }
  }
}

export default new CredentialStorageService();

// React Hook for credential storage
import { useState, useEffect } from 'react';

export const useCredentialStorage = () => {
  const [credentials, setCredentials] = useState<StoredCredential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const allCredentials = await credentialStorageService.getAllCredentials();
      setCredentials(allCredentials);
    } catch (error) {
      console.error('Error loading credentials:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCredential = async (credential: VerifiableCredential) => {
    try {
      await credentialStorageService.storeCredential(credential);
      await loadCredentials();
    } catch (error) {
      console.error('Error adding credential:', error);
      throw error;
    }
  };

  const deleteCredential = async (id: string) => {
    try {
      await credentialStorageService.deleteCredential(id);
      await loadCredentials();
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  };

  return {
    credentials,
    loading,
    addCredential,
    deleteCredential,
    refreshCredentials: loadCredentials
  };
};

const credentialStorageService = new CredentialStorageService(); 