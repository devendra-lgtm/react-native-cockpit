import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CockpitConfig, StorageAdapter } from '../types';
import { cockpitStore } from '../core/CockpitStore';
import { NetworkInterceptor } from '../core/NetworkInterceptor';
import { LogInterceptor } from '../core/LogInterceptor';
import { StorageManager } from '../core/StorageManager';
import { FloatingBubble } from './FloatingBubble';
import { InspectorModal } from './InspectorModal';

export interface CockpitProps extends CockpitConfig {
  onCopyText?: (text: string) => void;
}

export const Cockpit: React.FC<CockpitProps> = ({
  enabled = typeof __DEV__ !== 'undefined' ? __DEV__ : true,
  maxNetworkRequests = 100,
  maxLogs = 200,
  storageAdapters = [],
  bubbleInitialPosition,
  onCopyText,
}) => {
  useEffect(() => {
    if (!enabled) return;

    cockpitStore.setLimits(maxNetworkRequests, maxLogs);
    NetworkInterceptor.enable();
    LogInterceptor.enable();

    if (storageAdapters && storageAdapters.length > 0) {
      storageAdapters.forEach((adapter) => {
        StorageManager.registerAdapter(adapter);
      });
    }

    return () => {
      // Don't disable interceptors automatically on unmount to avoid missing logs during re-renders,
      // unless user explicitly sets enabled=false
    };
  }, [enabled, maxNetworkRequests, maxLogs, storageAdapters]);

  if (!enabled) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <FloatingBubble initialPosition={bubbleInitialPosition} />
      <InspectorModal onCopyText={onCopyText} />
    </View>
  );
};
