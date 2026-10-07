import React, { useEffect, useRef, useState } from 'react';
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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEARS = [2026, 2027, 2028, 2029, 2030]; // 2026 or later only
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateEventLocationScreen({ navigation, route }: Props) {
  const eventData = route?.params?.eventData || {};

  const [locationName, setLocationName] = useState<string>(
    eventData.locationName || 'Kandy Esala Perahera Ground'
  );
  const [locationAddress, setLocationAddress] = useState<string>(
    eventData.locationAddress || 'Kandy, Sri Lanka'
  );
  const [city, setCity] = useState<string>(eventData.city || 'Kandy');

  const [startDate, setStartDate] = useState<string>(eventData.startDate || 'Oct 15, 2026');
  const [startTime, setStartTime] = useState<string>(eventData.startTime || '10:30 AM');
  const [endDate, setEndDate] = useState<string>(eventData.endDate || 'Oct 20, 2026');
  const [endTime, setEndTime] = useState<string>(eventData.endTime || '11:00 PM');

  // Track event signature to synchronize state when navigating into edit flow
  const lastLoadedEventRef = useRef<string>('');

  useEffect(() => {
    const currentSig = JSON.stringify({
      id: eventData.id || eventData._id,
      locationName: eventData.locationName,
      locationAddress: eventData.locationAddress,
      city: eventData.city,
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime,
    });

    if (lastLoadedEventRef.current !== currentSig) {
      lastLoadedEventRef.current = currentSig;
      if (eventData.locationName !== undefined) setLocationName(eventData.locationName || 'Kandy Esala Perahera Ground');
      if (eventData.locationAddress !== undefined) setLocationAddress(eventData.locationAddress || 'Kandy, Sri Lanka');
      if (eventData.city !== undefined) setCity(eventData.city || 'Kandy');
      if (eventData.startDate !== undefined) setStartDate(eventData.startDate || 'Oct 15, 2026');
      if (eventData.startTime !== undefined) setStartTime(eventData.startTime || '10:30 AM');
      if (eventData.endDate !== undefined) setEndDate(eventData.endDate || 'Oct 20, 2026');
      if (eventData.endTime !== undefined) setEndTime(eventData.endTime || '11:00 PM');
    }
  }, [route?.params?.eventData]);

  // Modal pickers state
  const [activePicker, setActivePicker] = useState<'location' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);

  // Calendar State (Current baseline: October 2026)
  const [calMonth, setCalMonth] = useState<number>(9); // 0-indexed (9 = October)
  const [calYear, setCalYear] = useState<number>(2026);
  const [calDay, setCalDay] = useState<number>(15);
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);

  // Time Picker State (12-hour format with UP/DOWN arrows)
  const [timeHour, setTimeHour] = useState<number>(10);
  const [timeMinute, setTimeMinute] = useState<number>(30);
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  // Helper to parse date string into calendar state (Enforce Oct 6 2026 minimum constraint)
  const openDatePicker = (type: 'startDate' | 'endDate') => {
    setActivePicker(type);
    const targetStr = type === 'startDate' ? startDate : endDate;
    let year = 2026;
    let month = 9; // October (0-indexed)
    let day = 6;

    if (targetStr) {
      const parsed = new Date(targetStr);
      if (!isNaN(parsed.getTime())) {
        year = parsed.getFullYear();
        month = parsed.getMonth();
        day = parsed.getDate();
      } else {
        const parts = targetStr.split(' ');
        if (parts.length >= 3) {
          const mIdx = SHORT_MONTHS.findIndex((m) => m.toLowerCase() === parts[0].toLowerCase().replace(',', ''));
          if (mIdx !== -1) month = mIdx;
          const dayVal = parseInt(parts[1].replace(',', ''), 10);
          if (!isNaN(dayVal)) day = dayVal;
          const yearVal = parseInt(parts[2], 10);
          if (!isNaN(yearVal)) year = yearVal;
        }
      }
    }

    // Enforce October 6 2026 minimum constraint
    if (year < 2026) {
      year = 2026;
      month = 9;
      day = 6;
    } else if (year === 2026 && month < 9) {
      month = 9;
      day = 6;
    } else if (year === 2026 && month === 9 && day < 6) {
      day = 6;
    }

    setCalYear(year);
    setCalMonth(month);
    setCalDay(day);
  };

  // Helper to parse time string into 12-hour time picker state
  const openTimePicker = (type: 'startTime' | 'endTime') => {
    setActivePicker(type);
    const targetStr = type === 'startTime' ? startTime : endTime;
    let hour = 10;
    let minute = 30;
    let period: 'AM' | 'PM' = 'AM';

    if (targetStr) {
      const isPM = targetStr.toUpperCase().includes('PM');
      const isAM = targetStr.toUpperCase().includes('AM');
      period = isPM ? 'PM' : isAM ? 'AM' : 'AM';

      const clean = targetStr.replace(/AM|PM/i, '').trim();
      const timeParts = clean.split(':');
      if (timeParts.length >= 2) {
        const h = parseInt(timeParts[0], 10);
        const m = parseInt(timeParts[1], 10);
        if (!isNaN(h) && h >= 1 && h <= 12) hour = h;
        if (!isNaN(m) && m >= 0 && m <= 59) minute = m;
      }
    }

    setTimeHour(hour);
    setTimeMinute(minute);
    setTimePeriod(period);
  };

  // Calendar logic with month constraint (Cannot navigate before Oct 2026)
  const canGoPrevMonth = calYear > 2026 || (calYear === 2026 && calMonth > 9);

  const handlePrevMonth = () => {
    if (!canGoPrevMonth) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const applyDateSelection = () => {
    const formattedMonth = SHORT_MONTHS[calMonth];
    const formattedDate = `${formattedMonth} ${calDay}, ${calYear}`;
    if (activePicker === 'startDate') setStartDate(formattedDate);
    if (activePicker === 'endDate') setEndDate(formattedDate);
    setActivePicker(null);
  };

  // 12-Hour Time UP/DOWN logic (Minute 00-59 by 1)
  const incrementHour = () => {
    setTimeHour((prev) => (prev === 12 ? 1 : prev + 1));
  };

  const decrementHour = () => {
    setTimeHour((prev) => (prev === 1 ? 12 : prev - 1));
  };

  const incrementMinute = () => {
    setTimeMinute((prev) => (prev === 59 ? 0 : prev + 1));
  };

  const decrementMinute = () => {
    setTimeMinute((prev) => (prev === 0 ? 59 : prev - 1));
  };

  const applyTimeSelection = () => {
    const formattedHour = timeHour < 10 ? `0${timeHour}` : `${timeHour}`;
    const formattedMin = timeMinute < 10 ? `0${timeMinute}` : `${timeMinute}`;
    const formattedTime = `${formattedHour}:${formattedMin} ${timePeriod}`;
    if (activePicker === 'startTime') setStartTime(formattedTime);
    if (activePicker === 'endTime') setEndTime(formattedTime);
    setActivePicker(null);
  };

  const isEditing = route?.params?.isEditing || !!(eventData.id || eventData._id);

  const getUpdatedEventData = () => ({
    ...eventData,
    locationName,
    locationAddress,
    city,
    startDate,
    startTime,
    endDate,
    endTime,
  });

  const handleNext = () => {
    navigation?.navigate('CreateEventMedia', { eventData: getUpdatedEventData(), isEditing });
  };

  // Render Days Grid for Calendar
  const renderCalendarGrid = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

    const cells: React.ReactNode[] = [];

    // Empty lead cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calendarDayCellEmpty} />);
    }

    // Days 1..daysInMonth
    for (let d = 1; d <= daysInMonth; d++) {
      const isPastDay =
        calYear < 2026 ||
        (calYear === 2026 && calMonth < 9) ||
        (calYear === 2026 && calMonth === 9 && d < 6); // Before Oct 6, 2026 is past/unavailable

      const isSelected = calDay === d && !isPastDay;

      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          disabled={isPastDay}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarDaySelected,
            isPastDay && styles.calendarDayDisabled,
          ]}
          onPress={() => setCalDay(d)}
        >
          <Text
            style={[
              styles.calendarDayText,
              isSelected && styles.calendarDayTextSelected,
              isPastDay && styles.calendarDayTextDisabled,
            ]}
          >
            {d}
          </Text>
        </TouchableOpacity>
      );
    }

    return cells;
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.navigate('CreateEventBasic', { eventData: getUpdatedEventData(), isEditing })} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Location & Time' : 'Create Event'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar (Step 2 Details) */}
      <StepProgressBar currentStep={2} onStepPress={(step) => {
        if (step === 1) navigation?.navigate('CreateEventBasic', { eventData: getUpdatedEventData(), isEditing });
      }} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
            activeOpacity={0.7}
            onPress={() => setActivePicker('location')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }} pointerEvents="none">
              <Ionicons name="map-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.changeLocationText}>Change Location</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Date & Time */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Date & Time</Text>

        <View style={styles.dateTimeGrid}>
          {/* Row 1: Start Date & Start Time */}
          <View style={styles.row}>
            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openDatePicker('startDate')}>
              <Text style={styles.fieldLabel}>Start Date</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{startDate}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openTimePicker('startTime')}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{startTime}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: End Date & End Time */}
          <View style={[styles.row, { marginTop: 14 }]}>
            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openDatePicker('endDate')}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{endDate}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openTimePicker('endTime')}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{endTime}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <Modal
        visible={activePicker === 'location'}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />
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
        </View>
      </Modal>

      {/* Calendar Date Picker Modal (Requirement: Current Oct 6 2026 onwards) */}
      <Modal
        visible={activePicker === 'startDate' || activePicker === 'endDate'}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Date</Text>

            {/* Calendar Header with Month/Year Navigation */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                onPress={handlePrevMonth}
                disabled={!canGoPrevMonth}
                style={[styles.calNavBtn, !canGoPrevMonth && { opacity: 0.3 }]}
              >
                <Ionicons name="chevron-back" size={20} color={canGoPrevMonth ? theme.colors.text : theme.colors.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calMonthYearTitleRow}
                onPress={() => setShowYearDropdown(!showYearDropdown)}
              >
                <Text style={styles.calMonthYearTitle}>
                  {MONTH_NAMES[calMonth]} {calYear}
                </Text>
                <Ionicons name="chevron-down" size={16} color={theme.colors.muted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity onPress={handleNextMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            {/* Year Selector Dropdown (2026 or later only) */}
            {showYearDropdown && (
              <View style={styles.yearDropdownContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {YEARS.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[styles.yearPill, calYear === y && styles.yearPillSelected]}
                      onPress={() => {
                        setCalYear(y);
                        if (y === 2026 && calMonth < 9) setCalMonth(9); // Clamp to Oct 2026 minimum
                        setShowYearDropdown(false);
                      }}
                    >
                      <Text style={[styles.yearPillText, calYear === y && styles.yearPillTextSelected]}>{y}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Weekday Labels Header */}
            <View style={styles.weekdayHeader}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.weekdayLabel}>{w}</Text>
              ))}
            </View>

            {/* Calendar Days Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendarGrid()}
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyDateSelection}>
              <Text style={styles.applyButtonText}>Confirm Date</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 12-Hour Time Picker Modal with UP/DOWN Arrows */}
      <Modal
        visible={activePicker === 'startTime' || activePicker === 'endTime'}
        transparent
        animationType="slide"
        onRequestClose={() => setActivePicker(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setActivePicker(null)}
          />
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Time (12-Hour)</Text>

            <View style={styles.timePickerRow}>
              {/* Hour Control Box */}
              <View style={styles.timePickerColumn}>
                <TouchableOpacity style={styles.timeArrowBtn} onPress={incrementHour}>
                  <Ionicons name="chevron-up" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <View style={styles.timeDisplayBox}>
                  <Text style={styles.timeDisplayText}>{timeHour < 10 ? `0${timeHour}` : timeHour}</Text>
                </View>
                <TouchableOpacity style={styles.timeArrowBtn} onPress={decrementHour}>
                  <Ionicons name="chevron-down" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.timeControlLabel}>Hour</Text>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minute Control Box */}
              <View style={styles.timePickerColumn}>
                <TouchableOpacity style={styles.timeArrowBtn} onPress={incrementMinute}>
                  <Ionicons name="chevron-up" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <View style={styles.timeDisplayBox}>
                  <Text style={styles.timeDisplayText}>{timeMinute < 10 ? `0${timeMinute}` : timeMinute}</Text>
                </View>
                <TouchableOpacity style={styles.timeArrowBtn} onPress={decrementMinute}>
                  <Ionicons name="chevron-down" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
                <Text style={styles.timeControlLabel}>Minute</Text>
              </View>

              {/* AM / PM Toggle Box */}
              <View style={[styles.timePickerColumn, { marginLeft: 16 }]}>
                <TouchableOpacity
                  style={[styles.periodPill, timePeriod === 'AM' && styles.periodPillSelected]}
                  onPress={() => setTimePeriod('AM')}
                >
                  <Text style={[styles.periodPillText, timePeriod === 'AM' && styles.periodPillTextSelected]}>AM</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.periodPill, timePeriod === 'PM' && styles.periodPillSelected, { marginTop: 8 }]}
                  onPress={() => setTimePeriod('PM')}
                >
                  <Text style={[styles.periodPillText, timePeriod === 'PM' && styles.periodPillTextSelected]}>PM</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.applyButton} onPress={applyTimeSelection}>
              <Text style={styles.applyButtonText}>Confirm Time</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    elevation: 10,
    zIndex: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
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

  /* Calendar Styling */
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 6,
  },
  calMonthYearTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calMonthYearTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  yearDropdownContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  yearPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    marginRight: 6,
  },
  yearPillSelected: {
    backgroundColor: theme.colors.primary,
  },
  yearPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
  },
  yearPillTextSelected: {
    color: '#FFFFFF',
  },
  weekdayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 6,
  },
  weekdayLabel: {
    width: 36,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  calendarDayCell: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 19,
  },
  calendarDayCellEmpty: {
    width: 38,
    height: 38,
    margin: 3,
  },
  calendarDaySelected: {
    backgroundColor: theme.colors.primary,
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextDisabled: {
    color: theme.colors.muted,
  },

  /* 12-Hour Time Picker Styling with UP/DOWN arrows */
  timePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  timePickerColumn: {
    alignItems: 'center',
  },
  timeArrowBtn: {
    padding: 8,
  },
  timeDisplayBox: {
    width: 60,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeDisplayText: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
  },
  timeSeparator: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.text,
    marginHorizontal: 10,
    marginBottom: 16,
  },
  timeControlLabel: {
    fontSize: 11,
    color: theme.colors.muted,
    fontWeight: '600',
    marginTop: 4,
  },
  periodPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  periodPillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  periodPillTextSelected: {
    color: '#FFFFFF',
  },
  applyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
