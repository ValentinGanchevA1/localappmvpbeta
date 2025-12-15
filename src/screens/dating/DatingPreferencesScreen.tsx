// src/screens/dating/DatingPreferencesScreen.tsx
// Dating Preferences Screen - Manage search filters and preferences

import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import Slider from '@react-native-community/slider';
import {useAppDispatch, useAppSelector} from '@/store/hooks';
import {
  fetchPreferences,
  updatePreferences,
  setPreferences,
  selectPreferences,
} from '@/store/slices/datingSlice';
import {
  DatingPreferences,
  GenderPreference,
  RelationshipGoal,
  EducationLevel,
  DrinkingHabit,
  SmokingHabit,
} from '@/types/dating';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';

// ============================================
// Types
// ============================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

interface RowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
}

interface ChipSelectorProps {
  options: {value: string; label: string}[];
  selected: string[];
  onSelect: (values: string[]) => void;
  multiSelect?: boolean;
}

// ============================================
// Section Component
// ============================================

const Section: React.FC<SectionProps> = ({title, children}) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

// ============================================
// Row Component
// ============================================

const SettingsRow: React.FC<RowProps> = ({label, value, onPress, rightElement}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress && !rightElement}>
    <Text style={styles.rowLabel}>{label}</Text>
    {rightElement || (value && <Text style={styles.rowValue}>{value}</Text>)}
  </TouchableOpacity>
);

// ============================================
// Chip Selector Component
// ============================================

const ChipSelector: React.FC<ChipSelectorProps> = ({
  options,
  selected,
  onSelect,
  multiSelect = true,
}) => {
  const handleSelect = (value: string) => {
    if (multiSelect) {
      if (selected.includes(value)) {
        onSelect(selected.filter(v => v !== value));
      } else {
        onSelect([...selected, value]);
      }
    } else {
      onSelect([value]);
    }
  };

  return (
    <View style={styles.chipContainer}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.chip,
            selected.includes(option.value) && styles.chipSelected,
          ]}
          onPress={() => handleSelect(option.value)}>
          <Text
            style={[
              styles.chipText,
              selected.includes(option.value) && styles.chipTextSelected,
            ]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ============================================
// Main Screen Component
// ============================================

export const DatingPreferencesScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const preferences = useAppSelector(selectPreferences);
  const {preferencesLoading} = useAppSelector(state => state.dating);

  // Local state for editing
  const [localPrefs, setLocalPrefs] = useState<DatingPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state with redux
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Load preferences on mount
  useEffect(() => {
    dispatch(fetchPreferences());
  }, [dispatch]);

  // Update local state
  const updateLocal = useCallback(
    (updates: Partial<DatingPreferences>) => {
      setLocalPrefs(prev => ({...prev, ...updates}));
      setHasChanges(true);
    },
    []
  );

  // Save changes
  const handleSave = useCallback(async () => {
    try {
      await dispatch(updatePreferences(localPrefs)).unwrap();
      setHasChanges(false);
      Alert.alert('Saved', 'Your preferences have been updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to save preferences');
    }
  }, [dispatch, localPrefs]);

  // Reset to defaults
  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Preferences',
      'Are you sure you want to reset all preferences to defaults?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            const defaults: Partial<DatingPreferences> = {
              ageRange: {min: 18, max: 50},
              maxDistance: 50,
              genderPreference: 'everyone',
              relationshipGoals: ['long_term', 'short_term', 'casual'],
              showOnlyVerified: false,
              showOnlyWithBio: false,
              showOnlyWithPhotos: true,
              showOnlyActive: false,
              prioritizeSharedInterests: true,
              hideAge: false,
              hideDistance: false,
              incognitoMode: false,
            };
            setLocalPrefs(prev => ({...prev, ...defaults}));
            setHasChanges(true);
          },
        },
      ]
    );
  }, []);

  // Options data
  const genderOptions = [
    {value: 'male', label: 'Men'},
    {value: 'female', label: 'Women'},
    {value: 'everyone', label: 'Everyone'},
  ];

  const goalOptions: {value: RelationshipGoal; label: string}[] = [
    {value: 'long_term', label: 'Long-term'},
    {value: 'short_term', label: 'Short-term'},
    {value: 'casual', label: 'Casual'},
    {value: 'friendship', label: 'Friends'},
    {value: 'not_sure', label: 'Not sure'},
  ];

  const educationOptions: {value: EducationLevel; label: string}[] = [
    {value: 'high_school', label: 'High School'},
    {value: 'some_college', label: 'Some College'},
    {value: 'bachelors', label: 'Bachelors'},
    {value: 'masters', label: 'Masters'},
    {value: 'doctorate', label: 'Doctorate'},
    {value: 'trade_school', label: 'Trade School'},
  ];

  const drinkingOptions: {value: DrinkingHabit; label: string}[] = [
    {value: 'never', label: 'Never'},
    {value: 'rarely', label: 'Rarely'},
    {value: 'socially', label: 'Socially'},
    {value: 'regularly', label: 'Regularly'},
  ];

  const smokingOptions: {value: SmokingHabit; label: string}[] = [
    {value: 'never', label: 'Non-smoker'},
    {value: 'sometimes', label: 'Sometimes'},
    {value: 'regularly', label: 'Smoker'},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <TouchableOpacity onPress={handleReset}>
          <Text style={styles.resetButton}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Basic Preferences */}
        <Section title="Who do you want to see?">
          <ChipSelector
            options={genderOptions}
            selected={[localPrefs.genderPreference]}
            onSelect={values =>
              updateLocal({genderPreference: values[0] as GenderPreference})
            }
            multiSelect={false}
          />
        </Section>

        {/* Age Range */}
        <Section title="Age Range">
          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>
              {localPrefs.ageRange.min} - {localPrefs.ageRange.max} years
            </Text>

            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Min: {localPrefs.ageRange.min}</Text>
              <Slider
                style={styles.slider}
                minimumValue={18}
                maximumValue={localPrefs.ageRange.max - 1}
                step={1}
                value={localPrefs.ageRange.min}
                onValueChange={value =>
                  updateLocal({
                    ageRange: {...localPrefs.ageRange, min: Math.floor(value)},
                  })
                }
                minimumTrackTintColor={COLORS.PRIMARY}
                maximumTrackTintColor={COLORS.GRAY_300}
                thumbTintColor={COLORS.PRIMARY}
              />
            </View>

            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>Max: {localPrefs.ageRange.max}</Text>
              <Slider
                style={styles.slider}
                minimumValue={localPrefs.ageRange.min + 1}
                maximumValue={100}
                step={1}
                value={localPrefs.ageRange.max}
                onValueChange={value =>
                  updateLocal({
                    ageRange: {...localPrefs.ageRange, max: Math.floor(value)},
                  })
                }
                minimumTrackTintColor={COLORS.PRIMARY}
                maximumTrackTintColor={COLORS.GRAY_300}
                thumbTintColor={COLORS.PRIMARY}
              />
            </View>
          </View>
        </Section>

        {/* Distance */}
        <Section title="Maximum Distance">
          <View style={styles.rangeContainer}>
            <Text style={styles.rangeLabel}>
              {localPrefs.maxDistance} km
            </Text>
            <Slider
              style={styles.sliderFull}
              minimumValue={1}
              maximumValue={200}
              step={1}
              value={localPrefs.maxDistance}
              onValueChange={value =>
                updateLocal({maxDistance: Math.floor(value)})
              }
              minimumTrackTintColor={COLORS.PRIMARY}
              maximumTrackTintColor={COLORS.GRAY_300}
              thumbTintColor={COLORS.PRIMARY}
            />
            <View style={styles.distanceLabels}>
              <Text style={styles.distanceLabel}>1 km</Text>
              <Text style={styles.distanceLabel}>200 km</Text>
            </View>
          </View>
        </Section>

        {/* Relationship Goals */}
        <Section title="Looking For">
          <ChipSelector
            options={goalOptions}
            selected={localPrefs.relationshipGoals}
            onSelect={values =>
              updateLocal({relationshipGoals: values as RelationshipGoal[]})
            }
          />
        </Section>

        {/* Advanced Filters */}
        <Section title="Advanced Filters">
          <Text style={styles.filterLabel}>Education</Text>
          <ChipSelector
            options={educationOptions}
            selected={localPrefs.educationLevels || []}
            onSelect={values =>
              updateLocal({educationLevels: values as EducationLevel[]})
            }
          />

          <Text style={[styles.filterLabel, {marginTop: SPACING.MD}]}>
            Drinking
          </Text>
          <ChipSelector
            options={drinkingOptions}
            selected={localPrefs.drinking || []}
            onSelect={values =>
              updateLocal({drinking: values as DrinkingHabit[]})
            }
          />

          <Text style={[styles.filterLabel, {marginTop: SPACING.MD}]}>
            Smoking
          </Text>
          <ChipSelector
            options={smokingOptions}
            selected={localPrefs.smoking || []}
            onSelect={values =>
              updateLocal({smoking: values as SmokingHabit[]})
            }
          />
        </Section>

        {/* Discovery Settings */}
        <Section title="Discovery Settings">
          <SettingsRow
            label="Only show verified profiles"
            rightElement={
              <Switch
                value={localPrefs.showOnlyVerified}
                onValueChange={value =>
                  updateLocal({showOnlyVerified: value})
                }
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <SettingsRow
            label="Only show profiles with bio"
            rightElement={
              <Switch
                value={localPrefs.showOnlyWithBio}
                onValueChange={value => updateLocal({showOnlyWithBio: value})}
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <SettingsRow
            label="Only show profiles with photos"
            rightElement={
              <Switch
                value={localPrefs.showOnlyWithPhotos}
                onValueChange={value =>
                  updateLocal({showOnlyWithPhotos: value})
                }
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <SettingsRow
            label="Only show recently active"
            rightElement={
              <Switch
                value={localPrefs.showOnlyActive}
                onValueChange={value => updateLocal({showOnlyActive: value})}
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <SettingsRow
            label="Prioritize shared interests"
            rightElement={
              <Switch
                value={localPrefs.prioritizeSharedInterests}
                onValueChange={value =>
                  updateLocal({prioritizeSharedInterests: value})
                }
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
        </Section>

        {/* Privacy Settings */}
        <Section title="Privacy">
          <SettingsRow
            label="Hide my age"
            rightElement={
              <Switch
                value={localPrefs.hideAge}
                onValueChange={value => updateLocal({hideAge: value})}
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <SettingsRow
            label="Hide my distance"
            rightElement={
              <Switch
                value={localPrefs.hideDistance}
                onValueChange={value => updateLocal({hideDistance: value})}
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <SettingsRow
            label="Incognito Mode"
            rightElement={
              <Switch
                value={localPrefs.incognitoMode}
                onValueChange={value => updateLocal({incognitoMode: value})}
                trackColor={{false: COLORS.GRAY_300, true: COLORS.PRIMARY}}
              />
            }
          />
          <Text style={styles.privacyNote}>
            Incognito Mode: Only people you like can see your profile
          </Text>
        </Section>

        {/* Spacer for save button */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.saveContainer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={preferencesLoading}>
            <Text style={styles.saveButtonText}>
              {preferencesLoading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

// ============================================
// Styles
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_200,
  },
  backButton: {
    fontSize: 16,
    color: COLORS.PRIMARY,
  },
  headerTitle: {
    ...TYPOGRAPHY.H2,
    color: COLORS.GRAY_900,
  },
  resetButton: {
    fontSize: 14,
    color: COLORS.GRAY_500,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: SPACING.MD,
  },

  // Section
  section: {
    backgroundColor: COLORS.WHITE,
    marginBottom: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.MD,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.GRAY_500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.MD,
  },
  sectionContent: {},

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_100,
  },
  rowLabel: {
    fontSize: 16,
    color: COLORS.GRAY_900,
  },
  rowValue: {
    fontSize: 16,
    color: COLORS.GRAY_500,
  },

  // Chip Selector
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.GRAY_100,
    borderWidth: 1,
    borderColor: COLORS.GRAY_200,
  },
  chipSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.GRAY_700,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.WHITE,
  },

  // Range/Slider
  rangeContainer: {
    paddingVertical: SPACING.SM,
  },
  rangeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.GRAY_900,
    textAlign: 'center',
    marginBottom: SPACING.MD,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  sliderLabel: {
    width: 70,
    fontSize: 14,
    color: COLORS.GRAY_600,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderFull: {
    width: '100%',
    height: 40,
  },
  distanceLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.SM,
  },
  distanceLabel: {
    fontSize: 12,
    color: COLORS.GRAY_500,
  },

  // Filter labels
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.GRAY_700,
    marginBottom: SPACING.SM,
  },

  // Privacy note
  privacyNote: {
    fontSize: 12,
    color: COLORS.GRAY_500,
    fontStyle: 'italic',
    marginTop: SPACING.SM,
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_100,
  },

  // Save button
  saveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_200,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: SPACING.MD,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DatingPreferencesScreen;
