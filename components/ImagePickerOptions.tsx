import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
} from 'react-native';
import Modal from 'react-native-modal';

interface ImagePickerOptionsProps {
    isVisible: boolean;
    onClose: () => void;
    onSelect: (option: 'crop' | 'resize') => void;
    mode: 'camera' | 'library' | null;
}

const ImagePickerOptions: React.FC<ImagePickerOptionsProps> = ({
    isVisible,
    onClose,
    onSelect,
    mode
}) => {

    // Ensure modal state resets when closing
    useEffect(() => {
        if (!isVisible) {
            console.log('ImagePickerOptions closed, resetting states if needed');
        }
    }, [isVisible]);

    // Handles closing with a slight delay to prevent UI glitches
    const handleClose = () => {
        setTimeout(onClose, 300);
    };

    return (
        <Modal
            isVisible={isVisible}
            onBackdropPress={handleClose}
            onBackButtonPress={handleClose}
            animationIn="slideInUp"
            animationOut="slideOutDown"
            useNativeDriver={true}
            hideModalContentWhileAnimating={true}
            backdropOpacity={0.5}
        >
            <View style={styles.modalContent}>
                <SafeAreaView>
                    <View style={styles.header}>
                        <Text style={styles.title}>Image Options</Text>
                        <Text style={styles.subtitle}>
                            Choose how you want to handle the image
                        </Text>
                    </View>

                    <View style={styles.optionsContainer}>
                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => onSelect('crop')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionText}>Crop image to fit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.option}
                            onPress={() => onSelect('resize')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionText}>
                                Resize image to fit (maintains aspect ratio)
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.option, styles.cancelOption]}
                            onPress={handleClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        paddingTop: 16,
        paddingBottom: 20,
        paddingHorizontal: 16,
        alignSelf: 'center',
        width: '90%',
    },
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    optionsContainer: {
        marginTop: 10,
    },
    option: {
        paddingVertical: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
    },
    optionText: {
        fontSize: 16,
        color: '#000',
    },
    cancelOption: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#DDD',
    },
    cancelText: {
        color: '#FF3B30',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ImagePickerOptions;
