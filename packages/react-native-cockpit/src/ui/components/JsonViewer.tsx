import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { safeJsonStringify } from '../../utils/formatters';

interface JsonViewerProps {
  data: any;
  initialExpandedDepth?: number;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, initialExpandedDepth = 2 }) => {
  if (data === undefined || data === null) {
    return <Text style={styles.nullText}>null</Text>;
  }

  if (typeof data !== 'object') {
    return <Text style={styles.primitiveText}>{String(data)}</Text>;
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        <JsonNode
          data={data}
          depth={0}
          initialExpandedDepth={initialExpandedDepth}
          isLast
        />
      </View>
    </ScrollView>
  );
};

interface JsonNodeProps {
  data: any;
  keyName?: string;
  depth: number;
  initialExpandedDepth: number;
  isLast: boolean;
}

const JsonNode: React.FC<JsonNodeProps> = ({
  data,
  keyName,
  depth,
  initialExpandedDepth,
  isLast,
}) => {
  const [isExpanded, setIsExpanded] = useState(depth < initialExpandedDepth);

  const indent = depth * 14;

  if (data === null) {
    return (
      <View style={[styles.row, { paddingLeft: indent }]}>
        {keyName && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.nullText}>null{isLast ? '' : ','}</Text>
      </View>
    );
  }

  const type = typeof data;

  if (type === 'string') {
    return (
      <View style={[styles.row, { paddingLeft: indent }]}>
        {keyName && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.stringText}>"{data}"{isLast ? '' : ','}</Text>
      </View>
    );
  }

  if (type === 'number') {
    return (
      <View style={[styles.row, { paddingLeft: indent }]}>
        {keyName && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.numberText}>{data}{isLast ? '' : ','}</Text>
      </View>
    );
  }

  if (type === 'boolean') {
    return (
      <View style={[styles.row, { paddingLeft: indent }]}>
        {keyName && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.booleanText}>{data ? 'true' : 'false'}{isLast ? '' : ','}</Text>
      </View>
    );
  }

  const isArray = Array.isArray(data);
  const keys = isArray ? data : Object.keys(data);
  const count = isArray ? data.length : keys.length;
  const openBracket = isArray ? '[' : '{';
  const closeBracket = isArray ? ']' : '}';

  if (count === 0) {
    return (
      <View style={[styles.row, { paddingLeft: indent }]}>
        {keyName && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.bracketText}>{openBracket}{closeBracket}{isLast ? '' : ','}</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setIsExpanded(!isExpanded)}
        style={[styles.row, { paddingLeft: indent }]}
      >
        <Text style={styles.toggleIcon}>{isExpanded ? '▼' : '▶'}</Text>
        {keyName && <Text style={styles.key}>"{keyName}": </Text>}
        <Text style={styles.bracketText}>
          {openBracket} {!isExpanded && <Text style={styles.collapsedBadge}>{count} items ... {closeBracket}{isLast ? '' : ','}</Text>}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View>
          {isArray
            ? data.map((item: any, idx: number) => (
                <JsonNode
                  key={idx}
                  data={item}
                  depth={depth + 1}
                  initialExpandedDepth={initialExpandedDepth}
                  isLast={idx === count - 1}
                />
              ))
            : keys.map((k: string, idx: number) => (
                <JsonNode
                  key={k}
                  keyName={k}
                  data={data[k]}
                  depth={depth + 1}
                  initialExpandedDepth={initialExpandedDepth}
                  isLast={idx === count - 1}
                />
              ))}
          <View style={[styles.row, { paddingLeft: indent }]}>
            <Text style={styles.bracketText}>{closeBracket}{isLast ? '' : ','}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 1.5,
  },
  toggleIcon: {
    color: '#94a3b8',
    fontSize: 9,
    marginRight: 4,
    width: 12,
  },
  key: {
    color: '#38bdf8', // cyan
    fontFamily: 'Courier',
    fontSize: 12,
  },
  stringText: {
    color: '#4ade80', // green
    fontFamily: 'Courier',
    fontSize: 12,
  },
  numberText: {
    color: '#fbbf24', // amber
    fontFamily: 'Courier',
    fontSize: 12,
  },
  booleanText: {
    color: '#c084fc', // purple
    fontFamily: 'Courier',
    fontSize: 12,
  },
  nullText: {
    color: '#94a3b8',
    fontStyle: 'italic',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  primitiveText: {
    color: '#f8fafc',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  bracketText: {
    color: '#e2e8f0',
    fontFamily: 'Courier',
    fontSize: 12,
  },
  collapsedBadge: {
    color: '#64748b',
    fontSize: 11,
    fontStyle: 'italic',
  },
});
