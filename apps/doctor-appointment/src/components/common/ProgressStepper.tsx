import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps?: number[];
  variant?: 'horizontal' | 'vertical';
  showLabels?: boolean;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStep,
  completedSteps = [],
  variant = 'horizontal',
  showLabels = true,
}) => {
  const getStepStatus = (index: number) => {
    if (completedSteps.includes(index)) return 'completed';
    if (index === currentStep) return 'active';
    if (index < currentStep) return 'completed';
    return 'inactive';
  };

  const renderStepIcon = (index: number, status: string) => {
    if (status === 'completed') {
      return (
        <View style={[styles.stepIcon, styles.stepIconCompleted]}>
          <Ionicons name="checkmark" size={16} color={Colors.white} />
        </View>
      );
    }

    return (
      <View style={[
        styles.stepIcon,
        status === 'active' && styles.stepIconActive,
        status === 'inactive' && styles.stepIconInactive,
      ]}>
        <Text style={[
          styles.stepNumber,
          status === 'active' && styles.stepNumberActive,
          status === 'inactive' && styles.stepNumberInactive,
        ]}>
          {index + 1}
        </Text>
      </View>
    );
  };

  const renderConnector = (index: number) => {
    if (index === steps.length - 1) return null;

    const isCompleted = index < currentStep || completedSteps.includes(index);
    
    return (
      <View style={[
        variant === 'horizontal' ? styles.connectorHorizontal : styles.connectorVertical,
        isCompleted && styles.connectorCompleted,
      ]} />
    );
  };

  const renderStep = (step: Step, index: number) => {
    const status = getStepStatus(index);
    
    if (variant === 'vertical') {
      return (
        <View key={step.id} style={styles.stepVertical}>
          <View style={styles.stepVerticalIcon}>
            {renderStepIcon(index, status)}
            {renderConnector(index)}
          </View>
          
          {showLabels && (
            <View style={styles.stepVerticalContent}>
              <Text style={[
                styles.stepTitle,
                status === 'active' && styles.stepTitleActive,
                status === 'inactive' && styles.stepTitleInactive,
              ]}>
                {step.title}
              </Text>
              {step.description && (
                <Text style={styles.stepDescription}>
                  {step.description}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    }

    return (
      <View key={step.id} style={styles.stepHorizontal}>
        {renderStepIcon(index, status)}
        {renderConnector(index)}
        
        {showLabels && (
          <View style={styles.stepHorizontalContent}>
            <Text style={[
              styles.stepTitle,
              status === 'active' && styles.stepTitleActive,
              status === 'inactive' && styles.stepTitleInactive,
            ]}>
              {step.title}
            </Text>
            {step.description && (
              <Text style={styles.stepDescription}>
                {step.description}
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[
      styles.container,
      variant === 'vertical' && styles.containerVertical,
    ]}>
      {steps.map(renderStep)}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.md,
  },
  containerVertical: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  
  // Horizontal layout
  stepHorizontal: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  stepHorizontalContent: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  
  // Vertical layout
  stepVertical: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  stepVerticalIcon: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  stepVerticalContent: {
    flex: 1,
    paddingTop: 2,
  },
  
  // Step icon
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  stepIconActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepIconCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  stepIconInactive: {
    backgroundColor: Colors.white,
    borderColor: Colors.gray300,
  },
  
  // Step number
  stepNumber: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.semibold,
  },
  stepNumberActive: {
    color: Colors.white,
  },
  stepNumberInactive: {
    color: Colors.gray400,
  },
  
  // Connectors
  connectorHorizontal: {
    position: 'absolute',
    top: 15,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: Colors.gray300,
    zIndex: -1,
  },
  connectorVertical: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.gray300,
    marginTop: Spacing.sm,
  },
  connectorCompleted: {
    backgroundColor: Colors.success,
  },
  
  // Labels
  stepTitle: {
    fontSize: Fonts.size.sm,
    fontWeight: Fonts.weight.medium,
    textAlign: 'center',
  },
  stepTitleActive: {
    color: Colors.primary,
  },
  stepTitleInactive: {
    color: Colors.gray400,
  },
  stepDescription: {
    fontSize: Fonts.size.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
