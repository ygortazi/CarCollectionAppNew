// components/ImageGallery.tsx
import React, { useState, useEffect } from 'react';
import {
    View,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    LayoutChangeEvent,
    Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { StorageImage } from '../../types/storage';

interface ImageGalleryProps {
    images: StorageImage[];
    backgroundColor?: string;
    onImagePress?: () => void;
    mode?: 'detail' | 'edit';
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
    images,
    backgroundColor = '#F5F5F5',
    onImagePress,
    mode = 'detail'
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [containerWidth, setContainerWidth] = useState(Dimensions.get('window').width);
    const [containerHeight, setContainerHeight] = useState(0);
    const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

    const hasMultipleImages = images.length > 1;
    const currentImage = images[currentIndex]?.downloadURL || '/api/placeholder/400/300';

    useEffect(() => {
        // Reset current index when images change
        setCurrentIndex(0);
    }, [images]);

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setContainerWidth(width);
        setContainerHeight(height);
    };

    useEffect(() => {
        // Get image dimensions to calculate optimal display size
        Image.getSize(currentImage, (width, height) => {
            const screenWidth = containerWidth;
            const screenHeight = mode === 'detail' ?
                Math.min(containerHeight, screenWidth * (3 / 2)) : // 3:2 aspect ratio for detail view
                Math.min(containerHeight, screenWidth * (4 / 3)); // 4:3 aspect ratio for edit view

            const imageAspectRatio = width / height;
            const screenAspectRatio = screenWidth / screenHeight;

            let newWidth, newHeight;

            if (imageAspectRatio > screenAspectRatio) {
                // Image is wider than screen
                newWidth = screenWidth;
                newHeight = screenWidth / imageAspectRatio;
            } else {
                // Image is taller than screen
                newHeight = screenHeight;
                newWidth = screenHeight * imageAspectRatio;
            }

            setImageSize({ width: newWidth, height: newHeight });
        }, (error) => {
            console.error('Error getting image size:', error);
            // Fallback to container dimensions
            setImageSize({ width: containerWidth, height: containerWidth * (3 / 2) });
        });
    }, [currentImage, containerWidth, containerHeight, mode]);

    const navigateImage = (direction: 'next' | 'prev') => {
        setCurrentIndex(prev => {
            if (direction === 'next') {
                return prev === images.length - 1 ? 0 : prev + 1;
            } else {
                return prev === 0 ? images.length - 1 : prev - 1;
            }
        });
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
                    source={{ uri: currentImage }}
                    style={[
                        styles.image,
                        {
                            width: imageSize.width,
                            height: imageSize.height
                        }
                    ]}
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
                            key={index}
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