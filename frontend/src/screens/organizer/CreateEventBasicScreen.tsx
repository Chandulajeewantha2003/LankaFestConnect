import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import useStepBack from './useStepBack';
import { StepProgressBar } from './components/StepProgressBar';

interface Props {
  navigation?: any;
  route?: any;
}

const CATEGORIES = ['Cultural', 'Food & Drink', 'Arts & Festival', 'Music', 'Sports', 'Community'];
const AUDIENCE_OPTIONS = ['All Ages', 'Families', 'Youth', 'Adults'];

export default function CreateEventBasicScreen({ navigation, route }: Props) {
  const existingData = route?.params?.eventData || {};

  const [title, setTitle] = useState<string>(existingData.title || '');
  const [description, setDescription] = useState<string>(existingData.description || '');
  const [category, setCategory] = useState<string>(existingData.category || 'Cultural');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [eventType, setEventType] = useState<'Physical Event' | 'Online Event'>(
    existingData.eventType || 'Physical Event'
  );
  const [selectedAudience, setSelectedAudience] = useState<string[]>(
    existingData.audience || ['All Ages']
  );

  const lastLoadedRef = React.useRef<string>('');

  React.useEffect(() => {
    const sig = JSON.stringify({
      id: existingData.id || existingData._id,
      title: existingData.title,
      description: existingData.description,
      category: existingData.category,
      eventType: existingData.eventType,
    });

    if (lastLoadedRef.current !== sig) {
      lastLoadedRef.current = sig;
      if (existingData.title !== undefined) setTitle(existingData.title);
      if (existingData.description !== undefined) setDescription(existingData.description);
      if (existingData.category !== undefined) setCategory(existingData.category);
      if (existingData.eventType !== undefined) setEventType(existingData.eventType);
      if (existingData.audience !== undefined) setSelectedAudience(existingData.audience);
    }
  }, [route?.params?.eventData]);

  const toggleAudience = (option: string) => {
    if (selectedAudience.includes(option)) {
      setSelectedAudience(selectedAudience.filter((item) => item !== option));
    } else {
      setSelectedAudience([...selectedAudience, option]);
    }
  };

  const isEditing = route?.params?.isEditing || !!(existingData.id || existingData._id);

  const [error, setError] = useState('');
  const handleNext = () => {
    if (!title.trim() || !description.trim() || !selectedAudience.length) { setError('Enter a title, description, and at least one audience.'); return; }
    setError('');
    const eventData = {
      ...existingData,
      title: title.trim(),
      description: description.trim(),
      category,
      eventType,
      audience: selectedAudience.length > 0 ? selectedAudience : ['All Ages'],
    };

    navigation?.navigate('CreateEventLocation', { eventData, isEditing });
  };

  useStepBack(() => navigation?.goBack());

  return (
    <View style={styles.container}>
      {/* Top Header matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Event' : 'Create Event'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar (Step 1 Basic) */}
      <StepProgressBar currentStep={1} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {error ? <Text accessibilityRole="alert" style={{ color: theme.colors.danger }}>{error}</Text> : null}
        {/* Event Title */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Event Title <Text style={styles.asterisk}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter event title"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Description <Text style={styles.asterisk}>*</Text>
          </Text>
          <View style={styles.textAreaContainer}>
            <TextInput
              style={styles.textArea}
              placeholder="Write a detailed description about your event..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              value={description}
              onChangeText={setDescription}
            />
            <Text style={styles.charCount}>{description.length}/500</Text>
          </View>
        </View>

        {/* Category */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            Category <Text style={styles.asterisk}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            activeOpacity={0.8}
            onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
          >
            <Text style={styles.dropdownText}>{category}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.colors.muted} />
          </TouchableOpacity>

          {showCategoryDropdown && (
            <View style={styles.dropdownMenu}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCategory(cat);
                    setShowCategoryDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      cat === category && { color: theme.colors.primary, fontWeight: '700' },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Event Type */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Event Type</Text>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setEventType('Physical Event')}
          >
            <Ionicons
              name={eventType === 'Physical Event' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={eventType === 'Physical Event' ? theme.colors.primary : '#D1D5DB'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.optionLabel}>Physical Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => setEventType('Online Event')}
          >
            <Ionicons
              name={eventType === 'Online Event' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={eventType === 'Online Event' ? theme.colors.primary : '#D1D5DB'}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.optionLabel}>Online Event</Text>
          </TouchableOpacity>
        </View>

        {/* Audience */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Audience</Text>
          {AUDIENCE_OPTIONS.map((option) => {
            const checked = selectedAudience.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={styles.checkboxOption}
                onPress={() => toggleAudience(option)}
              >
                <Ionicons
                  name={checked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={checked ? theme.colors.primary : '#D1D5DB'}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.optionLabel}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

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
    paddingBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
  asterisk: {
    color: theme.colors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#F9FAFB',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
    minHeight: 110,
    justifyContent: 'space-between',
  },
  textArea: {
    fontSize: 14,
    color: theme.colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  charCount: {
    fontSize: 11,
    color: theme.colors.muted,
    alignSelf: 'flex-end',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F9FAFB',
  },
  dropdownText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  dropdownMenu: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.sm,
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  optionLabel: {
    fontSize: 14,
    color: theme.colors.text,
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
});
