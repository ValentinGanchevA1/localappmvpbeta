
import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocation } from '@/hooks/useLocation';
import { useAppDispatch } from '@/store/hooks';
import { updateRegion } from '@/store/slices/locationSlice';
import Icon from 'react-native-vector-icons/Ionicons';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';

// 1. Define a fallback location (e.g., San Francisco or your target city)
// This prevents the app from breaking if GPS is slow/unavailable.
const DEFAULT_LOCATION = {
  latitude: 37.78825,
  longitude: -122.4324,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const MapScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const { latitude, longitude, nearbyUsers, loading, region } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [isMapCentered, setIsMapCentered] = useState(true);

  const handleRegionChange = useCallback(
    (newRegion: Region) => {
      dispatch(updateRegion(newRegion));
      setIsMapCentered(false);
    },
    [dispatch]
  );

  const centerOnUser = useCallback(() => {
    // 2. Only animate if we actually have user coordinates
    if (latitude && longitude && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        1000
      );
      setIsMapCentered(true);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    // 3. Only auto-center if coordinates exist
    if (isMapCentered && latitude && longitude && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        },
        500
      );
    }
  }, [latitude, longitude, isMapCentered]);

  // 4. MODIFIED: Only block rendering if we are genuinely loading
  // AND we have absolutely no location data yet.
  // If loading is false but lat/long are null, we fall through to the map with default coords.
  if (loading && (!latitude || !longitude)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // 5. Use real location if available, otherwise use Default
  const currentLatitude = latitude ?? DEFAULT_LOCATION.latitude;
  const currentLongitude = longitude ?? DEFAULT_LOCATION.longitude;

  const initialRegion = region ?? {
    latitude: currentLatitude,
    longitude: currentLongitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={!!(latitude && longitude)} // Only show blue dot if we have coords
        showsMyLocationButton={false}
        zoomEnabled
        scrollEnabled
        rotateEnabled
      >
        {nearbyUsers.map((user) => (
          <Marker
            key={user.id}
            coordinate={{
              latitude: user.latitude,
              longitude: user.longitude,
            }}
            title={user.name ?? 'Unknown User'}
            description={`${user.distance ? Math.round(user.distance) : '?'}m away`}
            pinColor="#FF6B6B"
          />
        ))}
      </MapView>

      <TouchableOpacity
        style={[
          styles.centerButton,
          !isMapCentered && styles.recenterButtonActive,
          // Optional: Dim button if no location data
          (!latitude || !longitude) && { opacity: 0.5 }
        ]}
        onPress={centerOnUser}
        disabled={!latitude || !longitude}
      >
        <Icon
          name={isMapCentered ? 'locate' : 'locate-outline'}
          size={24}
          color={COLORS.WHITE}
        />
      </TouchableOpacity>

      {nearbyUsers.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {nearbyUsers.length} user{nearbyUsers.length === 1 ? '' : 's'} nearby
          </Text>
        </View>
      )}

      {__DEV__ && (
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>
            Lat: {latitude?.toFixed(4) ?? 'null'}
          </Text>
          <Text style={styles.debugText}>
            Lon: {longitude?.toFixed(4) ?? 'null'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
  },
  loadingText: {
    marginTop: SPACING.SM,
    color: '#666',
    fontSize: TYPOGRAPHY.SIZES.MD,
  },
  centerButton: {
    position: 'absolute',
    right: SPACING.MD,
    bottom: SPACING.MD + 60,
    backgroundColor: COLORS.PRIMARY,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recenterButtonActive: {
    backgroundColor: '#FF9500',
  },
  statsContainer: {
    position: 'absolute',
    top: SPACING.MD,
    left: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statsText: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.PRIMARY,
  },
  debugInfo: {
    position: 'absolute',
    bottom: SPACING.MD,
    left: SPACING.MD,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.SM,
    borderRadius: 4,
  },
  debugText: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});

export default MapScreen;
