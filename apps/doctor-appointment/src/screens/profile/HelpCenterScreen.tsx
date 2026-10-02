import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Colors, Fonts, Spacing } from '../../constants';
import { Header } from '../../components/common/Header';
import { useNavigation } from '@react-navigation/native';

export const HelpCenterScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title="Help Center" 
        showBackButton 
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Help Center Screen</Text>
        <Text style={styles.description}>
          This screen will show FAQs and help information.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  title: {
    fontSize: Fonts.size['2xl'],
    fontWeight: Fonts.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Fonts.size.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Fonts.lineHeight.relaxed * Fonts.size.base,
  },
});
