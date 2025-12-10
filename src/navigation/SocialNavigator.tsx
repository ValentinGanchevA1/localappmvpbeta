
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ChatScreen } from '@/screens/social';
import { SocialStackParamList } from '@/types/navigation';

const Stack = createNativeStackNavigator<SocialStackParamList>();

const SocialNavigator: React.FC = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default SocialNavigator;
