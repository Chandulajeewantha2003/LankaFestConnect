import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { StepProgressBar } from './components/StepProgressBar';

interface Props {
  navigation?: any;
  route?: any;
}

const PRESET_LOCATIONS = [
  { name: 'Kandy Esala Perahera Ground', address: 'Kandy, Sri Lanka', city: 'Kandy' },
  { name: 'Galle Face Green', address: 'Colombo 03, Sri Lanka', city: 'Colombo' },
  { name: 'Galle Fort Cultural Center', address: 'Galle Fort, Sri Lanka', city: 'Galle' },
  { name: 'Jaffna Cultural Center', address: 'Jaffna, Sri Lanka', city: 'Jaffna' },
  { name: 'Negombo Beach Park', address: 'Negombo, Sri Lanka', city: 'Negombo' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = ['2025', '2026', '2027', '2028'];
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '15', '30', '45'];
const PERIODS = ['AM', 'PM'];

export default function CreateEventLocationScreen({ navigation, route }: Props) {
  const eventData = route?.params?.eventData || {};

  const [locationName, setLocationName] = useState<string>(
    eventData.locationName || 'Kandy Esala Perahera Ground'
  );
  const [locationAddress, setLocationAddress] = useState<string>(
    eventData.locationAddress || 'Kandy, Sri Lanka'
  );
  const [city, setCity] = useState<string>(eventData.city || 'Kandy');

  const [startDate, setStartDate] = useState<string>(eventData.startDate || 'Aug 10, 2025');
  const [startTime, setStartTime] = useState<string>(eventData.startTime || '6:00 PM');
  const [endDate, setEndDate] = useState<string>(eventData.endDate || 'Aug 20, 2025');
  const [endTime, setEndTime] = useState<string>(eventData.endTime || '11:00 PM');

  // Modal pickers state
  const [activePicker, setActivePicker] = useState<'location' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);

  // Selected date components
  const [selectedMonth, setSelectedMonth] = useState<string>('Aug');
  const [selectedDay, setSelectedDay] = useState<string>('10');
  const [selectedYear, setSelectedYear] = useState<string>('2025');

  // Selected time components
  const [selectedHour, setSelectedHour] = useState<string>('6');
  const [selectedMinute, setSelectedMinute] = useState<string>('00');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('PM');

  const openDatePicker = (type: 'startDate' | 'endDate') => {
    setActivePicker(type);
  };

  const openTimePicker = (type: 'startTime' | 'endTime') => {
    setActivePicker(type);
  };

  const applyDateSelection = () => {
    const formattedDate = `${selectedMonth} ${selectedDay}, ${selectedYear}`;
    if (activePicker === 'startDate') setStartDate(formattedDate);
    if (activePicker === 'endDate') setEndDate(formattedDate);
    setActivePicker(null);
  };

  const applyTimeSelection = () => {
    const formattedTime = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    if (activePicker === 'startTime') setStartTime(formattedTime);
    if (activePicker === 'endTime') setEndTime(formattedTime);
    setActivePicker(null);
  };

  const isEditing = route?.params?.isEditing || !!(eventData.id || eventData._id);

  const handleNext = () => {
    const updatedEventData = {
      ...eventData,
      locationName,
      locationAddress,
      city,
      startDate,
      startTime,
      endDate,
      endTime,
    };
    navigation?.navigate('CreateEventMedia', { eventData: updatedEventData, isEditing });
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Location' : 'Create Event'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar (Step 2 Details) */}
      <StepProgressBar currentStep={2} onStepPress={(step) => {
        if (step === 1) navigation?.navigate('CreateEventBasic', { eventData, isEditing });
      }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Event Location */}
        <Text style={styles.sectionTitle}>Event Location</Text>

        <View style={styles.mapCard}>
          {/* Visual Map Graphic */}
          <View style={styles.mapVisualContainer}>
            <View style={styles.mapWaterArea} />
            <View style={styles.mapRoad1} />
            <View style={styles.mapRoad2} />
            <Text style={styles.mapLabelLake}>Kandy Lake</Text>
            <Text style={styles.mapLabelTemple}>Temple of the Tooth</Text>
            <Text style={styles.mapLabelCentre}>Kandy City Centre</Text>
            {/* Map Marker Pin */}
            <View style={styles.mapMarkerPin}>
              <Ionicons name="location" size={28} color={theme.colors.danger} />
            </View>
          </View>

          {/* Location info box */}
          <View style={styles.locationDetailsRow}>
            <Ionicons name="location-outline" size={22} color={theme.colors.primary} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <TextInput
                style={styles.locationTitleInput}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Location Name"
              />
              <TextInput
                style={styles.locationSubInput}
                value={locationAddress}
                onChangeText={(val) => {
                  setLocationAddress(val);
                  if (val.includes(',')) setCity(val.split(',')[0].trim());
                }}
                placeholder="Address"
              />
            </View>
          </View>

          {/* Change Location Button */}
          <TouchableOpacity
            style={styles.changeLocationButton}
            activeOpacity={0.8}
            onPress={() => setActivePicker('location')}
          >
            <Ionicons name="map-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.changeLocationText}>Change Location</Text>
          </TouchableOpacity>
        </View>

        {/* Section: Date & Time */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Date & Time</Text>

        <View style={styles.dateTimeGrid}>
          {/* Row 1: Start Date & Start Time */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.fieldFlex} onPress={() => openDatePicker('startDate')}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{startDate}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fieldFlex} onPress={() => openTimePicker('startTime')}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{startTime}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: End Date & End Time */}
          <View style={[styles.row, { marginTop: 14 }]}>
            <TouchableOpacity style={styles.fieldFlex} onPress={() => openDatePicker('endDate')}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{endDate}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fieldFlex} onPress={() => openTimePicker('endTime')}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{endTime}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal visible={activePicker === 'location'} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Event Location</Text>
            {PRESET_LOCATIONS.map((loc) => (
              <TouchableOpacity
                key={loc.name}
                style={styles.locationPresetItem}
                onPress={() => {
                  setLocationName(loc.name);
                  setLocationAddress(loc.address);
                  setCity(loc.city);
                  setActivePicker(null);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.presetName}>{loc.name}</Text>
                </View>
                <Text style={styles.presetAddress}>{loc.address}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal (Month, Day, Year) */}
      <Modal visible={activePicker === 'startDate' || activePicker === 'endDate'} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date (Month, Day, Year)</Text>

            {/* Month Selection */}
            <Text style={styles.pickerSubLabel}>Month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {MONTHS.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.pillItem, selectedMonth === m && styles.pillSelected]}
                  onPress={() => setSelectedMonth(m)}
                >
                  <Text style={[styles.pillText, selectedMonth === m && styles.pillTextSelected]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Day Selection */}
            <Text style={styles.pickerSubLabel}>Day</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {DAYS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.pillItem, selectedDay === d && styles.pillSelected]}
                  onPress={() => setSelectedDay(d)}
                >
                  <Text style={[styles.pillText, selectedDay === d && styles.pillTextSelected]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Year Selection */}
            <Text style={styles.pickerSubLabel}>Year</Text>
            <View style={styles.pickerRowStatic}>
              {YEARS.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.pillItem, selectedYear === y && styles.pillSelected]}
                  onPress={() => setSelectedYear(y)}
                >
                  <Text style={[styles.pillText, selectedYear === y && styles.pillTextSelected]}>{y}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyDateSelection}>
              <Text style={styles.applyButtonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={activePicker === 'startTime' || activePicker === 'endTime'} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setActivePicker(null)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time</Text>

            {/* Hours */}
            <Text style={styles.pickerSubLabel}>Hour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {HOURS.map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.pillItem, selectedHour === h && styles.pillSelected]}
                  onPress={() => setSelectedHour(h)}
                >
                  <Text style={[styles.pillText, selectedHour === h && styles.pillTextSelected]}>{h}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Minutes & Period */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.pickerSubLabel}>Minute</Text>
                <View style={styles.pickerRowStatic}>
                  {MINUTES.map((min) => (
                    <TouchableOpacity
                      key={min}
                      style={[styles.pillItem, selectedMinute === min && styles.pillSelected]}
                      onPress={() => setSelectedMinute(min)}
                    >
                      <Text style={[styles.pillText, selectedMinute === min && styles.pillTextSelected]}>{min}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ width: 100 }}>
                <Text style={styles.pickerSubLabel}>Period</Text>
                <View style={styles.pickerRowStatic}>
                  {PERIODS.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={[styles.pillItem, selectedPeriod === p && styles.pillSelected]}
                      onPress={() => setSelectedPeriod(p)}
                    >
                      <Text style={[styles.pillText, selectedPeriod === p && styles.pillTextSelected]}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyTimeSelection}>
              <Text style={styles.applyButtonText}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Footer Next Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: theme.colors.surface,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },
  mapCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  mapVisualContainer: {
    height: 145,
    backgroundColor: '#E0F2FE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapWaterArea: {
    position: 'absolute',
    right: -10,
    top: 5,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#BAE6FD',
  },
  mapRoad1: {
    position: 'absolute',
    width: '100%',
    height: 6,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '-15deg' }],
  },
  mapRoad2: {
    position: 'absolute',
    height: '100%',
    width: 6,
    backgroundColor: '#FFFFFF',
    left: '42%',
  },
  mapLabelLake: {
    position: 'absolute',
    right: 25,
    top: 25,
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '600',
  },
  mapLabelTemple: {
    position: 'absolute',
    left: 12,
    bottom: 25,
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '600',
  },
  mapLabelCentre: {
    position: 'absolute',
    right: 30,
    bottom: 15,
    fontSize: 10,
    color: '#0369A1',
  },
  mapMarkerPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.colors.surface,
  },
  locationTitleInput: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    padding: 0,
  },
  locationSubInput: {
    fontSize: 12,
    color: theme.colors.muted,
    padding: 0,
    marginTop: 2,
  },
  changeLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    marginHorizontal: 14,
    marginBottom: 14,
    borderRadius: theme.radius.sm,
  },
  changeLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  dateTimeGrid: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldFlex: {
    flex: 1,
    marginHorizontal: 4,
  },
  fieldLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  inputIcon: {
    marginRight: 6,
  },
  flexInputText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: theme.colors.surface,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
  },
  locationPresetItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  presetName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  presetAddress: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  pickerSubLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  pickerRow: {
    flexDirection: 'row',
    marginVertical: 4,
  },
  pickerRowStatic: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
  },
  pillItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
    marginBottom: 6,
  },
  pillSelected: {
    backgroundColor: theme.colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
