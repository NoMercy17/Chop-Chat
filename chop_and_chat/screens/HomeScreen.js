import Header from "../components/home/Header";
import MainActions from '../components/home/MainActions';
import FeaturedChef from "../components/home/FeaturedChef";
import CommunityFeed from "../components/home/CommunityFeed"; 
import { StyleSheet, View, ScrollView } from "react-native";
import { StatusBar } from 'expo-status-bar';

export default function HomeScreen({ navigation }) { 
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Header navigation={navigation} />
      <ScrollView
        style={styles.scrollView}
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
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#93C5FD',
  },
});
