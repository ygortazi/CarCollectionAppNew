import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    Platform,
    Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    ChevronLeft,
    Calendar,
    ImagePlus,
    Save,
    X,
    Camera,
    Image as ImageIcon,
} from 'lucide-react-native';
import { TextInput, ScrollView as GestureScrollView, PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
    withSequence,
    useAnimatedGestureHandler,
    runOnJS,
    Easing,
} from 'react-native-reanimated';
import { useAuth } from '../../context/auth';
import { useTheme } from '../../context/theme';
import { Colors } from '../../constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage, deleteImage, generateStoragePath } from '../../utils/storage';
import type { StorageImage } from '../../types/storage';
import { getCar, updateCar } from '../../services/firestone';
import DateTimePickerModal from "react-native-modal-datetime-picker";

interface CarFormData {
    name: string;
    series: string;
    seriesNumber: string;
    year: string;
    yearNumber: string;
    color: string;
    purchaseDate: string;
    purchasePrice: string;
    purchaseStore: string;
    notes: string;
}

interface FormErrors {
    [key: string]: string;
}

interface DraggablePhotoProps {
    image: StorageImage;
    index: number;
    onReorder: (from: number, to: number) => void;
    onRemove: (index: number) => void;
    totalImages: number;
}

const THUMBNAIL_WIDTH = 100;
const THUMBNAIL_GAP = 12;

const DraggablePhoto = React.memo(({ image, index, onReorder, onRemove, totalImages }: DraggablePhotoProps) => {
    const position = useSharedValue({ x: 0, y: 0 });
    const isDragging = useSharedValue(false);
    const containerWidth = (THUMBNAIL_WIDTH + THUMBNAIL_GAP) * totalImages;

    const panGestureEvent = useAnimatedGestureHandler({
        onStart: (_, ctx: any) => {
            ctx.startX = position.value.x;
            isDragging.value = true;
        },
        onActive: (event, ctx) => {
            // Restrict movement to horizontal only
            const newX = ctx.startX + event.translationX;

            // Calculate boundaries
            const maxX = (totalImages - index - 1) * (THUMBNAIL_WIDTH + THUMBNAIL_GAP);
            const minX = -index * (THUMBNAIL_WIDTH + THUMBNAIL_GAP);

            // Clamp the position within boundaries
            position.value = {
                x: Math.max(minX, Math.min(maxX, newX)),
                y: 0
            };

            // Calculate new index based on position
            const newIndex = Math.max(0,
                Math.min(
                    Math.round(index + position.value.x / (THUMBNAIL_WIDTH + THUMBNAIL_GAP)),
                    totalImages - 1
                )
            );

            if (newIndex !== index) {
                runOnJS(onReorder)(index, newIndex);
                // Reset position after reorder
                position.value = { x: 0, y: 0 };
            }
        },
        onEnd: () => {
            // Animate back to original position
            position.value = withSpring(
                { x: 0, y: 0 },
                {
                    damping: 20,
                    stiffness: 200
                }
            );
            isDragging.value = false;
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: position.value.x },
            { translateY: position.value.y },
            {
                scale: withSpring(isDragging.value ? 1.1 : 1, {
                    damping: 15,
                    stiffness: 300
                })
            },
        ],
        zIndex: isDragging.value ? 1 : 0,
        shadowOpacity: withSpring(isDragging.value ? 0.2 : 0, {
            damping: 15,
            stiffness: 300
        }),
        shadowRadius: isDragging.value ? 8 : 0,
    }));

    return (
        <PanGestureHandler onGestureEvent={panGestureEvent}>
            <Animated.View style={[styles.photoWrapper, animatedStyle]}>
                <Image source={{ uri: image.uri }} style={styles.photo} />
                <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => onRemove(index)}
                    activeOpacity={0.7}
                >
                    <X size={16} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        </PanGestureHandler>
    );
});

export default function EditCarScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id } = params;
    const { user } = useAuth();
    const { theme } = useTheme();
    const colors = Colors[theme];

    const [isLoading, setIsLoading] = useState(false);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [formData, setFormData] = useState<CarFormData>({
        name: '',
        series: '',
        seriesNumber: '',
        year: '',
        yearNumber: '',
        color: '',
        purchaseDate: '',
        purchasePrice: '',
        purchaseStore: '',
        notes: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [customImages, setCustomImages] = useState<StorageImage[]>([]);

    const showDatePicker = () => {
        setDatePickerVisible(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisible(false);
    };

    const handleConfirm = (date: Date) => {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const formattedDate = localDate.toISOString().split('T')[0];
        setFormData(prev => ({ ...prev, purchaseDate: formattedDate }));
        hideDatePicker();
    };

    useEffect(() => {
        const fetchCar = async () => {
            if (!id) return;

            setIsLoading(true);
            try {
                const carData = await getCar(id as string);
                if (carData) {
                    const { images, ...rest } = carData;
                    setFormData(rest);
                    setCustomImages(images || []);
                }
            } catch (error) {
                console.error('Error fetching car:', error);
                Alert.alert('Error', 'Failed to load car details.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchCar();
    }, [id]);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        if (!formData.name.trim()) {
            newErrors.name = 'Car name is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const showImagePickerOptions = () => {
        Alert.alert(
            'Add Photo',
            'Choose a photo source',
            [
                {
                    text: 'Take Photo',
                    onPress: handleTakePhoto,
                },
                {
                    text: 'Choose from Library',
                    onPress: handleChooseFromLibrary,
                },
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
            ],
        );
    };

    const handleTakePhoto = async () => {
        if (customImages.length >= 2) {
            Alert.alert('Limit Reached', 'You can only add up to 2 custom photos per car.');
            return;
        }

        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Please allow camera access to take photos.');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                //aspect: [16, 9],//
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsLoading(true);
                const uri = result.assets[0].uri;
                const filename = `car_${Date.now()}.jpg`;
                const path = generateStoragePath(user!.uid, 'cars', filename);

                const downloadURL = await uploadImage(uri, path);
                setCustomImages(prev => [...prev, { uri, downloadURL, path }]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to take photo. Please try again.');
            console.error('Camera error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChooseFromLibrary = async () => {
        if (customImages.length >= 2) {
            Alert.alert('Limit Reached', 'You can only add up to 2 custom photos per car.');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                //aspect: [16, 9],//
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setIsLoading(true);
                const uri = result.assets[0].uri;
                const filename = `car_${Date.now()}.jpg`;
                const path = generateStoragePath(user!.uid, 'cars', filename);

                const downloadURL = await uploadImage(uri, path);
                setCustomImages(prev => [...prev, { uri, downloadURL, path }]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to upload image. Please try again.');
            console.error('Image upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReorderImages = useCallback((from: number, to: number) => {
        if (from === to) return;

        setCustomImages(prev => {
            const newImages = [...prev];
            const [movedItem] = newImages.splice(from, 1);
            newImages.splice(to, 0, movedItem);
            return newImages;
        });
    }, []);

    const handleRemovePhoto = useCallback(async (index: number) => {
        try {
            const image = customImages[index];
            if (!image.path) {
                console.warn('No storage path found for image');
                setCustomImages(prev => prev.filter((_, i) => i !== index));
                return;
            }

            // Extract the collection ID from the URL if it exists
            const match = image.path.match(/collections\/(.+?)\//);
            if (match) {
                // If the path contains 'collections', use it as is
                await deleteImage(image.path);
            } else {
                // If the path doesn't match the expected format, try to reconstruct it
                const filename = image.path.split('/').pop();
                if (filename && user?.uid) {
                    const correctedPath = generateStoragePath(user.uid, 'cars', filename);
                    await deleteImage(correctedPath);
                }
            }

            setCustomImages(prev => prev.filter((_, i) => i !== index));
        } catch (error: any) {
            if (error?.code === 'storage/object-not-found') {
                // If the image doesn't exist in storage, just remove it from the UI
                console.warn('Image not found in storage, removing from UI');
                setCustomImages(prev => prev.filter((_, i) => i !== index));
                return;
            }

            Alert.alert('Error', 'Failed to remove image. Please try again.');
            console.error('Image removal error:', error);
        }
    }, [customImages, user?.uid]);

    const handleSave = async () => {
        if (!validateForm() || !id) return;

        setIsLoading(true);
        try {
            await updateCar(id as string, {
                ...formData,
                images: customImages,
                updatedAt: new Date(),
            });
            router.back();
        } catch (error) {
            console.error('Error updating car:', error);
            Alert.alert('Error', 'Failed to update car. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />

            {/* Header */}
            <View style={[styles.header, {
                borderBottomColor: colors.border,
                backgroundColor: colors.background
            }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                        disabled={isLoading}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Car</Text>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            { backgroundColor: colors.primary },
                            isLoading && styles.saveButtonDisabled
                        ]}
                        onPress={handleSave}
                        disabled={isLoading}
                        activeOpacity={0.7}
                    >
                        <Save size={16} color="#fff" style={styles.saveIcon} />
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <GestureScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
            >
                {/* Photos Section */}
                <View style={[styles.section, {
                    borderBottomColor: colors.border,
                    backgroundColor: colors.background
                }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos</Text>
                    <View style={styles.photosContainer}>
                        {customImages.map((image, index) => (
                            <DraggablePhoto
                                key={image.uri}
                                image={image}
                                index={index}
                                onReorder={handleReorderImages}
                                onRemove={handleRemovePhoto}
                                totalImages={customImages.length}
                            />
                        ))}
                        {customImages.length < 2 && (
                            <TouchableOpacity
                                style={[styles.addPhotoButton, { borderColor: colors.border }]}
                                onPress={showImagePickerOptions}
                                activeOpacity={0.7}
                            >
                                <View style={styles.addPhotoContent}>
                                    <View style={styles.addPhotoIcons}>
                                        <Camera size={20} color={colors.primary} />
                                        <ImageIcon size={20} color={colors.primary} />
                                    </View>
                                    <Text style={[styles.addPhotoText, { color: colors.primary }]}>
                                        Add Photo
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Car Details Section */}
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Car Details</Text>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Name</Text>
                        <TextInput
                            style={[styles.input, {
                                borderColor: errors.name ? '#FF3B30' : colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            value={formData.name}
                            onChangeText={(text) => {
                                setFormData(prev => ({ ...prev, name: text }));
                                if (errors.name) {
                                    const newErrors = { ...errors };
                                    delete newErrors.name;
                                    setErrors(newErrors);
                                }
                            }}
                            placeholder="Enter car name"
                            placeholderTextColor={colors.secondary}
                            editable={!isLoading}
                        />
                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Series</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.series}
                                onChangeText={text => setFormData(prev => ({ ...prev, series: text }))}
                                placeholder="Enter series"
                                placeholderTextColor={colors.secondary}
                                editable={!isLoading}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 0.5, marginLeft: 12 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Series #</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.seriesNumber}
                                onChangeText={text => setFormData(prev => ({ ...prev, seriesNumber: text }))}
                                placeholder="0/10"
                                placeholderTextColor={colors.secondary}
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Year</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.year}
                                onChangeText={text => setFormData(prev => ({ ...prev, year: text }))}
                                placeholder="Enter year"
                                placeholderTextColor={colors.secondary}
                                keyboardType="numeric"
                                editable={!isLoading}
                            />
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Year #</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.yearNumber}
                                onChangeText={text => setFormData(prev => ({ ...prev, yearNumber: text }))}
                                placeholder="000/250"
                                placeholderTextColor={colors.secondary}
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Color</Text>
                        <TextInput
                            style={[styles.input, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            value={formData.color}
                            onChangeText={text => setFormData(prev => ({ ...prev, color: text }))}
                            placeholder="Enter color"
                            placeholderTextColor={colors.secondary}
                            editable={!isLoading}
                        />
                    </View>
                </View>

                {/* Purchase Details Section */}
                <View style={[styles.section, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Purchase Details</Text>

                    <View style={styles.formRow}>
                        <View style={[styles.formGroup, { flex: 1 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Purchase Date</Text>
                            <TouchableOpacity
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background
                                }]}
                                onPress={showDatePicker}
                                disabled={isLoading}
                            >
                                <View style={styles.dateInput}>
                                    <Calendar size={16} color={colors.text} style={styles.dateIcon} />
                                    <Text style={[styles.dateText, {
                                        color: formData.purchaseDate ? colors.text : colors.secondary
                                    }]}>
                                        {formData.purchaseDate || 'Select date'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
                            <Text style={[styles.label, { color: colors.text }]}>Price</Text>
                            <TextInput
                                style={[styles.input, {
                                    borderColor: colors.border,
                                    backgroundColor: colors.background,
                                    color: colors.text
                                }]}
                                value={formData.purchasePrice}
                                onChangeText={text => setFormData(prev => ({ ...prev, purchasePrice: text }))}
                                placeholder="0.00"
                                placeholderTextColor={colors.secondary}
                                keyboardType="decimal-pad"
                                editable={!isLoading}
                            />
                        </View>
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Store</Text>
                        <TextInput
                            style={[styles.input, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            value={formData.purchaseStore}
                            onChangeText={text => setFormData(prev => ({ ...prev, purchaseStore: text }))}
                            placeholder="Enter store name"
                            placeholderTextColor={colors.secondary}
                            editable={!isLoading}
                        />
                    </View>

                    <View style={styles.formGroup}>
                        <Text style={[styles.label, { color: colors.text }]}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.text
                            }]}
                            value={formData.notes}
                            onChangeText={text => setFormData(prev => ({ ...prev, notes: text }))}
                            placeholder="Add any notes about this item..."
                            placeholderTextColor={colors.secondary}
                            multiline
                            numberOfLines={4}
                            editable={!isLoading}
                        />
                    </View>
                </View>
            </GestureScrollView>

            {/* Premium Banner */}
            {user?.plan === 'Free' && (
                <View style={[styles.premiumBanner, { backgroundColor: colors.primary }]}>
                    <Text style={styles.premiumText}>
                        Upgrade to premium to add unlimited items to your collection and wishlist!
                    </Text>
                </View>
            )}

            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                maximumDate={new Date()}
                date={formData.purchaseDate ? new Date(formData.purchaseDate) : new Date()}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        borderBottomWidth: 1,
        paddingTop: Platform.OS === 'android' ? 16 : 0,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    saveButtonDisabled: {
        opacity: 0.5,
    },
    saveIcon: {
        marginRight: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 14,
        fontFamily: 'Inter-Medium',
    },
    content: {
        flex: 1,
    },
    section: {
        padding: 16,
        borderBottomWidth: 1,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        marginBottom: 12,
    },
    photosContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    photoWrapper: {
        width: THUMBNAIL_WIDTH,
        height: THUMBNAIL_WIDTH,
        borderRadius: 8,
        overflow: 'hidden',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 5,
    },
    photo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removePhotoButton: {
        position: 'absolute',
        top: 4,
        right: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 12,
        padding: 4,
        zIndex: 2,
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addPhotoContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    addPhotoIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    addPhotoText: {
        fontSize: 12,
        fontFamily: 'Inter-Medium',
        marginTop: 4,
    },
    formGroup: {
        marginBottom: 16,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Inter-Medium',
        marginBottom: 4,
    },
    input: {
        height: 48,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%',
    },
    dateIcon: {
        marginRight: 8,
    },
    dateText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        marginTop: 4,
    },
    premiumBanner: {
        padding: 12,
    },
    premiumText: {
        color: '#fff',
        textAlign: 'center',
        fontSize: 14,
        fontFamily: 'Inter-Regular',
    },
});
