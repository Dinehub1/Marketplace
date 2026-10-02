import { useState } from 'react';
import { errorService, ErrorCodes } from '../services/errorService';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => string | null;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

export const useValidation = (rules: ValidationRules) => {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValid, setIsValid] = useState(false);

  const validateField = (name: string, value: string): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || value.trim().length === 0)) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    // Skip other validations if field is empty and not required
    if (!value && !rule.required) return null;

    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} must be at least ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} must be no more than ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return getPatternErrorMessage(name, rule.pattern);
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value);
    }

    return null;
  };

  const validate = (data: { [key: string]: string }): boolean => {
    const newErrors: ValidationErrors = {};
    let hasErrors = false;

    Object.keys(rules).forEach(fieldName => {
      const value = data[fieldName] || '';
      const error = validateField(fieldName, value);
      
      if (error) {
        newErrors[fieldName] = error;
        hasErrors = true;
      }
    });

    setErrors(newErrors);
    setIsValid(!hasErrors);
    
    return !hasErrors;
  };

  const validateSingle = (name: string, value: string): boolean => {
    const error = validateField(name, value);
    
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }));

    // Remove error if validation passed
    if (!error && errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    return !error;
  };

  const clearErrors = () => {
    setErrors({});
    setIsValid(false);
  };

  const clearFieldError = (fieldName: string) => {
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  const getFieldError = (fieldName: string): string => {
    return errors[fieldName] || '';
  };

  const hasFieldError = (fieldName: string): boolean => {
    return !!errors[fieldName];
  };

  return {
    errors,
    isValid,
    validate,
    validateSingle,
    clearErrors,
    clearFieldError,
    getFieldError,
    hasFieldError,
  };
};

// Helper function to get pattern-specific error messages
const getPatternErrorMessage = (fieldName: string, pattern: RegExp): string => {
  const emailPattern = /\S+@\S+\.\S+/;
  const phonePattern = /^\d{10}$/;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

  if (pattern.source === emailPattern.source) {
    return 'Please enter a valid email address';
  }
  
  if (pattern.source === phonePattern.source) {
    return 'Please enter a valid 10-digit phone number';
  }
  
  if (pattern.source === passwordPattern.source) {
    return 'Password must contain at least 8 characters with uppercase, lowercase, and number';
  }

  return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} format is invalid`;
};

// Predefined validation rules
export const ValidationRules = {
  email: {
    required: true,
    pattern: /\S+@\S+\.\S+/,
  },
  password: {
    required: true,
    minLength: 6,
  },
  strongPassword: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  },
  phone: {
    required: true,
    pattern: /^\d{10}$/,
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  required: {
    required: true,
  },
};
