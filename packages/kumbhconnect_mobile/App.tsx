import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

// Import our main architecture components here
import { OfflineMap } from './src/components/OfflineMap';
import { PanicSOSTrigger } from './src/components/PanicSOSTrigger';

export default function App() {
  return (
    <View style={styles.container}>
      <OfflineMap />
      <PanicSOSTrigger />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});