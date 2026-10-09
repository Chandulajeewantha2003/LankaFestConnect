import React, { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';
import { User } from '../services/api';
import { AuthorityEvent } from '../services/authority';
import AuthorityDashboardScreen from '../screens/authority/AuthorityDashboardScreen';
import ReviewListingsScreen from '../screens/authority/ReviewListingsScreen';
import VerificationDetailsScreen from '../screens/authority/VerificationDetailsScreen';
import ReportsScreen from '../screens/authority/ReportsScreen';
import ReportFormScreen from '../screens/authority/ReportFormScreen';
import PublishAlertScreen from '../screens/authority/PublishAlertScreen';
import TouristSupportScreen from '../screens/authority/TouristSupportScreen';
import OfficerProfileScreen from '../screens/authority/OfficerProfileScreen';
import { AuthorityScreen } from '../screens/authority/components/AuthorityHeader';
import AuthorityPlaceholder from '../screens/authority/components/AuthorityPlaceholder';
import { AuthorityBottomNav, AuthorityTab } from '../screens/authority/components/AuthorityBottomNav';

// Tourism Officer (AUTHORITY role) navigation
export default function AuthorityNavigator({ user, logout }: { user: User; logout: () => void }) {
  const [currentScreen, setCurrentScreen] = useState<AuthorityScreen>('Home');
  const [auditEvent, setAuditEvent] = useState<AuthorityEvent | null>(null);
  const [auditReturn, setAuditReturn] = useState<AuthorityScreen>('Events');
  const goHome = () => setCurrentScreen('Home');

  // Android Back returns to the dashboard (an audit returns to its listings); on the dashboard the system default applies.
  useEffect(() => {
    if (currentScreen === 'Home') return;
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      setCurrentScreen(currentScreen === 'Audit' ? auditReturn : currentScreen === 'NewReport' ? 'Reports' : 'Home');
      return true;
    });
    return () => listener.remove();
  }, [currentScreen, auditReturn]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Events':
        return (
          <ReviewListingsScreen
            user={user}
            onNavigate={setCurrentScreen}
            logout={logout}
            onAudit={(event) => {
              setAuditEvent(event);
              setAuditReturn('Events');
              setCurrentScreen('Audit');
            }}
          />
        );
      case 'Audit':
        return auditEvent ? (
          <VerificationDetailsScreen
            key={auditEvent.id}
            eventId={auditEvent.id}
            onBack={() => setCurrentScreen(auditReturn)}
            onProfile={() => setCurrentScreen('Profile')}
            onDecided={() => setCurrentScreen(auditReturn)}
          />
        ) : (
          <AuthorityPlaceholder title="Audit Submission" icon="shield-checkmark-outline" description="Choose an event from the listings to audit." backLabel="Event Listings" onBack={() => setCurrentScreen('Events')} />
        );
      case 'Reports':
        return <ReportsScreen user={user} onNavigate={setCurrentScreen} onNewReport={() => setCurrentScreen('NewReport')} logout={logout} />;
      case 'NewReport':
        return <ReportFormScreen onBack={() => setCurrentScreen('Reports')} onSubmitted={() => setCurrentScreen('Reports')} />;
      case 'PublishAlert':
        return <PublishAlertScreen onBack={goHome} onProfile={() => setCurrentScreen('Profile')} />;
      case 'TouristSupport':
        return (
          <TouristSupportScreen
            onBack={goHome}
            onProfile={() => setCurrentScreen('Profile')}
            onOpenEvent={(event) => {
              setAuditEvent(event);
              setAuditReturn('TouristSupport');
              setCurrentScreen('Audit');
            }}
          />
        );
      case 'Notifications':
        return <AuthorityPlaceholder title="Notifications" icon="notifications-outline" description="Updates about new listings and reports will appear here." onBack={goHome} />;
      case 'Profile':
        return <OfficerProfileScreen user={user} onNavigate={setCurrentScreen} logout={logout} />;
      case 'Home':
      default:
        return <AuthorityDashboardScreen user={user} onNavigate={setCurrentScreen} logout={logout} />;
    }
  };

  const activeTab: AuthorityTab | null =
    currentScreen === 'Home' || currentScreen === 'Events' || currentScreen === 'Reports' || currentScreen === 'Profile' ? currentScreen : null;

  return (
    <View style={styles.container}>
      <View style={styles.screen}>{renderScreen()}</View>
      {(activeTab || currentScreen === 'TouristSupport') && <AuthorityBottomNav activeTab={activeTab} onTabPress={setCurrentScreen} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  screen: { flex: 1 },
});
