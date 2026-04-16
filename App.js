import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ScratchCardScanner from './screens/ScratchCardScanner';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <ScratchCardScanner />
    </SafeAreaProvider>
  );
}
