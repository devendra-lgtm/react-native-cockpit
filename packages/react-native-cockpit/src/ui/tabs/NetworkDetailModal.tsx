import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { NetworkRequest } from '../../types';
import { MethodBadge, StatusBadge } from '../components/Badge';
import { formatBytes, formatDuration, formatTime, safeJsonStringify } from '../../utils/formatters';
import { generateCurl } from '../../utils/curl';
import { JsonViewer } from '../components/JsonViewer';

interface NetworkDetailModalProps {
  request: NetworkRequest;
  onClose: () => void;
  onCopyText?: (text: string) => void;
}

type DetailTab = 'overview' | 'request' | 'response';

export const NetworkDetailModal: React.FC<NetworkDetailModalProps> = ({
  request,
  onClose,
  onCopyText,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const handleCopyCurl = () => {
    const curl = generateCurl(request);
    if (onCopyText) {
      onCopyText(curl);
      Alert.alert('Copied', 'cURL command copied to clipboard');
    } else {
      Alert.alert('cURL', curl);
    }
  };

  const handleCopyResponse = () => {
    const text = typeof request.responseBody === 'string'
      ? request.responseBody
      : safeJsonStringify(request.responseBody);
    if (onCopyText) {
      onCopyText(text);
      Alert.alert('Copied', 'Response copied to clipboard');
    } else {
      Alert.alert('Response', text);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Request Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Summary card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryTopRow}>
          <MethodBadge method={request.method} />
          <View style={styles.spacer} />
          <StatusBadge status={request.status} error={request.error} />
          <Text style={styles.durationText}>{formatDuration(request.duration)}</Text>
          <Text style={styles.sizeText}>{formatBytes(request.size)}</Text>
        </View>
        <Text style={styles.urlText} selectable>
          {request.url}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={handleCopyCurl} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📋 Copy cURL</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopyResponse} style={styles.actionBtn}>
            <Text style={styles.actionBtnText}>📄 Copy Response</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => setActiveTab('overview')}
          style={[styles.tabItem, activeTab === 'overview' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('request')}
          style={[styles.tabItem, activeTab === 'request' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'request' && styles.tabTextActive]}>
            Request
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('response')}
          style={[styles.tabItem, activeTab === 'response' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'response' && styles.tabTextActive]}>
            Response
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <InfoRow label="Status" value={request.status ? `${request.status} ${request.statusText || ''}` : 'Failed / Pending'} />
            <InfoRow label="Time" value={formatTime(request.startTime)} />
            <InfoRow label="Duration" value={formatDuration(request.duration)} />
            <InfoRow label="Size" value={formatBytes(request.size)} />
            <InfoRow label="Method" value={request.method} />
            {request.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error:</Text>
                <Text style={styles.errorMessage}>{request.error}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'request' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Request Headers</Text>
            {request.requestHeaders && Object.keys(request.requestHeaders).length > 0 ? (
              Object.entries(request.requestHeaders).map(([k, v]) => (
                <View key={k} style={styles.headerItem}>
                  <Text style={styles.headerKey}>{k}:</Text>
                  <Text style={styles.headerVal}>{v}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No request headers</Text>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Request Body</Text>
            {request.requestBody ? (
              <View style={styles.bodyBox}>
                <JsonViewer data={request.requestBody} />
              </View>
            ) : (
              <Text style={styles.emptyText}>No request body</Text>
            )}
          </View>
        )}

        {activeTab === 'response' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Response Headers</Text>
            {request.responseHeaders && Object.keys(request.responseHeaders).length > 0 ? (
              Object.entries(request.responseHeaders).map(([k, v]) => (
                <View key={k} style={styles.headerItem}>
                  <Text style={styles.headerKey}>{k}:</Text>
                  <Text style={styles.headerVal}>{v}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No response headers</Text>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Response Body</Text>
            {request.responseBody ? (
              <View style={styles.bodyBox}>
                <JsonViewer data={request.responseBody} />
              </View>
            ) : (
              <Text style={styles.emptyText}>
                {request.error ? `Error: ${request.error}` : 'No response body'}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue} selectable>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    paddingVertical: 4,
    paddingRight: 12,
  },
  backText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    padding: 14,
    marginHorizontal: 12,
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  spacer: {
    width: 8,
  },
  durationText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 10,
  },
  sizeText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 8,
  },
  urlText: {
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: 'Courier',
    marginBottom: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  actionBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginTop: 12,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tabItemActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#38bdf8',
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: 'Courier',
  },
  errorContainer: {
    backgroundColor: '#451a1a',
    padding: 12,
    borderRadius: 6,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorTitle: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  errorMessage: {
    color: '#fee2e2',
    fontSize: 12,
    fontFamily: 'Courier',
  },
  headerItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerKey: {
    color: '#38bdf8',
    fontSize: 12,
    fontFamily: 'Courier',
    fontWeight: 'bold',
  },
  headerVal: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'Courier',
    marginTop: 2,
  },
  bodyBox: {
    backgroundColor: '#020617',
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 12,
    fontStyle: 'italic',
    marginVertical: 4,
  },
});
