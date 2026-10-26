import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { NetworkRequest } from '../../types';
import { cockpitStore } from '../../core/CockpitStore';
import { MethodBadge, StatusBadge } from '../components/Badge';
import { SearchInput } from '../components/SearchInput';
import { formatBytes, formatDuration, formatTime } from '../../utils/formatters';

interface NetworkTabProps {
  requests: NetworkRequest[];
}

type FilterType = 'all' | 'errors' | '2xx' | '4xx' | '5xx';

export const NetworkTab: React.FC<NetworkTabProps> = ({ requests }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Status filter
      if (filter === 'errors') {
        const isErr = (req.status && req.status >= 400) || req.error || req.status === 0;
        if (!isErr) return false;
      } else if (filter === '2xx') {
        if (!req.status || req.status < 200 || req.status >= 300) return false;
      } else if (filter === '4xx') {
        if (!req.status || req.status < 400 || req.status >= 500) return false;
      } else if (filter === '5xx') {
        if (!req.status || req.status < 500) return false;
      }

      // Search query filter
      if (!search.trim()) return true;
      const query = search.toLowerCase();
      return (
        req.url.toLowerCase().includes(query) ||
        req.method.toLowerCase().includes(query) ||
        String(req.status || '').includes(query)
      );
    });
  }, [requests, search, filter]);

  const renderItem = ({ item }: { item: NetworkRequest }) => {
    // Extract pathname / endpoint for better readability
    let displayUrl = item.url;
    try {
      const parsed = new URL(item.url);
      displayUrl = parsed.pathname + (parsed.search || '');
    } catch {
      // keep full url
    }

    return (
      <TouchableOpacity
        onPress={() => cockpitStore.setSelectedRequest(item)}
        style={styles.itemContainer}
      >
        <View style={styles.itemTopRow}>
          <MethodBadge method={item.method} />
          <View style={styles.spacer} />
          <StatusBadge status={item.status} error={item.error} />
          <Text style={styles.timeText}>{formatTime(item.startTime)}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
          <Text style={styles.sizeText}>{formatBytes(item.size)}</Text>
        </View>

        <Text style={styles.urlText} numberOfLines={2}>
          {displayUrl}
        </Text>

        {item.error && (
          <Text style={styles.errorText} numberOfLines={1}>
            ⚠️ {item.error}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Filter requests..."
          />
        </View>
        <TouchableOpacity
          onPress={() => cockpitStore.clearRequests()}
          style={styles.clearBtn}
        >
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.chipRow}>
        {(['all', 'errors', '2xx', '4xx', '5xx'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.chip, filter === f && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No network requests captured</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 8,
    gap: 8,
  },
  clearBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  chipActive: {
    backgroundColor: '#38bdf8',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0f172a',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  itemContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  spacer: {
    width: 6,
  },
  timeText: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 8,
    fontFamily: 'Courier',
  },
  durationText: {
    color: '#94a3b8',
    fontSize: 11,
    marginRight: 6,
  },
  sizeText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  urlText: {
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'Courier',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});
