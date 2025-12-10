import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/config/theme';
import { PublicProfile } from '@/types/social';
import { MainTabNavigationProp } from '@/types/navigation';

// Mock data generator
const MOCK_USERS: PublicProfile[] = [
  {
    id: '1',
    username: 'Sarah_Explorer',
    bio: 'Loves hiking and photography 📸',
    isOnline: true,
    interests: ['Hiking', 'Photo', 'Coffee'],
    location: { latitude: 37.78825, longitude: -122.4324 },
  },
  {
    id: '2',
    username: 'Mike_Trader',
    bio: 'Crypto enthusiast and local trader 📈',
    isOnline: false,
    interests: ['Trading', 'Tech', 'Bitcoin'],
    location: { latitude: 37.78925, longitude: -122.4344 },
  },
];

const MapScreen: React.FC = () => {
  const navigation = useNavigation<MainTabNavigationProp<'Map'>>();
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null);
  const [region] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleMarkerPress = (user: PublicProfile) => {
    setSelectedUser(user);
  };

  const handleMessagePress = () => {
    if (selectedUser) {
      setSelectedUser(null);
      navigation.navigate('Social', { screen: 'Chat', params: { userId: selectedUser.id, username: selectedUser.username } });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        customMapStyle={[]} // Add custom dark mode style here if needed
      >
        {MOCK_USERS.map((user) => (
          <Marker
            key={user.id}
            coordinate={user.location}
            onPress={() => handleMarkerPress(user)}
          >
            <View style={[styles.dot, user.isOnline ? styles.onlineDot : styles.offlineDot]}>
              {/* Optional: Add avatar image inside dot */}
            </View>
          </Marker>
        ))}
      </MapView>

      {/* User Profile Preview Modal */}
      {selectedUser && (
        <View style={styles.profileCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={styles.username}>{selectedUser.username}</Text>
              <Text style={styles.status}>
                {selectedUser.isOnline ? '● Online' : '○ Offline'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedUser(null)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.bio}>{selectedUser.bio}</Text>
          
          <View style={styles.interestsContainer}>
            {selectedUser.interests.map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.messageBtn} onPress={handleMessagePress}>
            <Text style={styles.messageBtnText}>Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineDot: {
    backgroundColor: '#4CAF50',
  },
  offlineDot: {
    backgroundColor: '#9E9E9E',
  },
  profileCard: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: COLORS.WHITE,
    borderRadius: 16,
    padding: SPACING.MD,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },
  username: { ...TYPOGRAPHY.H3, color: COLORS.TEXT_PRIMARY },
  status: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_MUTED, marginTop: 2 },
  bio: { ...TYPOGRAPHY.BODY, color: COLORS.TEXT_SECONDARY, marginBottom: SPACING.MD },
  closeBtn: { fontSize: 20, color: COLORS.TEXT_MUTED, padding: 4 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: SPACING.MD },
  interestTag: { backgroundColor: '#F0F0F0', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  interestText: { ...TYPOGRAPHY.CAPTION, color: COLORS.TEXT_SECONDARY },
  messageBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  messageBtnText: { ...TYPOGRAPHY.BUTTON, color: COLORS.WHITE },
});

export default MapScreen;
