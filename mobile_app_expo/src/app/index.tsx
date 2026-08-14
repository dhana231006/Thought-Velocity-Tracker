import { StyleSheet, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView 
        source={{ uri: 'http://10.207.238.48:5173' }} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  webview: { flex: 1 },
});
