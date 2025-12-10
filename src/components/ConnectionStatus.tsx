import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';
import { AppEnvironment } from '@/config/environment';

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const isChecking = useRef(false);

  const checkConnection = useCallback(async (signal: AbortSignal) => {
    if (isChecking.current) return;
    isChecking.current = true;

    try {
      const response = await fetch(`${AppEnvironment.API_BASE_URL}/health`, {
        signal,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      setIsConnected(response.ok);
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Connection check failed:', error);
        setIsConnected(false);
      }
    } finally {
      isChecking.current = false;
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const runCheck = async () => {
      await checkConnection(signal);
    };

    (async () => {
      await runCheck();
    })();

    const interval = setInterval(runCheck, 10000); // Check every 10s

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [checkConnection]);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isConnected ? -100 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isConnected, slideAnim]);

  return (
    <Animated.View style={[styles.banner, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.text}>⚠️ No connection to server</Text>
      <Text style={styles.subtext}>Check if backend is running on port 3001</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B6B',
    padding: 12,
    paddingTop: 40,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 14,
  },
  subtext: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.9,
  },
});
