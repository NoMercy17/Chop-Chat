import Header from "../components/home/Header";
import MainActions from '../components/home/MainActions';
import FeaturedChef from "../components/home/FeaturedChef";
import CommunityFeed from "../components/home/CommunityFeed"; 
import { StyleSheet, View, ScrollView } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from "../context/ThemeContext";

export default function HomeScreen({ navigation }) { 
  const { isDarkMode, theme } = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <View style={[styles.container, { backgroundColor: theme.screenBackground, paddingTop: insets.top }]}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Header navigation={navigation} />
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.screenBackground }]}
        showsVerticalScrollIndicator={false}
      >
        <MainActions /> 
        <FeaturedChef />
        <CommunityFeed />
      
      </ScrollView> 
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
});
