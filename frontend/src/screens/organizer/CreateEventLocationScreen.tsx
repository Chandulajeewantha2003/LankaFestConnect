import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PlaceMap from '../../components/PlaceMap';
import { PlaceResult, searchPlaces } from '../../services/places';
import { theme } from '../../constants/theme';
import { parseEventDate, parseEventDateTime } from '../../utils/eventSchedule';
import useStepBack from './useStepBack';
import { StepProgressBar } from './components/StepProgressBar';

interface Props {
  navigation?: any;
  route?: any;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const TODAY = new Date(); TODAY.setHours(0, 0, 0, 0);
const YEARS = Array.from({ length: 10 }, (_, i) => TODAY.getFullYear() + i);
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CreateEventLocationScreen({ navigation, route }: Props) {
  const eventData = route?.params?.eventData || {};

  const [locationName, setLocationName] = useState<string>(
    eventData.locationName || ''
  );
  const [locationAddress, setLocationAddress] = useState<string>(
    eventData.locationAddress || ''
  );
  const [city, setCity] = useState<string>(eventData.city || '');
  const [place, setPlace] = useState<{ placeId?: string; latitude?: number; longitude?: number }>({ placeId: eventData.placeId, latitude: eventData.latitude, longitude: eventData.longitude });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchVersion = useRef(0);

  const [mapsUrl, setMapsUrl] = useState<string>(eventData.mapsUrl || '');
  const [pinDraft, setPinDraft] = useState<{ latitude?: number; longitude?: number }>({});
  const [searchError, setSearchError] = useState('');

  const [startDate, setStartDate] = useState<string>(eventData.startDate || '');
  const [startTime, setStartTime] = useState<string>(eventData.startTime || '');
  const [endDate, setEndDate] = useState<string>(eventData.endDate || '');
  const [endTime, setEndTime] = useState<string>(eventData.endTime || '');

  // Track event signature to synchronize state when navigating into edit flow
  const lastLoadedEventRef = useRef<string>('');

  useEffect(() => {
    const currentSig = JSON.stringify({
      id: eventData.id || eventData._id,
      locationName: eventData.locationName,
      locationAddress: eventData.locationAddress,
      city: eventData.city,
      mapsUrl: eventData.mapsUrl,
      placeId: eventData.placeId, latitude: eventData.latitude, longitude: eventData.longitude,
      startDate: eventData.startDate,
      startTime: eventData.startTime,
      endDate: eventData.endDate,
      endTime: eventData.endTime,
    });

    if (lastLoadedEventRef.current !== currentSig) {
      lastLoadedEventRef.current = currentSig;
      setMapsUrl(eventData.mapsUrl || '');
      setPlace({ placeId: eventData.placeId, latitude: eventData.latitude, longitude: eventData.longitude });
      if (eventData.locationName !== undefined) setLocationName(eventData.locationName || '');
      if (eventData.locationAddress !== undefined) setLocationAddress(eventData.locationAddress || '');
      if (eventData.city !== undefined) setCity(eventData.city || '');
      if (eventData.startDate !== undefined) setStartDate(eventData.startDate || '');
      if (eventData.startTime !== undefined) setStartTime(eventData.startTime || '');
      if (eventData.endDate !== undefined) setEndDate(eventData.endDate || '');
      if (eventData.endTime !== undefined) setEndTime(eventData.endTime || '');
    }
  }, [route?.params?.eventData]);

  // Modal pickers state
  const [activePicker, setActivePicker] = useState<'location' | 'startDate' | 'startTime' | 'endDate' | 'endTime' | null>(null);

  const runSearch = async () => {
    if (query.trim().length < 3 || searching) return;
    const version = ++searchVersion.current;
    setSearching(true); setSearchError(''); setResults([]);
    try {
      const found = await searchPlaces(query.trim());
      if (version !== searchVersion.current) return;
      setResults(found);
      if (!found.length) setSearchError('No venues found. Try a more specific name or address.');
    } catch (err) {
      if (version === searchVersion.current) setSearchError(err instanceof Error ? err.message : 'Search failed. Please try again.');
    } finally { if (version === searchVersion.current) setSearching(false); }
  };
  useEffect(() => () => { searchVersion.current++; }, []);
  const selectPlace = (result: PlaceResult) => {
    searchVersion.current++; setSearching(false);
    setLocationName(result.name); setLocationAddress(result.address); setCity(result.city);
    setPlace({ placeId: result.placeId, latitude: result.latitude, longitude: result.longitude });
    setMapsUrl(''); setError(''); setSearchError(''); setActivePicker(null);
  };

  const savePin = () => {
    if (!Number.isFinite(pinDraft.latitude) || !Number.isFinite(pinDraft.longitude)) { setSearchError('Tap the map to choose the venue pin.'); return; }
    setPlace({ latitude: pinDraft.latitude, longitude: pinDraft.longitude, placeId: undefined });
    setMapsUrl(''); setError(''); setSearchError(''); setActivePicker(null);
  };

  // Calendar State (Current baseline: October 2026)
  const [calMonth, setCalMonth] = useState<number>(TODAY.getMonth()); // 0-indexed (9 = October)
  const [calYear, setCalYear] = useState<number>(TODAY.getFullYear());
  const [calDay, setCalDay] = useState<number>(TODAY.getDate());
  const [showYearDropdown, setShowYearDropdown] = useState<boolean>(false);
  useEffect(() => {
    const max = new Date(calYear, calMonth + 1, 0).getDate();
    const min = calYear === TODAY.getFullYear() && calMonth === TODAY.getMonth() ? TODAY.getDate() : 1;
    setCalDay(day => Math.max(min, Math.min(day, max)));
  }, [calMonth, calYear]);

  // Time Picker State (12-hour format with UP/DOWN arrows)
  const [timeHour, setTimeHour] = useState<number>(10);
  const [timeMinute, setTimeMinute] = useState<number>(30);
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  // Helper to parse date string into calendar state (Enforce Oct 6 2026 minimum constraint)
  const openDatePicker = (type: 'startDate' | 'endDate') => {
    setActivePicker(type);
    const targetStr = type === 'startDate' ? startDate : endDate;
    let year = TODAY.getFullYear();
    let month = TODAY.getMonth();
    let day = TODAY.getDate();

    if (targetStr) {
      const parsed = parseEventDate(targetStr);
      if (parsed) {
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

    if (new Date(year, month, day) < TODAY) { year = TODAY.getFullYear(); month = TODAY.getMonth(); day = TODAY.getDate(); }

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
  const canGoPrevMonth = calYear > TODAY.getFullYear() || (calYear === TODAY.getFullYear() && calMonth > TODAY.getMonth());

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
    if (calDay > new Date(calYear, calMonth + 1, 0).getDate() || new Date(calYear, calMonth, calDay) < TODAY) return;
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
    placeId: place.placeId ?? null,
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    mapsUrl: mapsUrl || null,
    locationName: locationName.trim(),
    locationAddress: locationAddress.trim(),
    city: city.trim(),
    startDate,
    startTime,
    endDate,
    endTime,
  });

  const [error, setError] = useState('');
  const handleNext = () => {
    if (![locationName, locationAddress, city, startDate, startTime, endDate, endTime].every(v => v.trim())) { setError('Enter the venue, address, city, and start and end schedule.'); return; }
    if ((!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) && !isEditing) { setError('Search for a venue or select its pin on the map.'); return; }
    const start = parseEventDateTime(startDate, startTime), end = parseEventDateTime(endDate, endTime);
    if (!start || !end || end <= start) { setError('Choose an end date and time after the start.'); return; }
    setError('');
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
      const isPastDay = new Date(calYear, calMonth, d) < TODAY;

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

  useStepBack(() => navigation?.navigate('CreateEventBasic', { eventData: getUpdatedEventData(), isEditing }));

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
          <View style={styles.mapVisualContainer}>
            <PlaceMap mapsUrl={mapsUrl} venue={locationName} address={locationAddress} city={city} {...place} />
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
                onChangeText={setLocationAddress}
                placeholder="Address"
              />
              <Text style={styles.fieldLabel}>City *</Text>
              <TextInput accessibilityLabel="Event city" style={styles.locationSubInput} value={city} onChangeText={setCity} placeholder="Enter city" />
            </View>
          </View>

          {/* Change Location Button */}
          <TouchableOpacity
            style={styles.changeLocationButton}
            activeOpacity={0.7}
            onPress={() => { setPinDraft({ latitude: place.latitude, longitude: place.longitude }); setResults([]); setSearchError(''); setActivePicker('location'); }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }} pointerEvents="none">
              <Ionicons name="map-outline" size={16} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.changeLocationText}>{Number.isFinite(place.latitude) && Number.isFinite(place.longitude) ? 'Change Location' : 'Search for a venue'}</Text>
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
                <Text style={styles.flexInputText}>{startDate || 'Select start date'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openTimePicker('startTime')}>
              <Text style={styles.fieldLabel}>Start Time</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{startTime || 'Select start time'}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Row 2: End Date & End Time */}
          <View style={[styles.row, { marginTop: 14 }]}>
            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openDatePicker('endDate')}>
              <Text style={styles.fieldLabel}>End Date</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{endDate || 'Select end date'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.fieldFlex} activeOpacity={0.7} onPress={() => openTimePicker('endTime')}>
              <Text style={styles.fieldLabel}>End Time</Text>
              <View style={styles.inputWithIcon} pointerEvents="none">
                <Ionicons name="time-outline" size={16} color={theme.colors.primary} style={styles.inputIcon} />
                <Text style={styles.flexInputText}>{endTime || 'Select end time'}</Text>
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
          <ScrollView style={[styles.modalContent, { maxHeight: '85%' }]} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
            <Text style={styles.modalTitle}>Select Event Location</Text>
            <Text style={styles.presetAddress}>Find a venue in Sri Lanka. Select a result to save its address and exact map location.</Text>
            <TextInput accessibilityLabel="Venue search" placeholder="e.g. Galle Fort, Sri Lanka" maxLength={200} value={query}
              onChangeText={value => { searchVersion.current++; setSearching(false); setQuery(value); setResults([]); setSearchError(''); }}
              style={[styles.searchInput, { marginTop: 12 }]} returnKeyType="search" onSubmitEditing={runSearch} />
            <TouchableOpacity style={[styles.applyButton, (searching || query.trim().length < 3) && { opacity: 0.55 }]}
              disabled={searching || query.trim().length < 3} onPress={runSearch} accessibilityRole="button">
              {searching ? <ActivityIndicator color="#fff" /> : <Text style={styles.applyButtonText}>Search places</Text>}
            </TouchableOpacity>
            {results.map(result => <TouchableOpacity key={result.id} style={styles.locationPresetItem} onPress={() => selectPlace(result)} accessibilityRole="button">
              <Text style={styles.presetName}>{result.name}</Text><Text style={styles.presetAddress}>{result.address}</Text>
            </TouchableOpacity>)}
            {searchError ? <Text accessibilityRole="alert" style={styles.searchError}>{searchError}</Text> : null}
            <Text style={[styles.presetAddress, { marginTop: 16 }]}>Cannot find your venue? Zoom in, tap the map or drag the pin to its exact location.</Text>
            <View style={{ height: 260, marginTop: 12 }}><PlaceMap latitude={pinDraft.latitude} longitude={pinDraft.longitude} selectable onSelect={setPinDraft} /></View>
            <TouchableOpacity style={styles.applyButton} onPress={savePin} accessibilityRole="button"><Text style={styles.applyButtonText}>Use this pin</Text></TouchableOpacity>
            <Text style={[styles.presetAddress, { marginTop: 12 }]}>For a manually selected pin, enter or update the venue name, address and city on the form.</Text>
            <Text style={[styles.presetAddress, { marginTop: 12 }]}>Search data: OpenStreetMap contributors</Text>
            <TouchableOpacity onPress={() => setActivePicker(null)} style={{ paddingTop: 16 }}><Text style={styles.changeLocationText}>Close</Text></TouchableOpacity>
          </ScrollView>
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
                        if (y === TODAY.getFullYear() && calMonth < TODAY.getMonth()) setCalMonth(TODAY.getMonth());
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
        {error ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ color: theme.colors.danger, marginBottom: 10 }}>{error}</Text> : null}
        <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: { borderWidth: 1, borderColor: '#CBD5CF', borderRadius: 8, padding: 12, fontSize: 14 },
  searchError: { color: theme.colors.danger, marginVertical: 12 },
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
    height: 220,
    backgroundColor: '#E0F2FE',
    width: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
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
    width: '14.2857%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
    borderRadius: 19,
  },
  calendarDayCellEmpty: {
    width: '14.2857%',
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
