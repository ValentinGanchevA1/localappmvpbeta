// src/App.tsx - UPDATED
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
import RootNavigator from './navigation/RootNavigator';
import ErrorBoundary from './components/ErrorBoundary';
import { AppInitializer } from './components/AppInitializer';
import { PersistLoading } from './components/PersistLoading';
import { ConnectionStatus } from './components/ConnectionStatus';
import { NavigationContainer } from '@react-navigation/native';

const App = () => {
	return (
		<Provider store={store}>
			{/* Wait for Redux-Persist to rehydrate state */}
			<PersistGate loading={<PersistLoading />} persistor={persistor}>
				<AppInitializer>
					<ErrorBoundary>
						<NavigationContainer>
							<ConnectionStatus />
							<RootNavigator />
						</NavigationContainer>
					</ErrorBoundary>
				</AppInitializer>
			</PersistGate>
		</Provider>
	);
};

export default App;
