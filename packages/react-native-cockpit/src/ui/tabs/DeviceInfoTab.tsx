import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { safeJsonStringify } from '../../utils/formatters';

interface DeviceInfoTabProps {
  onCopyText?: (text: string) => void;
}

export const DeviceInfoTab: React.FC<DeviceInfoTabProps> = ({ onCopyText }) => {
  const window = Dimensions.get('window');
  const screen = Dimensions.get('screen');

  const rnVersion = (Platform.constants as any)?.reactNativeVersion
    ? `${(Platform.constants as any).reactNativeVersion.major}.${(Platform.constants as any).reactNativeVersion.minor}.${(Platform.constants as any).reactNativeVersion.patch}`
    : 'Unknown';

  const isHermes = Boolean((global as any).HermesInternal);

  const specs = {
    platform: Platform.OS,
    osVersion: String(Platform.Version),
    reactNativeVersion: rnVersion,
    hermesEngine: isHermes,
    devMode: typeof __DEV__ !== 'undefined' ? __DEV__ : false,
    windowWidth: window.width,
    windowHeight: window.height,
    windowScale: window.scale,
    fontScale: window.fontScale,
    screenWidth: screen.width,
    screenHeight: screen.height,
  };

  const handleCopy = () => {
    const text = safeJsonStringify(specs);
    if (onCopyText) {
      onCopyText(text);
      Alert.alert('Copied', 'Device info copied to clipboard');
    } else {
      Alert.alert('Device Specs', text);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Environment & Device</Text>
        <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
          <Text style={styles.copyBtnText}>📋 Copy Specs</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <InfoItem label="Platform" value={Platform.OS} highlight />
        <InfoItem label="OS Version" value={String(Platform.Version)} />
        <InfoItem label="React Native" value={rnVersion} />
        <InfoItem label="Hermes Engine" value={isHermes ? 'Enabled (Active)' : 'Disabled (JSC)'} />
        <InfoItem label="Build Environment" value={typeof __DEV__ !== 'undefined' && __DEV__ ? 'Development (__DEV__ = true)' : 'Release / Production'} />
      </View>

      <Text style={styles.sectionHeader}>Display & Window</Text>
      <View style={styles.card}>
        <InfoItem label="Window Size" value={`${Math.round(window.width)} x ${Math.round(window.height)} pt`} />
        <InfoItem label="Screen Size" value={`${Math.round(screen.width)} x ${Math.round(screen.height)} px`} />
        <InfoItem label="Pixel Ratio" value={`${window.scale}x`} />
        <InfoItem label="Font Scale" value={`${window.fontScale}x`} />
      </View>
    </ScrollView>
  );
};

const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <View style={styles.itemRow}>
    <Text style={styles.itemLabel}>{label}</Text>
    <Text style={[styles.itemValue, highlight && styles.highlightValue]} selectable>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  copyBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  copyBtnText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  itemLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  itemValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: 'Courier',
    fontWeight: '500',
  },
  highlightValue: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
});
