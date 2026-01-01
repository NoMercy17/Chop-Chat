import Header from "../components/home/Header";
import MainActions from '../components/home/MainActions';
import FeaturedChef from "../components/home/FeaturedChef";
import CommunityFeed from "../components/home/CommunityFeed"; 
import { StyleSheet, Platform, View, ScrollView } from "react-native";
import { StatusBar } from 'expo-status-bar';
import { hp } from '../utils/responsive';

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
    backgroundColor: '#3b83f68a',
    paddingTop: Platform.OS === 'ios' ? hp(25) : StatusBar.currentHeight,
  },
  scrollView: {
    flex: 1,
  },
});
