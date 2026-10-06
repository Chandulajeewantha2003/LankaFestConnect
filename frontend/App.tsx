import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import OrganizerDashboardScreen from './src/screens/organizer/OrganizerDashboardScreen';
import CreateEventBasicScreen from './src/screens/organizer/CreateEventBasicScreen';
import CreateEventLocationScreen from './src/screens/organizer/CreateEventLocationScreen';
import CreateEventMediaScreen from './src/screens/organizer/CreateEventMediaScreen';
import CreateEventReviewScreen from './src/screens/organizer/CreateEventReviewScreen';
import ManageEventScreen from './src/screens/organizer/ManageEventScreen';
import EventInsightsScreen from './src/screens/organizer/EventInsightsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('OrganizerDashboard');
  const [screenParams, setScreenParams] = useState<any>({});

  const navigation = {
    navigate: (screenName: string, params?: any) => {
      if (params) setScreenParams(params);
      setCurrentScreen(screenName);
    },
    goBack: () => {
      if (currentScreen === 'CreateEventLocation') setCurrentScreen('CreateEventBasic');
      else if (currentScreen === 'CreateEventMedia') setCurrentScreen('CreateEventLocation');
      else if (currentScreen === 'CreateEventReview') setCurrentScreen('CreateEventMedia');
      else if (currentScreen === 'ManageEvent' || currentScreen === 'EventInsights') setCurrentScreen('OrganizerDashboard');
      else setCurrentScreen('OrganizerDashboard');
    },
  };

  const route = { params: screenParams };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'CreateEventBasic':
        return <CreateEventBasicScreen navigation={navigation} route={route} />;
      case 'CreateEventLocation':
        return <CreateEventLocationScreen navigation={navigation} route={route} />;
      case 'CreateEventMedia':
        return <CreateEventMediaScreen navigation={navigation} route={route} />;
      case 'CreateEventReview':
        return <CreateEventReviewScreen navigation={navigation} route={route} />;
      case 'ManageEvent':
        return <ManageEventScreen navigation={navigation} route={route} />;
      case 'EventInsights':
        return <EventInsightsScreen navigation={navigation} route={route} />;
      case 'OrganizerDashboard':
      default:
        return <OrganizerDashboardScreen navigation={navigation} route={route} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      {renderScreen()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
