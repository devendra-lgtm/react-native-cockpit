import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { cockpitStore } from '../core/CockpitStore';

const BUBBLE_SIZE = 52;
const SNAP_PADDING = 12;

interface FloatingBubbleProps {
  initialPosition?: { x: number; y: number };
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({ initialPosition }) => {
  const [errorCount, setErrorCount] = useState(cockpitStore.errorCount);
  const window = Dimensions.get('window');

  const defaultX = initialPosition?.x ?? window.width - BUBBLE_SIZE - SNAP_PADDING;
  const defaultY = initialPosition?.y ?? window.height / 2 - BUBBLE_SIZE / 2;

  const pan = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current;
  const isDragging = useRef(false);

  useEffect(() => {
    const unsubscribe = cockpitStore.subscribe(() => {
      setErrorCount(cockpitStore.errorCount);
    });
    return unsubscribe;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderGrant: () => {
        isDragging.current = false;
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_e, gestureState) => {
        isDragging.current = true;
        pan.setValue({ x: gestureState.dx, y: gestureState.dy });
      },
      onPanResponderRelease: (_e, gestureState) => {
        pan.flattenOffset();

        const currentX = (pan.x as any)._value;
        const currentY = (pan.y as any)._value;
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;

        // Snap to closest edge (left or right)
        const targetX =
          currentX + BUBBLE_SIZE / 2 < screenWidth / 2
            ? SNAP_PADDING
            : screenWidth - BUBBLE_SIZE - SNAP_PADDING;

        // Clamp Y inside screen
        const clampedY = Math.max(
          40,
          Math.min(screenHeight - BUBBLE_SIZE - 40, currentY)
        );

        Animated.spring(pan, {
          toValue: { x: targetX, y: clampedY },
          useNativeDriver: false,
          friction: 6,
          tension: 40,
        }).start();

        // If tap (not a drag), open modal
        if (!isDragging.current || (Math.abs(gestureState.dx) < 4 && Math.abs(gestureState.dy) < 4)) {
          cockpitStore.setModalVisible(true);
        }
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => cockpitStore.setModalVisible(true)}
        style={styles.bubble}
      >
        <Text style={styles.icon}>🕹️</Text>
        {errorCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {errorCount > 99 ? '99+' : errorCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 999999,
  },
  bubble: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: '#0f172a',
    borderWidth: 2,
    borderColor: '#38bdf8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  icon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
