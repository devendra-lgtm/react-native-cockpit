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

  // Parse URL query parameters
  let queryParams: Record<string, string> = {};
  let pathname = request.url;
  try {
    const urlObj = new URL(request.url);
    pathname = urlObj.pathname;
    urlObj.searchParams.forEach((val: string, key: string) => {
      queryParams[key] = val;
    });
  } catch {
    // If URL parsing fails, extract simple ?query=...
    const qIndex = request.url.indexOf('?');
    if (qIndex !== -1) {
      pathname = request.url.slice(0, qIndex);
      const search = request.url.slice(qIndex + 1);
      search.split('&').forEach((pair: string) => {
        const [k, v] = pair.split('=');
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
  }

  const queryParamCount = Object.keys(queryParams).length;
  const requestHeaderCount = request.requestHeaders ? Object.keys(request.requestHeaders).length : 0;
  const responseHeaderCount = request.responseHeaders ? Object.keys(request.responseHeaders).length : 0;

  const copyToClipboard = (text: string, label: string) => {
    if (onCopyText) {
      onCopyText(text);
      Alert.alert('Copied', `${label} copied to clipboard`);
    } else {
      Alert.alert(label, text);
    }
  };

  const handleCopyCurl = () => {
    const curl = generateCurl(request);
    copyToClipboard(curl, 'cURL command');
  };

  const handleCopyRequestBody = () => {
    const text = typeof request.requestBody === 'string'
      ? request.requestBody
      : safeJsonStringify(request.requestBody);
    copyToClipboard(text, 'Request Body');
  };

  const handleCopyResponseBody = () => {
    const text = typeof request.responseBody === 'string'
      ? request.responseBody
      : safeJsonStringify(request.responseBody);
    copyToClipboard(text, 'Response Body');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header bar */}
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
          {request.requestBody && (
            <TouchableOpacity onPress={handleCopyRequestBody} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>📤 Copy Request</Text>
            </TouchableOpacity>
          )}
          {request.responseBody && (
            <TouchableOpacity onPress={handleCopyResponseBody} style={styles.actionBtn}>
              <Text style={styles.actionBtnText}>📥 Copy Response</Text>
            </TouchableOpacity>
          )}
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
            Request {request.requestBody ? '•' : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('response')}
          style={[styles.tabItem, activeTab === 'response' && styles.tabItemActive]}
        >
          <Text style={[styles.tabText, activeTab === 'response' && styles.tabTextActive]}>
            Response {request.responseBody ? '•' : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            <InfoRow label="Method" value={request.method} />
            <InfoRow label="Status" value={request.status ? `${request.status} ${request.statusText || ''}` : 'Failed / Pending'} />
            <InfoRow label="Path" value={pathname} />
            <InfoRow label="Time" value={formatTime(request.startTime)} />
            <InfoRow label="Duration" value={formatDuration(request.duration)} />
            <InfoRow label="Payload Size" value={formatBytes(request.size)} />
            <InfoRow label="Query Params" value={String(queryParamCount)} />
            <InfoRow label="Request Headers" value={String(requestHeaderCount)} />
            <InfoRow label="Response Headers" value={String(responseHeaderCount)} />
            {request.error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error:</Text>
                <Text style={styles.errorMessage}>{request.error}</Text>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: REQUEST (Headers, Query Params, Body) */}
        {activeTab === 'request' && (
          <View style={styles.section}>
            {/* Query parameters */}
            {queryParamCount > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={styles.sectionTitle}>Query Parameters ({queryParamCount})</Text>
                {Object.entries(queryParams).map(([k, v]) => (
                  <View key={k} style={styles.headerItem}>
                    <Text style={styles.headerKey}>{k}</Text>
                    <Text style={styles.headerVal}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Request Headers */}
            <Text style={styles.sectionTitle}>Request Headers ({requestHeaderCount})</Text>
            {request.requestHeaders && requestHeaderCount > 0 ? (
              Object.entries(request.requestHeaders).map(([k, v]) => (
                <View key={k} style={styles.headerItem}>
                  <Text style={styles.headerKey}>{k}:</Text>
                  <Text style={styles.headerVal}>{v}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No custom request headers sent</Text>
            )}

            {/* Request Body */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Request Body</Text>
              {request.requestBody && (
                <TouchableOpacity onPress={handleCopyRequestBody} style={styles.miniBtn}>
                  <Text style={styles.miniBtnText}>Copy Body</Text>
                </TouchableOpacity>
              )}
            </View>

            {request.requestBody ? (
              <View style={styles.bodyBox}>
                <JsonViewer data={request.requestBody} initialExpandedDepth={3} />
              </View>
            ) : (
              <Text style={styles.emptyText}>
                No request body sent ({request.method} requests typically have no body)
              </Text>
            )}
          </View>
        )}

        {/* TAB 3: RESPONSE (Headers, Body) */}
        {activeTab === 'response' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Response Headers ({responseHeaderCount})</Text>
            {request.responseHeaders && responseHeaderCount > 0 ? (
              Object.entries(request.responseHeaders).map(([k, v]) => (
                <View key={k} style={styles.headerItem}>
                  <Text style={styles.headerKey}>{k}:</Text>
                  <Text style={styles.headerVal}>{v}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No response headers</Text>
            )}

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Response Body</Text>
              {request.responseBody && (
                <TouchableOpacity onPress={handleCopyResponseBody} style={styles.miniBtn}>
                  <Text style={styles.miniBtnText}>Copy Body</Text>
                </TouchableOpacity>
              )}
            </View>

            {request.responseBody ? (
              <View style={styles.bodyBox}>
                <JsonViewer data={request.responseBody} initialExpandedDepth={2} />
              </View>
            ) : (
              <Text style={styles.emptyText}>
                {request.error ? `Error: ${request.error}` : 'No response body returned'}
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
    flexWrap: 'wrap',
    gap: 8,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  miniBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  miniBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
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
    maxWidth: '65%',
    textAlign: 'right',
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
    paddingVertical: 6,
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
