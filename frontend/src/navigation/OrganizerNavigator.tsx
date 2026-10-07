import React, { useState } from 'react';
import { View } from 'react-native';
import { User } from '../services/api';
import MessagesScreen from '../screens/shared/MessagesScreen';
import { OrganizerBottomNav } from '../screens/organizer/components/OrganizerBottomNav';
import OrganizerAccountScreen from '../screens/organizer/OrganizerAccountScreen';
import OrganizerDashboardScreen from '../screens/organizer/OrganizerDashboardScreen';
import CreateEventBasicScreen from '../screens/organizer/CreateEventBasicScreen';
import CreateEventLocationScreen from '../screens/organizer/CreateEventLocationScreen';
import CreateEventMediaScreen from '../screens/organizer/CreateEventMediaScreen';
import CreateEventReviewScreen from '../screens/organizer/CreateEventReviewScreen';
import ManageEventScreen from '../screens/organizer/ManageEventScreen';
import EventInsightsScreen from '../screens/organizer/EventInsightsScreen';

export default function OrganizerNavigator({ user, logout }: { user: User; logout: () => void }) {
  const [currentScreen, setCurrentScreen] = useState<string>('OrganizerDashboard');
  const [screenParams, setScreenParams] = useState<any>({});

  const navigation = {
    navigate: (screenName: string, params?: any) => {
      setScreenParams(params ?? {});
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

  const route = { params: { ...screenParams, user } };

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
      case 'Messages':
        return <MessagesScreen user={user} initial={screenParams.conversation} onBack={() => navigation.navigate('OrganizerDashboard')}/>;
      case 'Profile':
        return <OrganizerAccountScreen user={user} logout={logout} onBack={() => navigation.navigate('OrganizerDashboard')}/>;
      case 'MyEvents':
        return <OrganizerDashboardScreen navigation={navigation} route={{ params: { ...route.params, showAll: true } }} />;
      case 'OrganizerDashboard':
      default:
        return <OrganizerDashboardScreen navigation={navigation} route={route} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>

      {renderScreen()}
      {(currentScreen === 'Profile' || currentScreen === 'Messages') && <OrganizerBottomNav activeTab={currentScreen} onTabPress={tab => navigation.navigate({ Home: 'OrganizerDashboard', Events: 'EventInsights', Messages: 'Messages', Profile: 'Profile' }[tab])}/>}
    </View>
  );
}
