module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-redux|@react-native|react-native|@react-navigation|@reduxjs/toolkit|immer|redux-persist|react-native-maps|react-native-vector-icons|react-native-permissions|react-native-geolocation-service|react-native-image-picker|react-native-linear-gradient|socket.io-client|@react-native-async-storage)/)',
  ],
  setupFiles: [
    './node_modules/react-native/jest/setup.js',
  ],
  setupFilesAfterEnv: ['./jest.setup.js'],
};
