// TODO: Implement React Navigation / Expo Router after package installation.
// Route groups should separate Shared, Event Seeker, Organizer and Authority/Guide screens.
export const plannedRoutes = {
  shared: ['Splash', 'Login', 'SignUp', 'RoleSelection'],
  seeker: ['Home', 'Search', 'Filters', 'EventDetails', 'MapDirections', 'Saved', 'Notifications', 'Profile'],
  organizer: ['OrganizerDashboard', 'CreateEventBasic', 'CreateEventLocation', 'CreateEventMedia', 'ManageEvent', 'EventInsights'],
  authority: ['AuthorityDashboard', 'ReviewListings', 'VerificationDetails', 'Reports', 'PublishAlert', 'TouristSupport'],
};
