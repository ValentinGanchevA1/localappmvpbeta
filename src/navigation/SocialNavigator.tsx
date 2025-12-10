// src/navigation/SocialNavigator.tsx
import React from 'react';
import { ChatScreen } from '@/screens/social';
import { View } from 'react-native';

const Stack = {
  Navigator: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  Screen: ({ component: Component }: { component: React.FC }) => <Component />,
};


const SocialNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        component={ChatScreen}
      />
    </Stack.Navigator>
  );
};

export default SocialNavigator;
