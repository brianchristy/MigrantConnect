import React from 'react';
import QRCodeSVG from 'react-native-qrcode-svg';
import { View } from 'react-native';

export default function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <QRCodeSVG value={value} size={size} />
    </View>
  );
} 