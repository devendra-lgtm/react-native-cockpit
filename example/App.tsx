import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Cockpit, StorageAdapter, cockpitStore } from 'react-native-cockpit';

// In-memory demo storage store
const demoStorage: Record<string, string> = {
  auth_token: 'eyJabGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_cockpit_demo_token',
  user_profile: JSON.stringify({
    id: 101,
    name: 'Devendra',
    role: 'Lead Architect',
    preferences: { theme: 'midnight-dark', notifications: true },
  }),
  app_version: '1.0.0-beta',
};

const mockStorageAdapter: StorageAdapter = {
  name: 'DemoStorage',
  getAllKeys: () => Object.keys(demoStorage),
  getItem: (key) => demoStorage[key] ?? null,
  setItem: (key, val) => {
    demoStorage[key] = val;
  },
  removeItem: (key) => {
    delete demoStorage[key];
  },
  clear: () => {
    Object.keys(demoStorage).forEach((k) => delete demoStorage[k]);
  },
};

export default function App() {
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState('Tap any API button below to generate debug data.');

  // 1. GET dummy products list (200 OK)
  const callGetProducts = async () => {
    setLoading(true);
    setLastAction('Requesting GET https://dummyjson.com/products?limit=5 ...');
    try {
      const res = await fetch('https://dummyjson.com/products?limit=5');
      const data = await res.json();
      setLastAction(`GET 200 OK: Loaded ${data.products?.length || 0} products`);
    } catch (err: any) {
      setLastAction(`GET Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. POST auth login with headers and body
  const callPostLogin = async () => {
    setLoading(true);
    setLastAction('Posting auth payload to https://dummyjson.com/auth/login ...');
    try {
      const res = await fetch('https://dummyjson.com/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-App': 'Cockpit-Tester-v1',
          'X-Request-Id': `req_${Date.now()}`,
        },
        body: JSON.stringify({
          username: 'emilys',
          password: 'emilyspass',
          expiresInMins: 30,
        }),
      });
      const data = await res.json();
      setLastAction(`POST Status ${res.status}: Token received for ${data.username || 'user'}`);
    } catch (err: any) {
      setLastAction(`POST Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Delayed API (2.5 second latency test)
  const callDelayedRequest = async () => {
    setLoading(true);
    setLastAction('Calling slow API (2.5s delay test)...');
    try {
      const res = await fetch('https://dummyjson.com/products?delay=2500');
      const data = await res.json();
      setLastAction(`Delayed GET finished with status ${res.status}`);
    } catch (err: any) {
      setLastAction(`Delayed GET Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Trigger 404 Not Found error
  const call404Error = async () => {
    setLoading(true);
    setLastAction('Calling 404 endpoint...');
    try {
      const res = await fetch('https://dummyjson.com/http/404/Not-Found-Demo');
      setLastAction(`Server responded with HTTP ${res.status} Not Found`);
    } catch (err: any) {
      setLastAction(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 5. Trigger 500 Internal Server Error
  const call500Error = async () => {
    setLoading(true);
    setLastAction('Calling 500 endpoint...');
    try {
      const res = await fetch('https://dummyjson.com/http/500/Internal-Server-Error-Demo');
      setLastAction(`Server responded with HTTP ${res.status} Server Error`);
    } catch (err: any) {
      setLastAction(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 6. Test Console logs & errors
  const triggerLogs = () => {
    console.log('App initialization finished', { env: 'staging', bundleId: 'com.example.cockpit' });
    console.info('User session refreshed successfully');
    console.warn('Memory warning: cache size exceeded recommended 50MB threshold');
    console.error(new Error('FatalSyncError: Failed to synchronize offline queue with cloud'));
    setLastAction('Emitted log, info, warn, and error to Console tab!');
  };

  // 7. Add dummy storage key
  const addStorageKey = () => {
    const key = `cart_item_${Math.floor(Math.random() * 100)}`;
    demoStorage[key] = JSON.stringify({
      productId: Math.floor(Math.random() * 1000),
      qty: 2,
      addedAt: new Date().toISOString(),
    });
    setLastAction(`Added "${key}" to DemoStorage`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🕹️</Text>
          <Text style={styles.title}>React Native Cockpit</Text>
          <Text style={styles.subtitle}>Compatible with React Native CLI & Expo</Text>
        </View>

        {/* Live Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTag}>LIVE LOG / FEEDBACK</Text>
            {loading && <ActivityIndicator size="small" color="#38bdf8" />}
          </View>
          <Text style={styles.statusText}>{lastAction}</Text>
        </View>

        {/* Open Cockpit Button */}
        <TouchableOpacity
          style={styles.openCockpitBtn}
          onPress={() => cockpitStore.setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.openCockpitText}>🚀 Open Cockpit Modal Directly</Text>
        </TouchableOpacity>

        {/* Section 1: Dummy Network APIs */}
        <Text style={styles.sectionTitle}>🌐 Dummy Network Calls</Text>
        <View style={styles.btnColumn}>
          <ActionButton
            title="GET /products (200 OK)"
            subtitle="Tests standard JSON payload & header capture"
            color="#0284c7"
            onPress={callGetProducts}
          />
          <ActionButton
            title="POST /auth/login (With Headers & Body)"
            subtitle="Tests POST inspection & 'Copy as cURL'"
            color="#059669"
            onPress={callPostLogin}
          />
          <ActionButton
            title="GET Slow API (2.5s Latency)"
            subtitle="Tests duration / latency timing measurement"
            color="#d97706"
            onPress={callDelayedRequest}
          />
          <ActionButton
            title="GET /404 Not Found"
            subtitle="Increments red error badge on the floating bubble"
            color="#dc2626"
            onPress={call404Error}
          />
          <ActionButton
            title="GET /500 Server Error"
            subtitle="Tests server fault and 5xx badge status"
            color="#991b1b"
            onPress={call500Error}
          />
        </View>

        {/* Section 2: Console & Logs */}
        <Text style={styles.sectionTitle}>📜 Console Logs & Stack Traces</Text>
        <View style={styles.btnColumn}>
          <ActionButton
            title="Emit log, warn, info, and error"
            subtitle="Captures stack trace and highlights errors in red"
            color="#7c3aed"
            onPress={triggerLogs}
          />
        </View>

        {/* Section 3: Storage */}
        <Text style={styles.sectionTitle}>💾 Storage Operations</Text>
        <View style={styles.btnColumn}>
          <ActionButton
            title="Add Random Key to Storage"
            subtitle="Inspect or delete it in the Cockpit Storage tab"
            color="#0891b2"
            onPress={addStorageKey}
          />
        </View>

        {/* Hint banner */}
        <View style={styles.hintBanner}>
          <Text style={styles.hintTitle}>💡 Floating HUD Controller:</Text>
          <Text style={styles.hintBody}>
            Drag the <Text style={{ fontWeight: 'bold', color: '#38bdf8' }}>🕹️ bubble</Text> to any corner of the screen. Notice how it snaps to the edge and shows an error badge counter when 4xx/5xx or errors happen!
          </Text>
        </View>
      </ScrollView>

      {/* The Cockpit In-App Debugger Overlay */}
      <Cockpit
        enabled={true}
        storageAdapters={[mockStorageAdapter]}
      />
    </SafeAreaView>
  );
}

const ActionButton: React.FC<{
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}> = ({ title, subtitle, color, onPress }) => (
  <TouchableOpacity
    style={[styles.actionBtn, { borderLeftColor: color }]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.actionBtnTitle, { color }]}>{title}</Text>
    <Text style={styles.actionBtnSub}>{subtitle}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  content: {
    padding: 16,
    paddingBottom: 90,
  },
  header: {
    alignItems: 'center',
    marginVertical: 18,
  },
  logo: {
    fontSize: 42,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#38bdf8',
    fontWeight: '500',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusTag: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontFamily: 'Courier',
    lineHeight: 18,
  },
  openCockpitBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#38bdf8',
    marginBottom: 18,
  },
  openCockpitText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  btnColumn: {
    gap: 8,
    marginBottom: 14,
  },
  actionBtn: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionBtnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  actionBtnSub: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  hintBanner: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 10,
  },
  hintTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  hintBody: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
});
