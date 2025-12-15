# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Development Commands

```bash
# Install dependencies
yarn install

# Start Metro bundler
yarn start

# Run on Android
yarn android

# Run on iOS (requires CocoaPods setup first)
bundle install                # First time only
bundle exec pod install       # After updating native deps
yarn ios

# Run tests
yarn test

# Run linting
yarn lint

# Start mock backend server
cd backend && npm start       # or: npm run dev (with nodemon)
```

## Architecture Overview

This is a React Native app (v0.83) using TypeScript with a multi-feature social/location-based platform.

### Core Stack
- **State Management**: Redux Toolkit with redux-persist (persists auth, theme, user, engagement, notificationSettings)
- **Navigation**: React Navigation v7 (native-stack, bottom-tabs)
- **API**: Axios with interceptors (src/api/axiosInstance.ts)
- **Maps**: react-native-maps with geolocation-service
- **Push Notifications**: Firebase Messaging (@react-native-firebase/messaging)
- **Real-time**: Socket.io for chat/live features

### Directory Structure

```
src/
├── api/          # API layer with axiosInstance, feature-specific endpoints
├── components/   # UI components (common/, dating/, trading/)
├── config/       # Environment config, theme, global styles
├── hooks/        # Custom hooks (useAuth, useLocation, useNotificationPermissions)
├── navigation/   # React Navigation setup
├── screens/      # Screen components organized by feature (auth/, main/, dating/, social/)
├── services/     # Business logic services (auth, location, notifications, engagement)
├── store/        # Redux store with feature slices
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

### State Structure (Redux Slices)
- `auth` - Authentication state (persisted)
- `user` - User profile data (persisted)
- `location` - Geolocation data (not persisted)
- `dating` - Swipe/match features (not persisted)
- `trading` - Trade offers (not persisted)
- `notifications` - Push notification state (not persisted)
- `notificationSettings` - User notification preferences (persisted)
- `engagement` - User engagement tracking (persisted)

### Navigation Flow
- **RootNavigator**: Switches between AuthNavigator (unauthenticated) and MainTabNavigator (authenticated)
- **AuthNavigator**: Phone login -> Verification -> Profile setup
- **MainTabNavigator**: Bottom tabs for main features (Map, Trading, Social, Profile)

### Path Aliases
Use `@/` to import from src directory (configured in babel.config.js and tsconfig.json):
```typescript
import { useAppSelector } from '@/store/hooks';
```

### Typed Redux Hooks
Always use typed hooks from `@/store/hooks`:
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
```

### Backend
Mock Express server in `/backend` - run with `npm start` from that directory.
