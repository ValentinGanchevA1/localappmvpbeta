import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AppEnvironment } from '@/config/environment';

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const slideAnim = new Animated.Value(-60);

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000); // Check every 10s

    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${AppEnvironment.API_BASE_URL}/health`, {
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const connected = response.ok;
      setIsConnected(connected);
      setIsChecking(false);

      // Show banner on disconnect
      Animated.timing(slideAnim, {
        toValue: connected ? -60 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      setIsConnected(false);
      setIsChecking(false);

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  if (isChecking || isConnected) {
    return null;
  }

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