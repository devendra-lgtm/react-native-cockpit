import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StorageItem } from '../../types';
import { StorageManager } from '../../core/StorageManager';
import { SearchInput } from '../components/SearchInput';
import { JsonViewer } from '../components/JsonViewer';

export const StorageTab: React.FC = () => {
  const adapters = StorageManager.getAdapters();
  const [selectedAdapterName, setSelectedAdapterName] = useState<string>(
    adapters[0]?.name || ''
  );
  const [items, setItems] = useState<StorageItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const loadItems = useCallback(async (adapterName: string) => {
    if (!adapterName) return;
    setIsLoading(true);
    try {
      const data = await StorageManager.getItems(adapterName);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adapters.length > 0 && !selectedAdapterName) {
      setSelectedAdapterName(adapters[0].name);
    }
  }, [adapters, selectedAdapterName]);

  useEffect(() => {
    if (selectedAdapterName) {
      loadItems(selectedAdapterName);
    }
  }, [selectedAdapterName, loadItems]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDeleteItem = (key: string) => {
    Alert.alert('Delete Key', `Are you sure you want to delete "${key}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await StorageManager.removeItem(selectedAdapterName, key);
          loadItems(selectedAdapterName);
        },
      },
    ]);
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear Storage',
      `Are you sure you want to clear ALL data in ${selectedAdapterName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await StorageManager.clear(selectedAdapterName);
            loadItems(selectedAdapterName);
          },
        },
      ]
    );
  };

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return item.key.toLowerCase().includes(q) || (item.value && item.value.toLowerCase().includes(q));
  });

  if (adapters.length === 0) {
    return (
      <View style={styles.noAdapterContainer}>
        <Text style={styles.noAdapterTitle}>No Storage Adapter Registered</Text>
        <Text style={styles.noAdapterSub}>
          Register AsyncStorage or MMKV using:
        </Text>
        <View style={styles.codeSnippet}>
          <Text style={styles.codeText}>
            {`import AsyncStorage from '@react-native-async-storage/async-storage';\nStorageManager.registerAdapter(\n  StorageManager.createAsyncStorageAdapter(AsyncStorage)\n);`}
          </Text>
        </View>
      </View>
    );
  }

  const renderItem = ({ item }: { item: StorageItem }) => {
    const isExpanded = expandedKeys.has(item.key);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemHeader}>
          <TouchableOpacity onPress={() => toggleExpand(item.key)} style={styles.keyRow}>
            <Text style={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</Text>
            <Text style={styles.itemKey} numberOfLines={1}>
              {item.key}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteItem(item.key)} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {isExpanded && (
          <View style={styles.itemBody}>
            {item.parsedJson ? (
              <JsonViewer data={item.parsedJson} initialExpandedDepth={2} />
            ) : (
              <Text style={styles.rawValText} selectable>
                {item.value ?? 'null'}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Adapter selector tabs if multiple */}
      {adapters.length > 1 && (
        <View style={styles.adapterTabs}>
          {adapters.map((a) => (
            <TouchableOpacity
              key={a.name}
              onPress={() => setSelectedAdapterName(a.name)}
              style={[
                styles.adapterTab,
                selectedAdapterName === a.name && styles.adapterTabActive,
              ]}
            >
              <Text
                style={[
                  styles.adapterTabText,
                  selectedAdapterName === a.name && styles.adapterTabTextActive,
                ]}
              >
                {a.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search keys or values..."
          />
        </View>
        <TouchableOpacity
          onPress={() => loadItems(selectedAdapterName)}
          style={styles.actionBtn}
        >
          <Text style={styles.actionBtnText}>🔄</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleClearAll} style={[styles.actionBtn, styles.dangerBtn]}>
          <Text style={styles.actionBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#38bdf8" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Storage is empty</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  adapterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  adapterTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  adapterTabActive: {
    backgroundColor: '#38bdf8',
  },
  adapterTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  adapterTabTextActive: {
    color: '#0f172a',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  actionBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerBtn: {
    backgroundColor: '#7f1d1d',
  },
  actionBtnText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  itemCard: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleIcon: {
    color: '#94a3b8',
    fontSize: 10,
    marginRight: 8,
  },
  itemKey: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Courier',
    flex: 1,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    fontSize: 14,
  },
  itemBody: {
    backgroundColor: '#020617',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  rawValText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'Courier',
  },
  loadingContainer: {
    paddingTop: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  noAdapterContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAdapterTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noAdapterSub: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeSnippet: {
    backgroundColor: '#020617',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  codeText: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'Courier',
  },
});
