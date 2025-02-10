import React, { useState, useEffect } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    LayoutChangeEvent,
    Platform,
    ImageSourcePropType,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { StorageImage } from '../types/storage';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

interface ImageGalleryProps {
    images: StorageImage[];
    backgroundColor?: string;
    onImagePress?: () => void;
    mode?: 'detail' | 'edit';
}

const storage = getStorage();

async function getImageUri(image: StorageImage | undefined): Promise<string | undefined> {
    if (!image) return undefined;

    try {
        // Always try to get a fresh URL from storage path first
        if (typeof image.path === 'string') {
            try {
                const imageRef = ref(storage, image.path);
                return await getDownloadURL(imageRef);
            } catch (storageError) {
                console.error('Storage error:', storageError);
            }
        }

        // If getting from storage fails, try using existing URLs
        if (typeof image.downloadURL === 'string' && image.downloadURL.includes('firebasestorage.googleapis.com')) {
            return image.downloadURL;
        }
        
        if (typeof image.uri === 'string' && image.uri.includes('firebasestorage.googleapis.com')) {
            return image.uri;
        }

        console.log('No valid URL found in image data');
        return undefined;
    } catch (error) {
        console.error('Error getting image URL:', error);
        return undefined;
    }
}

function validateImageUri(uri?: string | null | undefined): boolean {
    if (!uri || typeof uri !== 'string') return false;
    return uri.startsWith('file://') ||
        uri.startsWith('http://') ||
        uri.startsWith('https://') ||
        uri.startsWith('data:image/');
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images = [],
    backgroundColor = '#F5F5F5',
    onImagePress,
    mode = 'detail'
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const [containerHeight, setContainerHeight] = useState(0);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
    const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

    const hasMultipleImages = images && images.length > 1;

    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    useEffect(() => {
        const loadImage = async () => {
            console.log('Current image data:', images[currentIndex]); // Debug log
            const uri = await getImageUri(images[currentIndex]);
            setImageUrl(uri);
        };
        
        loadImage();
    }, [currentIndex, images]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerWidth(width);
        setContainerHeight(height);
    };

    useEffect(() => {
        const screenWidth = containerWidth;
        const screenHeight = mode === 'detail' ?
            Math.min(containerHeight, screenWidth * (3 / 2)) :
            Math.min(containerHeight, screenWidth * (4 / 3));

        if (imageUrl && validateImageUri(imageUrl)) {
            Image.getSize(
                imageUrl,
                (width, height) => {
                    const imageAspectRatio = width / height;
                    const screenAspectRatio = screenWidth / screenHeight;

                    let newWidth, newHeight;

                    if (imageAspectRatio > screenAspectRatio) {
                        newWidth = screenWidth;
                        newHeight = screenWidth / imageAspectRatio;
                    } else {
                        newHeight = screenHeight;
                        newWidth = screenHeight * imageAspectRatio;
                    }

                    setImageSize({ width: newWidth, height: newHeight });
                },
                (error) => {
                    setImageSize({ width: screenWidth, height: screenWidth * (3 / 2) });
                }
            );
        } else {
            setImageSize({ width: screenWidth, height: screenWidth * (3 / 2) });
        }
    }, [imageUrl, containerWidth, containerHeight, mode]);

    const navigateImage = (direction: 'next' | 'prev') => {
        if (!images || images.length <= 1) return;

        setCurrentIndex(prev => {
            if (direction === 'next') {
                return prev === images.length - 1 ? 0 : prev + 1;
            } else {
                return prev === 0 ? images.length - 1 : prev - 1;
            }
        });
    };

    const getImageSource = (): ImageSourcePropType => {
        if (imageUrl && validateImageUri(imageUrl)) {
            return { uri: imageUrl };
        }
        return require('../assets/placeholder-image.png');
    };

    return (
        <View
            style={[styles.container, { backgroundColor }]}
            onLayout={handleLayout}
        >
            <TouchableOpacity
                activeOpacity={onImagePress ? 0.7 : 1}
                onPress={onImagePress}
                style={styles.imageContainer}
            >
                <Image
                    source={getImageSource()}
                    style={[
                        styles.image,
                        {
                            width: imageSize.width,
                            height: imageSize.height
                        }
                    ]}
                    resizeMode="contain"
                />
            </TouchableOpacity>

            {hasMultipleImages && (
                <>
                    <TouchableOpacity
                        style={[styles.navigationButton, styles.leftButton]}
                        onPress={() => navigateImage('prev')}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={32} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.navigationButton, styles.rightButton]}
                        onPress={() => navigateImage('next')}
                        activeOpacity={0.7}
                    >
                        <ChevronRight size={32} color="#fff" />
                    </TouchableOpacity>
                </>
            )}

            {hasMultipleImages && (
                <View style={styles.pagination}>
                    {images.map((_, index) => (
                        <View
                            key={`dot-${index}`}
                            style={[
                                styles.paginationDot,
                                index === currentIndex && styles.paginationDotActive
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: Platform.select({ ios: 4 / 3, android: 3 / 2 }),
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        resizeMode: 'contain',
    },
    navigationButton: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 24,
        padding: 4,
        zIndex: 2,
    },
    leftButton: {
        left: 16,
    },
    rightButton: {
        right: 16,
    },
    pagination: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    paginationDotActive: {
        backgroundColor: '#fff',
    },
});

export default ImageGallery;