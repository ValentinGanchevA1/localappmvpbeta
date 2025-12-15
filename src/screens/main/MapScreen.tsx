
import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocation } from '@/hooks/useLocation';
import { useAppDispatch } from '@/store/hooks';
import { updateRegion } from '@/store/slices/locationSlice';
import { useNavigation } from '@react-navigation/native';
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

const { width } = Dimensions.get('window');

const MapScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { latitude, longitude, nearbyUsers, loading, region } = useLocation();
  const mapRef = useRef<MapView>(null);
  const [isMapCentered, setIsMapCentered] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

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

  const handleUserPress = (user: any) => {
    setSelectedUser(user);
    setIsMapCentered(false);
    // Optional: Animate map to center slightly above the user to make room for the card
    mapRef.current?.animateToRegion({
      latitude: user.latitude - 0.002, // Offset to show marker above card
      longitude: user.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleMapPress = () => {
    setSelectedUser(null);
  };

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
        onPress={handleMapPress}
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
            onPress={(e) => {
              e.stopPropagation();
              handleUserPress(user);
            }}
          >
            <View style={styles.markerContainer}>
              <View style={[styles.avatarBorder, selectedUser?.id === user.id && styles.selectedAvatarBorder]}>
                <Image source={{ uri: user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random` }} style={styles.markerImage} />
                {user.isOnline && <View style={styles.onlineBadge} />}
              </View>
              <View style={styles.markerArrow} />
            </View>
          </Marker>
        ))}
      </MapView>

      <TouchableOpacity
        style={[
          styles.centerButton,
          !isMapCentered && styles.recenterButtonActive,
          // Optional: Dim button if no location data
          (!latitude || !longitude) && styles.disabledButton,
          selectedUser && styles.centerButtonShifted // Move up when card is visible
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

      {nearbyUsers.length > 0 && !selectedUser && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {nearbyUsers.length} user{nearbyUsers.length === 1 ? '' : 's'} nearby
          </Text>
        </View>
      )}

      {/* Interactive User Card */}
      {selectedUser && (
        <View style={styles.userCard}>
          <View style={styles.cardHeader}>
            <Image 
              source={{ uri: selectedUser.avatar || `https://ui-avatars.com/api/?name=${selectedUser.name}&background=random` }} 
              style={styles.cardAvatar} 
            />
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{selectedUser.name}</Text>
              <Text style={styles.cardDistance}>
                {selectedUser.distance ? `${Math.round(selectedUser.distance)}m away` : 'Nearby'} • {selectedUser.isOnline ? 'Online' : 'Offline'}
              </Text>
              {selectedUser.bio && <Text style={styles.cardBio} numberOfLines={1}>{selectedUser.bio}</Text>}
            </View>
            <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeButton}>
              <Icon name="close" size={20} color={COLORS.TEXT_MUTED} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.actionBtn, styles.chatBtn]} onPress={() => navigation.navigate('Social', { screen: 'Chat', params: { userId: selectedUser.id, username: selectedUser.name } })}>
              <Icon name="chatbubble-ellipses" size={20} color={COLORS.WHITE} />
              <Text style={styles.actionBtnText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.tradeBtn]} onPress={() => navigation.navigate('Trading', { screen: 'CreateTrade', params: { recipientId: selectedUser.id } })}>
              <Icon name="swap-horizontal" size={20} color={COLORS.PRIMARY} />
              <Text style={[styles.actionBtnText, styles.tradeBtnText]}>Trade</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.profileBtn]} onPress={() => navigation.navigate('Social', { screen: 'UserProfile', params: { userId: selectedUser.id } } as any)}>
              <Icon name="person" size={20} color={COLORS.TEXT_PRIMARY} />
              <Text style={[styles.actionBtnText, styles.profileBtnText]}>Profile</Text>
            </TouchableOpacity>
          </View>
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
  centerButtonShifted: {
    bottom: SPACING.MD + 200, // Shift up when card is visible
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
  disabledButton: {
    opacity: 0.5,
  },
  // Marker Styles
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBorder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.WHITE,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  selectedAvatarBorder: {
    borderColor: COLORS.PRIMARY,
    transform: [{ scale: 1.1 }],
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.SUCCESS,
    borderWidth: 2,
    borderColor: COLORS.WHITE,
  },
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.WHITE,
    marginTop: -1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  // User Card Styles
  userCard: {
    position: 'absolute',
    bottom: SPACING.MD + 20, // Above tab bar
    left: SPACING.MD,
    right: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MD,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.MD },
  cardAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: SPACING.MD },
  cardInfo: { flex: 1 },
  cardName: { ...TYPOGRAPHY.H3, color: COLORS.TEXT_PRIMARY },
  cardDistance: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_MUTED, marginTop: 2 },
  cardBio: { ...TYPOGRAPHY.BODY, fontSize: 14, color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  closeButton: { padding: 4 },
  actionButtons: { flexDirection: 'row', gap: SPACING.SM },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  chatBtn: { backgroundColor: COLORS.PRIMARY },
  tradeBtn: { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  profileBtn: { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  actionBtnText: { ...TYPOGRAPHY.BUTTON, color: COLORS.WHITE, marginLeft: 6 },
  tradeBtnText: { color: COLORS.PRIMARY },
  profileBtnText: { color: COLORS.TEXT_PRIMARY },
});

export default MapScreen;
