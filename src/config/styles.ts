// src/config/styles.ts
// Centralized reusable styles for consistent UI across the app
import { StyleSheet, Platform } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

// Common layout styles
export const layoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
  },
  containerWhite: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.LG,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    marginBottom: SPACING.LG,
  },
});

// Text styles
export const textStyles = StyleSheet.create({
  title: {
    fontSize: TYPOGRAPHY.SIZES.LG + 14,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
    color: COLORS.BLACK,
    marginBottom: SPACING.SM,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.TEXT_MUTED,
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.SIZES.LG + 6,
    fontWeight: TYPOGRAPHY.WEIGHTS.BOLD,
    color: COLORS.BLACK,
    marginBottom: SPACING.MD,
  },
  body: {
    fontSize: TYPOGRAPHY.SIZES.MD,
    color: COLORS.BLACK,
  },
  bodySecondary: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.TEXT_SECONDARY,
  },
  caption: {
    fontSize: 12,
    color: COLORS.TEXT_MUTED,
  },
  error: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: COLORS.DANGER,
    marginTop: SPACING.SM,
  },
  hint: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#999',
    marginTop: -SPACING.SM,
    marginBottom: SPACING.MD,
    marginLeft: SPACING.SM,
  },
});

// Card styles
export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.BLACK,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
});

// Form styles
export const formStyles = StyleSheet.create({
  form: {
    marginBottom: SPACING.LG,
  },
  inputContainer: {
    marginBottom: SPACING.MD,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.DANGER,
  },
});

// Button container styles
export const buttonStyles = StyleSheet.create({
  buttonMarginTop: {
    marginTop: SPACING.MD,
  },
  buttonMarginTopSmall: {
    marginTop: SPACING.SM,
  },
});

// List styles
export const listStyles = StyleSheet.create({
  listContent: {
    padding: SPACING.MD,
  },
  listContentWithFab: {
    padding: SPACING.MD,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.SIZES.LG,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    color: '#666',
    marginTop: SPACING.MD,
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.SIZES.SM,
    color: '#999',
    marginTop: SPACING.SM,
    textAlign: 'center',
  },
});

// FAB (Floating Action Button) styles
export const fabStyles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: SPACING.MD,
    bottom: SPACING.MD,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.BLACK,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

// Badge styles
export const badgeStyles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: COLORS.WHITE,
    fontSize: 12,
    fontWeight: TYPOGRAPHY.WEIGHTS.SEMIBOLD,
    textTransform: 'capitalize',
  },
  badgePrimary: {
    backgroundColor: COLORS.PRIMARY,
  },
  badgeSuccess: {
    backgroundColor: COLORS.SUCCESS,
  },
  badgeDanger: {
    backgroundColor: COLORS.DANGER,
  },
  badgeWarning: {
    backgroundColor: '#FF9500',
  },
});

// Header styles for screens
export const headerStyles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    marginBottom: SPACING.LG,
  },
});

// Menu item styles
export const menuStyles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  menuText: {
    flex: 1,
    fontSize: TYPOGRAPHY.SIZES.MD,
    marginLeft: SPACING.MD,
    color: COLORS.BLACK,
  },
});
