import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';

interface ImageProcessingOptions {
    mode: 'crop' | 'resize';
    targetWidth: number;
    targetHeight: number;
}

interface ImageDimensions {
    width: number;
    height: number;
}

export async function processImage(uri: string, options: ImageProcessingOptions): Promise<string> {
    const { mode, targetWidth, targetHeight } = options;

    // First get the image dimensions
    const imageDimensions = await new Promise<ImageDimensions>((resolve, reject) => {
        Image.getSize(
            uri,
            (width: number, height: number) => resolve({ width, height }),
            (error) => reject(error)
        );
    });

    const { width, height } = imageDimensions;

    if (mode === 'crop') {
        // Calculate crop dimensions to maintain aspect ratio
        const targetRatio = targetWidth / targetHeight;
        const imageRatio = width / height;

        let cropWidth = width;
        let cropHeight = height;

        if (imageRatio > targetRatio) {
            // Image is wider than target ratio
            cropWidth = height * targetRatio;
        } else {
            // Image is taller than target ratio
            cropHeight = width / targetRatio;
        }

        // Calculate crop origin to center the crop
        const originX = Math.floor((width - cropWidth) / 2);
        const originY = Math.floor((height - cropHeight) / 2);

        const result = await ImageManipulator.manipulateAsync(
            uri,
            [
                {
                    crop: {
                        originX,
                        originY,
                        width: Math.floor(cropWidth),
                        height: Math.floor(cropHeight),
                    },
                },
                {
                    resize: {
                        width: targetWidth,
                        height: targetHeight,
                    },
                },
            ],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        return result.uri;
    } else {
        // Resize mode - maintain aspect ratio
        const imageRatio = width / height;
        const targetRatio = targetWidth / targetHeight;

        let resizeWidth = targetWidth;
        let resizeHeight = targetHeight;

        if (imageRatio > targetRatio) {
            // Image is wider, use target width
            resizeHeight = Math.floor(targetWidth / imageRatio);
        } else {
            // Image is taller, use target height
            resizeWidth = Math.floor(targetHeight * imageRatio);
        }

        const result = await ImageManipulator.manipulateAsync(
            uri,
            [
                {
                    resize: {
                        width: resizeWidth,
                        height: resizeHeight,
                    },
                },
            ],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        return result.uri;
    }
}