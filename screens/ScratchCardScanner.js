import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Animated,
  Dimensions,
  Platform,
  Alert,
  Vibration,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SCAN_FRAME = width * 0.78;

// Detect digit-heavy strings from OCR text (scratch card codes)
function extractCardNumber(text) {
  if (!text) return null;
  // Try to find long numeric / alphanumeric codes (8-20 chars)
  const patterns = [
    /\b\d[\d\s\-]{7,22}\d\b/g,          // digits with spaces/dashes
    /\b[A-Z0-9]{4}[\s\-]?[A-Z0-9]{4}[\s\-]?[A-Z0-9]{4,6}\b/g, // PIN-style
    /\b\d{10,20}\b/g,                    // plain long numbers
  ];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      // Return the longest match (most likely the card number)
      return matches.sort((a, b) => b.length - a.length)[0].replace(/[\s\-]/g, '');
    }
  }
  return null;
}

export default function ScratchCardScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [phase, setPhase] = useState('scan'); // 'scan' | 'confirm' | 'dialing'
  const [torch, setTorch] = useState(false);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideUpAnim = useRef(new Animated.Value(100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const dialAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Scan line loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    // Corner pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const animateCardIn = () => {
    Animated.parallel([
      Animated.spring(slideUpAnim, { toValue: 0, useNativeDriver: true, tension: 60 }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;
    const number = extractCardNumber(data) || data.replace(/[^0-9]/g, '');
    if (!number || number.length < 6) return;

    Vibration.vibrate(120);
    setScanned(true);
    setCardNumber(number);
    setPhase('confirm');
    animateCardIn();
  };

  const dialNumber = async () => {
    setPhase('dialing');
    Animated.timing(dialAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();

    // Copy to clipboard as backup
    await Clipboard.setStringAsync(cardNumber);

    const url = `tel:${cardNumber}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        'Dialer Not Available',
        `Your number ${cardNumber} has been copied to clipboard.`,
        [{ text: 'OK', onPress: resetScan }]
      );
    }
  };

  const resetScan = () => {
    setScanned(false);
    setCardNumber('');
    setPhase('scan');
    slideUpAnim.setValue(100);
    fadeAnim.setValue(0);
    dialAnim.setValue(0);
  };

  const editDigit = (index, digit) => {
    const arr = cardNumber.split('');
    arr[index] = digit;
    setCardNumber(arr.join(''));
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permContainer}>
        <Ionicons name="camera-outline" size={64} color="#00E5A0" />
        <Text style={styles.permTitle}>Camera Access Needed</Text>
        <Text style={styles.permSub}>To scan your scratch card number</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCAN_FRAME - 4],
  });

  const formatDisplay = (num) => {
    // Group into chunks of 4
    return num.replace(/(.{4})/g, '$1 ').trim();
  };

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'pdf417'] }}
        onBarcodeScanned={phase === 'scan' ? handleBarCodeScanned : undefined}
      />

      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        {/* Top overlay */}
        <View style={[styles.overlaySection, { height: (height - SCAN_FRAME) / 2 - 30 }]} />

        {/* Middle row */}
        <View style={{ flexDirection: 'row', height: SCAN_FRAME }}>
          <View style={[styles.overlaySection, { width: (width - SCAN_FRAME) / 2, height: SCAN_FRAME }]} />

          {/* Scan frame */}
          <View style={styles.scanFrame}>
            {/* Corner brackets */}
            <Animated.View style={[styles.corner, styles.tl, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.corner, styles.tr, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.corner, styles.bl, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.corner, styles.br, { transform: [{ scale: pulseAnim }] }]} />

            {/* Scan line */}
            {phase === 'scan' && (
              <Animated.View
                style={[
                  styles.scanLine,
                  { transform: [{ translateY: scanLineTranslate }] },
                ]}
              />
            )}
          </View>

          <View style={[styles.overlaySection, { width: (width - SCAN_FRAME) / 2, height: SCAN_FRAME }]} />
        </View>

        {/* Bottom overlay */}
        <View style={[styles.overlaySection, { flex: 1 }]} />
      </View>

      {/* Top bar */}
      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.topRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>SCRATCH CARD DIALER</Text>
          </View>
          <TouchableOpacity style={styles.torchBtn} onPress={() => setTorch(t => !t)}>
            <Ionicons name={torch ? 'flash' : 'flash-outline'} size={22} color={torch ? '#FFD700' : '#fff'} />
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>
          {phase === 'scan' ? 'Point camera at card barcode or number' : 'Review and dial'}
        </Text>
      </SafeAreaView>

      {/* Confirm card panel */}
      {(phase === 'confirm' || phase === 'dialing') && (
        <Animated.View
          style={[
            styles.confirmPanel,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideUpAnim }],
            },
          ]}
        >
          <View style={styles.panelHandle} />

          <Text style={styles.panelLabel}>SCANNED NUMBER</Text>

          {/* Number display with digit edit */}
          <View style={styles.numberRow}>
            {cardNumber.split('').map((d, i) => (
              <View key={i} style={styles.digitBox}>
                <Text style={styles.digitText}>{d}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.numberFormatted}>{formatDisplay(cardNumber)}</Text>
          <Text style={styles.digitCount}>{cardNumber.length} digits detected</Text>

          {phase === 'confirm' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rescanBtn} onPress={resetScan}>
                <Ionicons name="refresh-outline" size={20} color="#00E5A0" />
                <Text style={styles.rescanText}>Rescan</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dialBtn} onPress={dialNumber}>
                <Ionicons name="call" size={22} color="#000" />
                <Text style={styles.dialBtnText}>Dial Now</Text>
              </TouchableOpacity>
            </View>
          )}

          {phase === 'dialing' && (
            <Animated.View
              style={[
                styles.dialingIndicator,
                { opacity: dialAnim },
              ]}
            >
              <Ionicons name="call" size={28} color="#00E5A0" />
              <Text style={styles.dialingText}>Opening dialer…</Text>
              <TouchableOpacity onPress={resetScan} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>
      )}

      {/* Manual entry hint */}
      {phase === 'scan' && (
        <SafeAreaView edges={['bottom']} style={styles.bottomHint}>
          <Text style={styles.bottomHintText}>
            Supports barcodes, QR codes & printed numbers
          </Text>
        </SafeAreaView>
      )}
    </View>
  );
}

const ACCENT = '#00E5A0';
const DARK = '#0A0E1A';
const PANEL = '#131929';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DARK },

  // Permission screen
  permContainer: {
    flex: 1, backgroundColor: DARK,
    alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  permTitle: { color: '#fff', fontSize: 24, fontWeight: '700', marginTop: 20 },
  permSub: { color: '#888', fontSize: 15, marginTop: 8, textAlign: 'center' },
  permBtn: {
    marginTop: 32, backgroundColor: ACCENT,
    paddingHorizontal: 40, paddingVertical: 14, borderRadius: 50,
  },
  permBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },

  // Overlay
  overlay: { ...StyleSheet.absoluteFillObject, flexDirection: 'column' },
  overlaySection: { backgroundColor: 'rgba(0,0,0,0.72)' },

  // Scan frame
  scanFrame: {
    width: SCAN_FRAME,
    height: SCAN_FRAME,
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: 28, height: 28,
    borderColor: ACCENT, borderWidth: 3,
  },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  scanLine: {
    position: 'absolute', left: 4, right: 4, height: 2,
    backgroundColor: ACCENT,
    shadowColor: ACCENT, shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 },
  },

  // Top bar
  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    alignItems: 'center', paddingHorizontal: 16,
  },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', width: '100%', marginBottom: 8,
  },
  badge: {
    backgroundColor: 'rgba(0,229,160,0.15)',
    borderColor: ACCENT, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  badgeText: { color: ACCENT, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  torchBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  hint: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center' },

  // Confirm panel
  confirmPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: PANEL,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20,
    elevation: 20,
  },
  panelHandle: {
    alignSelf: 'center', width: 40, height: 4,
    backgroundColor: '#333', borderRadius: 2, marginBottom: 20,
  },
  panelLabel: {
    color: '#555', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, marginBottom: 14,
  },
  numberRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12,
  },
  digitBox: {
    width: 30, height: 38, borderRadius: 6,
    backgroundColor: '#1E2840',
    borderColor: '#2A3550', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  digitText: { color: '#fff', fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] },
  numberFormatted: {
    color: ACCENT, fontSize: 22, fontWeight: '800',
    letterSpacing: 3, fontVariant: ['tabular-nums'], marginBottom: 4,
  },
  digitCount: { color: '#555', fontSize: 12, marginBottom: 24 },

  // Action row
  actionRow: { flexDirection: 'row', gap: 12 },
  rescanBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 16,
    borderColor: ACCENT, borderWidth: 1.5,
    backgroundColor: 'rgba(0,229,160,0.07)',
  },
  rescanText: { color: ACCENT, fontWeight: '700', fontSize: 15 },
  dialBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 15, borderRadius: 16,
    backgroundColor: ACCENT,
  },
  dialBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },

  // Dialing
  dialingIndicator: {
    alignItems: 'center', paddingVertical: 12, gap: 10,
  },
  dialingText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { marginTop: 4 },
  cancelText: { color: '#555', fontSize: 14, textDecorationLine: 'underline' },

  // Bottom hint
  bottomHint: {
    position: 'absolute', bottom: 0, left: 0, right: 0, alignItems: 'center',
  },
  bottomHintText: {
    color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16,
  },
});
