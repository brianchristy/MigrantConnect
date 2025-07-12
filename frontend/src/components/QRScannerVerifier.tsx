import React from 'react';
import AlternativeQRScanner from './AlternativeQRScanner';
import { VerificationResponse } from '../services/verificationService';

interface QRScannerVerifierProps {
  service?: string;
  onClose?: () => void;
  onVerificationComplete?: (result: VerificationResponse) => void;
  verifierId?: string;
  onQRScanned?: (qrData: string) => void;
}

const QRScannerVerifier: React.FC<QRScannerVerifierProps> = (props) => {
  return <AlternativeQRScanner {...props} />;
};

export default QRScannerVerifier; 