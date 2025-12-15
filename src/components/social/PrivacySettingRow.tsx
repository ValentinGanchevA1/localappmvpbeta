// src/components/social/PrivacySettingRow.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ViewStyle,
  StyleProp,
} from 'react-native';
import {COLORS, SPACING, TYPOGRAPHY} from '@/config/theme';
import {PrivacyLevel} from '@/types/socialGraph';

type PrivacySettingType = 'toggle' | 'select' | 'navigation';

interface PrivacyOption {
  value: PrivacyLevel | string;
  label: string;
  description?: string;
}

interface PrivacySettingRowProps {
  icon: string;
  title: string;
  description?: string;
  type: PrivacySettingType;
  value?: boolean | PrivacyLevel | string;
  options?: PrivacyOption[];
  onToggle?: (value: boolean) => void;
  onSelect?: (value: PrivacyLevel | string) => void;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const privacyLevelLabels: Record<PrivacyLevel, string> = {
  everyone: 'Everyone',
  friends: 'Friends',
  friends_of_friends: 'Friends of Friends',
  circles: 'Specific Circles',
  nobody: 'Nobody',
};

export const PrivacySettingRow: React.FC<PrivacySettingRowProps> = ({
  icon,
  title,
  description,
  type,
  value,
  options,
  onToggle,
  onSelect: _onSelect,
  onPress,
  style,
  disabled = false,
}) => {
  const renderControl = () => {
    switch (type) {
      case 'toggle':
        return (
          <Switch
            value={value as boolean}
            onValueChange={onToggle}
            trackColor={{false: '#E5E5E5', true: COLORS.PRIMARY + '50'}}
            thumbColor={value ? COLORS.PRIMARY : '#FFFFFF'}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <TouchableOpacity
            style={styles.selectButton}
            onPress={onPress}
            disabled={disabled}>
            <Text style={styles.selectValue}>
              {typeof value === 'string' && value in privacyLevelLabels
                ? privacyLevelLabels[value as PrivacyLevel]
                : options?.find(o => o.value === value)?.label || value}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );

      case 'navigation':
        return (
          <TouchableOpacity style={styles.navButton} onPress={onPress} disabled={disabled}>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  const Container = type === 'navigation' ? TouchableOpacity : View;
  const containerProps =
    type === 'navigation'
      ? {onPress, activeOpacity: 0.7, disabled}
      : {};

  return (
    <Container
      style={[styles.container, disabled && styles.disabled, style]}
      {...containerProps}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, disabled && styles.disabledText]}>
          {title}
        </Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>

      <View style={styles.control}>{renderControl()}</View>
    </Container>
  );
};

// PrivacySelectModalProps kept for future modal implementation
// interface PrivacySelectModalProps {
//   visible: boolean;
//   title: string;
//   options: PrivacyOption[];
//   selectedValue: PrivacyLevel | string;
//   onSelect: (value: PrivacyLevel | string) => void;
//   onClose: () => void;
// }

export const PrivacySelectOption: React.FC<{
  option: PrivacyOption;
  selected: boolean;
  onSelect: () => void;
}> = ({option, selected, onSelect}) => {
  return (
    <TouchableOpacity
      style={[styles.optionContainer, selected && styles.optionSelected]}
      onPress={onSelect}
      activeOpacity={0.7}>
      <View style={styles.optionContent}>
        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
          {option.label}
        </Text>
        {option.description && (
          <Text style={styles.optionDescription}>{option.description}</Text>
        )}
      </View>
      {selected && <Text style={styles.checkmark}>✓</Text>}
    </TouchableOpacity>
  );
};

interface PrivacySectionProps {
  title: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const PrivacySection: React.FC<PrivacySectionProps> = ({
  title,
  children,
  style,
}) => {
  return (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  icon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    marginRight: SPACING.SM,
  },
  title: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    fontWeight: TYPOGRAPHY.WEIGHTS.MEDIUM,
    color: COLORS.TEXT_PRIMARY,
  },
  disabledText: {
    color: COLORS.TEXT_MUTED,
  },
  description: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  control: {
    alignItems: 'flex-end',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectValue: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
    marginRight: 4,
  },
  chevron: {
    fontSize: 20,
    color: COLORS.TEXT_MUTED,
  },
  navButton: {
    padding: 4,
  },
  section: {
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
  },
  sectionContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginHorizontal: SPACING.MD,
    overflow: 'hidden',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  optionSelected: {
    backgroundColor: '#F0F4FF',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_PRIMARY,
  },
  optionLabelSelected: {
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: COLORS.PRIMARY,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 18,
    color: COLORS.PRIMARY,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
  },
});

export default PrivacySettingRow;
