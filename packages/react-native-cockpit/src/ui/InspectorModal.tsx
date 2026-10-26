import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { CockpitTab, ConsoleLog, NetworkRequest } from '../types';
import { cockpitStore } from '../core/CockpitStore';
import { NetworkTab } from './tabs/NetworkTab';
import { LogsTab } from './tabs/LogsTab';
import { StorageTab } from './tabs/StorageTab';
import { DeviceInfoTab } from './tabs/DeviceInfoTab';
import { NetworkDetailModal } from './tabs/NetworkDetailModal';

interface InspectorModalProps {
  onCopyText?: (text: string) => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({ onCopyText }) => {
  const [visible, setVisible] = useState(cockpitStore.isModalVisible);
  const [activeTab, setActiveTab] = useState<CockpitTab>(cockpitStore.activeTab);
  const [requests, setRequests] = useState<NetworkRequest[]>(cockpitStore.getRequests());
  const [logs, setLogs] = useState<ConsoleLog[]>(cockpitStore.getLogs());
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(
    cockpitStore.selectedRequest
  );

  useEffect(() => {
    const unsubscribe = cockpitStore.subscribe(() => {
      setVisible(cockpitStore.isModalVisible);
      setActiveTab(cockpitStore.activeTab);
      setRequests(cockpitStore.getRequests());
      setLogs(cockpitStore.getLogs());
      setSelectedRequest(cockpitStore.selectedRequest);
    });
    return unsubscribe;
  }, []);

  const handleClose = () => {
    cockpitStore.setSelectedRequest(null);
    cockpitStore.setModalVisible(false);
  };

  const netErrorCount = requests.filter(
    (r) => (r.status && r.status >= 400) || r.error || r.status === 0
  ).length;

  const logErrorCount = logs.filter((l) => l.level === 'error').length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <SafeAreaView style={styles.safeArea}>
        {selectedRequest ? (
          <NetworkDetailModal
            request={selectedRequest}
            onClose={() => cockpitStore.setSelectedRequest(null)}
            onCopyText={onCopyText}
          />
        ) : (
          <View style={styles.container}>
            {/* Top Navigation */}
            <View style={styles.navBar}>
              <View style={styles.brandRow}>
                <Text style={styles.brandIcon}>🕹️</Text>
                <Text style={styles.brandTitle}>COCKPIT</Text>
              </View>

              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tab selector */}
            <View style={styles.tabSelector}>
              <TabButton
                label="Network"
                active={activeTab === 'network'}
                count={requests.length}
                errorBadge={netErrorCount}
                onPress={() => cockpitStore.setActiveTab('network')}
              />
              <TabButton
                label="Logs"
                active={activeTab === 'logs'}
                count={logs.length}
                errorBadge={logErrorCount}
                onPress={() => cockpitStore.setActiveTab('logs')}
              />
              <TabButton
                label="Storage"
                active={activeTab === 'storage'}
                onPress={() => cockpitStore.setActiveTab('storage')}
              />
              <TabButton
                label="Device"
                active={activeTab === 'info'}
                onPress={() => cockpitStore.setActiveTab('info')}
              />
            </View>

            {/* Tab Body */}
            <View style={styles.tabContent}>
              {activeTab === 'network' && <NetworkTab requests={requests} />}
              {activeTab === 'logs' && <LogsTab logs={logs} />}
              {activeTab === 'storage' && <StorageTab />}
              {activeTab === 'info' && <DeviceInfoTab onCopyText={onCopyText} />}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

interface TabButtonProps {
  label: string;
  active: boolean;
  count?: number;
  errorBadge?: number;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  label,
  active,
  count,
  errorBadge,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.tabBtn, active && styles.tabBtnActive]}
  >
    <View style={styles.tabLabelRow}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
      {count !== undefined && (
        <Text style={[styles.tabCount, active && styles.tabCountActive]}>
          ({count})
        </Text>
      )}
      {errorBadge !== undefined && errorBadge > 0 && (
        <View style={styles.errorPill}>
          <Text style={styles.errorPillText}>{errorBadge}</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  brandTitle: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  closeBtn: {
    backgroundColor: '#1e293b',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabSelector: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1120',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#38bdf8',
    backgroundColor: '#0f172a',
  },
  tabLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  tabCount: {
    color: '#64748b',
    fontSize: 10,
    marginLeft: 3,
  },
  tabCountActive: {
    color: '#94a3b8',
  },
  errorPill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    marginLeft: 4,
  },
  errorPillText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
});
