import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface StepProgressBarProps {
  currentStep: number; // 1 = Basic, 2 = Details, 3 = Media, 4 = Review
  onStepPress?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: 'Basic' },
  { step: 2, label: 'Details' },
  { step: 3, label: 'Media' },
  { step: 4, label: 'Review' },
];

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, onStepPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.stepsRow}>
        {STEPS.map((item, index) => {
          const isActive = item.step === currentStep;
          const isCompleted = item.step < currentStep;

          return (
            <React.Fragment key={item.step}>
              {/* Connector line between steps */}
              {index > 0 && (
                <View
                  style={[
                    styles.connectorLine,
                    item.step <= currentStep ? styles.activeConnectorLine : styles.inactiveConnectorLine,
                  ]}
                />
              )}

              {/* Step circle & label */}
              <TouchableOpacity
                disabled={!onStepPress || item.step > currentStep}
                onPress={() => onStepPress?.(item.step)}
                style={styles.stepItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.circle,
                    isActive && styles.activeCircle,
                    isCompleted && styles.completedCircle,
                    !isActive && !isCompleted && styles.inactiveCircle,
                  ]}
                >
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.circleText,
                        isActive ? styles.activeCircleText : styles.inactiveCircleText,
                      ]}
                    >
                      {item.step}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isActive && styles.activeStepLabel,
                    isCompleted && styles.completedStepLabel,
                    !isActive && !isCompleted && styles.inactiveStepLabel,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    zIndex: 2,
    width: 60,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeCircle: {
    backgroundColor: theme.colors.primary,
  },
  completedCircle: {
    backgroundColor: theme.colors.primary,
  },
  inactiveCircle: {
    backgroundColor: '#E5E7EB',
  },
  circleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeCircleText: {
    color: '#FFFFFF',
  },
  inactiveCircleText: {
    color: theme.colors.muted,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeStepLabel: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  completedStepLabel: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  inactiveStepLabel: {
    color: theme.colors.muted,
  },
  connectorLine: {
    flex: 1,
    height: 2,
    marginTop: -18,
  },
  activeConnectorLine: {
    backgroundColor: theme.colors.primary,
  },
  inactiveConnectorLine: {
    backgroundColor: '#E5E7EB',
  },
});
