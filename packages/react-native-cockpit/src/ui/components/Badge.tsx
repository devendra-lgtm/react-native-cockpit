import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MethodBadgeProps {
  method: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const m = method.toUpperCase();
  let bg = '#3b82f6'; // GET (blue)
  if (m === 'POST') bg = '#10b981'; // green
  else if (m === 'PUT' || m === 'PATCH') bg = '#f59e0b'; // amber
  else if (m === 'DELETE') bg = '#ef4444'; // red
  else if (m === 'HEAD' || m === 'OPTIONS') bg = '#8b5cf6'; // purple

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{m}</Text>
    </View>
  );
};

interface StatusBadgeProps {
  status?: number;
  error?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, error }) => {
  if (error || status === 0 || !status) {
    return (
      <View style={[styles.badge, { backgroundColor: '#ef4444' }]}>
        <Text style={styles.badgeText}>{status === 0 || !status ? 'ERR' : String(status)}</Text>
      </View>
    );
  }

  let bg = '#10b981'; // 2xx
  if (status >= 300 && status < 400) bg = '#06b6d4'; // 3xx
  else if (status >= 400 && status < 500) bg = '#f59e0b'; // 4xx
  else if (status >= 500) bg = '#ef4444'; // 5xx

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{status}</Text>
    </View>
  );
};

interface LogBadgeProps {
  level: string;
}

export const LogBadge: React.FC<LogBadgeProps> = ({ level }) => {
  let bg = '#6b7280';
  if (level === 'info') bg = '#3b82f6';
  else if (level === 'warn') bg = '#f59e0b';
  else if (level === 'error') bg = '#ef4444';
  else if (level === 'debug') bg = '#8b5cf6';

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={styles.badgeText}>{level.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
