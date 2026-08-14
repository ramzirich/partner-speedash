import React, { useEffect } from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { RootNavigator } from './src/navigation';
import { hydrateOrderStatusTimes } from './src/services/orderStatusTimes';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  // Warmed up front so a tracked order's history is on screen with its first
  // render rather than a frame later.
  useEffect(() => {
    hydrateOrderStatusTimes();
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
