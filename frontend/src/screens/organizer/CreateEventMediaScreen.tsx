import React, { useState } from 'react';
import {
  Image,
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

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop',
];

export default function CreateEventMediaScreen({ navigation, route }: Props) {
  const eventData = route?.params?.eventData || {};

  const [images, setImages] = useState<string[]>(
    eventData.images && eventData.images.length > 0 ? eventData.images : DEFAULT_IMAGES
  );

  const [isPaid, setIsPaid] = useState<boolean>(eventData.isPaid || false);
  const [ticketPrice, setTicketPrice] = useState<string>(
    eventData.ticketPrice ? String(eventData.ticketPrice) : '1500'
  );

  const [foodAndBeverages, setFoodAndBeverages] = useState<boolean>(
    eventData.additionalInfo?.foodAndBeverages ?? true
  );
  const [wheelchairAccessible, setWheelchairAccessible] = useState<boolean>(
    eventData.additionalInfo?.wheelchairAccessible ?? false
  );
  const [familyFriendly, setFamilyFriendly] = useState<boolean>(
    eventData.additionalInfo?.familyFriendly ?? true
  );

  // Gallery image selection supporting expo-image-picker with fallback
  const handlePickImage = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted) {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });
        if (!result.canceled && result.assets && result.assets.length > 0) {
          if (images.length < 5) {
            setImages([...images, result.assets[0].uri]);
          }
          return;
        }
      }
    } catch (err) {
      console.log('ImagePicker gallery fallback:', err);
    }

    if (images.length < 5) {
      const samplePickerImages = [
        'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
      ];
      const nextImg = samplePickerImages[images.length % samplePickerImages.length];
      setImages([...images, nextImg]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const isEditing = route?.params?.isEditing || !!(eventData.id || eventData._id);

  const getUpdatedEventData = () => ({
    ...eventData,
    images,
    isPaid,
    ticketPrice: isPaid ? parseFloat(ticketPrice) || 0 : 0,
    additionalInfo: {
      foodAndBeverages,
      wheelchairAccessible,
      familyFriendly,
    },
  });

  const handleNext = () => {
    navigation?.navigate('CreateEventReview', { eventData: getUpdatedEventData(), isEditing });
  };

  return (
    <View style={styles.container}>
      {/* Top Header matching teammate shared style */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.navigate('CreateEventLocation', { eventData: getUpdatedEventData(), isEditing })} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Tickets & Media' : 'Create Event'}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Bar (Step 3 Media) */}
      <StepProgressBar
        currentStep={3}
        onStepPress={(step) => {
          if (step === 1) navigation?.navigate('CreateEventBasic', { eventData: getUpdatedEventData(), isEditing });
          if (step === 2) navigation?.navigate('CreateEventLocation', { eventData: getUpdatedEventData(), isEditing });
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Section: Event Images */}
        <Text style={styles.sectionTitle}>Event Images</Text>
        <Text style={styles.sectionSubtext}>Add high quality images (up to 5)</Text>

        {/* Featured Main Image Preview */}
        {images.length > 0 && (
          <View style={styles.featuredImageContainer}>
            <Image source={{ uri: images[0] }} style={styles.featuredImage} />
            <TouchableOpacity style={styles.removeBadge} onPress={() => handleRemoveImage(0)}>
              <Ionicons name="close" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Thumbnails Row */}
        <View style={styles.thumbnailsRow}>
          {images.slice(1).map((uri, idx) => (
            <View key={idx} style={styles.thumbContainer}>
              <Image source={{ uri }} style={styles.thumbImage} />
              <TouchableOpacity
                style={styles.thumbRemoveBadge}
                onPress={() => handleRemoveImage(idx + 1)}
              >
                <Ionicons name="close" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}

          {images.length < 5 && (
            <TouchableOpacity style={styles.addImageButton} onPress={handlePickImage} activeOpacity={0.8}>
              <Ionicons name="add" size={24} color={theme.colors.muted} />
              <Text style={styles.addImageText}>Add Image</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Section: Ticket Pricing */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Ticket Pricing</Text>

        <TouchableOpacity style={styles.radioOption} onPress={() => setIsPaid(false)}>
          <Ionicons
            name={!isPaid ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={!isPaid ? theme.colors.primary : '#D1D5DB'}
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Free Event</Text>
            <Text style={styles.optionSub}>No payment required</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.radioOption} onPress={() => setIsPaid(true)}>
          <Ionicons
            name={isPaid ? 'radio-button-on' : 'radio-button-off'}
            size={20}
            color={isPaid ? theme.colors.primary : '#D1D5DB'}
            style={{ marginRight: 10 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Paid Event</Text>
            <Text style={styles.optionSub}>Set ticket price</Text>
          </View>
        </TouchableOpacity>

        {isPaid && (
          <View style={styles.priceInputContainer}>
            <Text style={styles.currencyPrefix}>LKR</Text>
            <TextInput
              style={styles.priceInput}
              keyboardType="numeric"
              value={ticketPrice}
              onChangeText={setTicketPrice}
              placeholder="1500"
            />
          </View>
        )}

        {/* Section: Additional Information */}
        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Additional Information</Text>

        <TouchableOpacity style={styles.checkboxOption} onPress={() => setFoodAndBeverages(!foodAndBeverages)}>
          <Ionicons
            name={foodAndBeverages ? 'checkbox' : 'square-outline'}
            size={20}
            color={foodAndBeverages ? theme.colors.primary : '#D1D5DB'}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.checkboxLabel}>Food & Beverages Available</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkboxOption} onPress={() => setWheelchairAccessible(!wheelchairAccessible)}>
          <Ionicons
            name={wheelchairAccessible ? 'checkbox' : 'square-outline'}
            size={20}
            color={wheelchairAccessible ? theme.colors.primary : '#D1D5DB'}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.checkboxLabel}>Wheelchair Accessible</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.checkboxOption} onPress={() => setFamilyFriendly(!familyFriendly)}>
          <Ionicons
            name={familyFriendly ? 'checkbox' : 'square-outline'}
            size={20}
            color={familyFriendly ? theme.colors.primary : '#D1D5DB'}
            style={{ marginRight: 10 }}
          />
          <Text style={styles.checkboxLabel}>Family Friendly</Text>
        </TouchableOpacity>
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
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },
  sectionSubtext: {
    fontSize: 12,
    color: theme.colors.muted,
    marginBottom: 14,
  },
  featuredImageContainer: {
    position: 'relative',
    height: 180,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: 14,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  removeBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemoveBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 76,
    height: 76,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImageText: {
    fontSize: 10,
    color: theme.colors.muted,
    fontWeight: '600',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingVertical: 4,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
  },
  optionSub: {
    fontSize: 12,
    color: theme.colors.muted,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    marginVertical: 6,
    marginLeft: 30,
    backgroundColor: '#F9FAFB',
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text,
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: theme.colors.text,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxLabel: {
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
