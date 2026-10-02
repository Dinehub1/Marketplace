import { Ionicons } from '@expo/vector-icons';
import * as ImagePickerExpo from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';

interface ImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  allowMultiple?: boolean;
  title?: string;
  placeholder?: string;
}

interface ImageItem {
  uri: string;
  id: string;
}

export const ImagePicker: React.FC<ImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = 5,
  allowMultiple = true,
  title = 'Add Images',
  placeholder = 'Tap to add images',
}) => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePickerExpo.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to upload images.'
      );
      return false;
    }
    return true;
  };

  const showImagePickerOptions = () => {
    if (images.length >= maxImages) {
      Alert.alert('Limit Reached', `You can only add up to ${maxImages} images.`);
      return;
    }

    Alert.alert(
      'Select Image',
      'Choose an option to add image',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Gallery',
          onPress: openImageLibrary,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...images, result.assets[0].uri];
        onImagesChange(newImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    } finally {
      setLoading(false);
    }
  };

  const openImageLibrary = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: !allowMultiple,
        allowsMultipleSelection: allowMultiple && images.length < maxImages,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImageUris = result.assets.map(asset => asset.uri);
        const updatedImages = [...images, ...newImageUris].slice(0, maxImages);
        onImagesChange(updatedImages);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const renderAddButton = () => {
    if (images.length >= maxImages) return null;

    return (
      <TouchableOpacity
        style={styles.addButton}
        onPress={showImagePickerOptions}
        disabled={loading}
      >
        <Ionicons 
          name="add" 
          size={32} 
          color={loading ? Colors.gray400 : Colors.primary} 
        />
        <Text style={[styles.addButtonText, loading && styles.addButtonTextDisabled]}>
          {loading ? 'Loading...' : 'Add Image'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderImage = (uri: string, index: number) => (
    <View key={`${uri}-${index}`} style={styles.imageContainer}>
      <Image source={{ uri }} style={styles.image} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close" size={16} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );

  const renderPlaceholder = () => (
    <TouchableOpacity
      style={styles.placeholderContainer}
      onPress={showImagePickerOptions}
      disabled={loading}
    >
      <Ionicons 
        name="camera-outline" 
        size={48} 
        color={Colors.gray400} 
      />
      <Text style={styles.placeholderText}>{placeholder}</Text>
      <Text style={styles.placeholderSubtext}>
        {loading ? 'Loading...' : `Add up to ${maxImages} images`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {images.length === 0 ? (
        renderPlaceholder()
      ) : (
        <View style={styles.content}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imagesScrollContainer}
          >
            {images.map(renderImage)}
            {renderAddButton()}
          </ScrollView>
          
          <Text style={styles.imageCount}>
            {images.length} of {maxImages} images
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  title: {
    fontSize: Fonts.size.lg,
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  content: {
    gap: Spacing.md,
  },
  imagesScrollContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  placeholderContainer: {
    height: 200,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: 'dashed',
    backgroundColor: Colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  placeholderText: {
    fontSize: Fonts.size.base,
    fontWeight: Fonts.weight.medium,
    color: Colors.textSecondary,
  },
  placeholderSubtext: {
    fontSize: Fonts.size.sm,
    color: Colors.gray400,
  },
  imageContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: Spacing.borderRadius.lg,
    backgroundColor: Colors.gray200,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 120,
    height: 120,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addButtonText: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    color: Colors.primary,
  },
  addButtonTextDisabled: {
    color: Colors.gray400,
  },
  imageCount: {
    fontSize: Fonts.size.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
