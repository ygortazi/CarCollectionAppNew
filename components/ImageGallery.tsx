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
import type { StorageImage } from '../types/storage';
import { ImageDimensions } from '../types/common';

interface ImageGalleryProps {
    images: StorageImage[];
    backgroundColor?: string;
    onImagePress?: () => void;
    mode?: 'detail' | 'edit';
}

interface ImageUriObject {
    uri: string;
}

interface DownloadURLObject {
    uri: string;
    [key: string]: any;  // Allow other properties
}

function getImageUri(image: StorageImage | undefined): string | null {
    if (!image) return null;

    // Helper function to recursively find a valid URL
    function findValidUrl(obj: any): string | null {
        // If it's a string and a valid URL, return it
        if (typeof obj === 'string') {
            if (obj.startsWith('http') || obj.startsWith('file://') || obj.startsWith('data:image/')) {
                return obj;
            }
            return null;
        }

        // If it's not an object or is null, return null
        if (!obj || typeof obj !== 'object') {
            return null;
        }

        // First check downloadURL property
        if ('downloadURL' in obj) {
            const result = findValidUrl(obj.downloadURL);
            if (result) return result;
        }

        // Then check uri property
        if ('uri' in obj) {
            const result = findValidUrl(obj.uri);
            if (result) return result;
        }

        // Lastly check path property
        if ('path' in obj) {
            const result = findValidUrl(obj.path);
            if (result) return result;
        }

        // If none of the above work, return null
        return null;
    }

    const validUrl = findValidUrl(image);
    return validUrl;
}

function validateImageUri(uri?: string | null): boolean {
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

    const hasMultipleImages = images && images.length > 1;
    const currentImageUri = images && images[currentIndex]
        ? getImageUri(images[currentIndex])
        : null;

    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

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

        if (currentImageUri && validateImageUri(currentImageUri)) {
            Image.getSize(
                currentImageUri,
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
    }, [currentImageUri, containerWidth, containerHeight, mode]);

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
                    source={(() => {
                        const uri = getImageUri(images[currentIndex]);
                        if (uri && validateImageUri(uri)) {
                            return { uri };
                        }
                        return require('../assets/placeholder-image.png');
                    })()}
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