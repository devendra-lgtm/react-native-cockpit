import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ConsoleLog, LogLevel } from '../../types';
import { cockpitStore } from '../../core/CockpitStore';
import { LogBadge } from '../components/Badge';
import { SearchInput } from '../components/SearchInput';
import { formatTime, safeJsonStringify } from '../../utils/formatters';
import { JsonViewer } from '../components/JsonViewer';

interface LogsTabProps {
  logs: ConsoleLog[];
}

type LogFilter = 'all' | 'log' | 'info' | 'warn' | 'error';

export const LogsTab: React.FC<LogsTabProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogFilter>('all');
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedLogIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'all' && log.level !== levelFilter) return false;
      if (!search.trim()) return true;

      const q = search.toLowerCase();
      const messageText = log.messages
        .map((m) => (typeof m === 'object' ? safeJsonStringify(m) : String(m)))
        .join(' ')
        .toLowerCase();

      return messageText.includes(q) || (log.stack && log.stack.toLowerCase().includes(q));
    });
  }, [logs, search, levelFilter]);

  const renderLogItem = ({ item }: { item: ConsoleLog }) => {
    const isExpanded = expandedLogIds.has(item.id);

    return (
      <View style={styles.logItem}>
        <View style={styles.logHeader}>
          <LogBadge level={item.level} />
          <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          <View style={{ flex: 1 }} />
          {item.stack && (
            <TouchableOpacity onPress={() => toggleExpand(item.id)} style={styles.traceBtn}>
              <Text style={styles.traceBtnText}>{isExpanded ? 'Hide Trace' : 'Show Trace'}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.messageBox}>
          {item.messages.map((msg, idx) => {
            if (typeof msg === 'object' && msg !== null) {
              return <JsonViewer key={idx} data={msg} initialExpandedDepth={1} />;
            }
            return (
              <Text key={idx} style={[styles.messageText, item.level === 'error' && styles.errorText]} selectable>
                {String(msg)}
              </Text>
            );
          })}
        </View>

        {isExpanded && item.stack && (
          <View style={styles.stackBox}>
            <Text style={styles.stackText} selectable>
              {item.stack}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <SearchInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search logs..."
          />
        </View>
        <TouchableOpacity
          onPress={() => cockpitStore.clearLogs()}
          style={styles.clearBtn}
        >
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {(['all', 'log', 'info', 'warn', 'error'] as LogFilter[]).map((lvl) => (
          <TouchableOpacity
            key={lvl}
            onPress={() => setLevelFilter(lvl)}
            style={[styles.chip, levelFilter === lvl && styles.chipActive]}
          >
            <Text style={[styles.chipText, levelFilter === lvl && styles.chipTextActive]}>
              {lvl.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredLogs}
        keyExtractor={(item) => item.id}
        renderItem={renderLogItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No logs captured</Text>
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
  logItem: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timestamp: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 8,
    fontFamily: 'Courier',
  },
  traceBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  traceBtnText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  messageBox: {
    marginTop: 2,
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 12,
    fontFamily: 'Courier',
    lineHeight: 16,
  },
  errorText: {
    color: '#fca5a5',
  },
  stackBox: {
    backgroundColor: '#020617',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#ef4444',
  },
  stackText: {
    color: '#f87171',
    fontSize: 10,
    fontFamily: 'Courier',
    lineHeight: 14,
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
