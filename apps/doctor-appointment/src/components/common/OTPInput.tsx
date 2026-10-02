import React, { useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  error?: string;
  disabled?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 4,
  value,
  onChange,
  onComplete,
  error,
  disabled = false,
}) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleChangeText = (text: string, index: number) => {
    const newOtp = value.split('');
    newOtp[index] = text;
    const otpString = newOtp.join('');
    
    onChange(otpString);

    // Move to next input if text is entered
    if (text && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }

    // Call onComplete when OTP is fully entered
    if (otpString.length === length && onComplete) {
      onComplete(otpString);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  const renderInput = (index: number) => {
    const isActive = focusedIndex === index;
    const hasValue = !!value[index];
    const hasError = !!error;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.inputContainer,
          isActive && styles.inputContainerActive,
          hasError && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
        onPress={() => {
          if (!disabled) {
            inputRefs.current[index]?.focus();
          }
        }}
      >
        <TextInput
          ref={(ref) => (inputRefs.current[index] = ref)}
          style={[
            styles.input,
            hasValue && styles.inputWithValue,
            hasError && styles.inputError,
            disabled && styles.inputDisabled,
          ]}
          value={value[index] || ''}
          onChangeText={(text) => handleChangeText(text.slice(-1), index)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
          editable={!disabled}
          textAlign="center"
          secureTextEntry={false}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        {Array.from({ length }, (_, index) => renderInput(index))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  inputsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  inputContainer: {
    width: 56,
    height: 56,
    borderRadius: Spacing.borderRadius.lg,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainerActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  inputContainerError: {
    borderColor: Colors.error,
  },
  inputContainerDisabled: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray300,
  },
  input: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  inputWithValue: {
    color: Colors.primary,
  },
  inputError: {
    color: Colors.error,
  },
  inputDisabled: {
    color: Colors.gray400,
  },
  errorText: {
    fontSize: Fonts.size.sm,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
