  import { useState } from 'react';
  import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Platform,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ActivityIndicator,
    ScrollView,
  } from 'react-native';
  import DateTimePicker from '@react-native-community/datetimepicker';
  import { format } from 'date-fns';
  import { Theme } from '../../lib/theme';
  import { MaterialIcons } from '@expo/vector-icons';
  import { router } from 'expo-router';
  import { createUserWithEmailAndPassword } from 'firebase/auth';
  import { doc, setDoc } from 'firebase/firestore';
  import { auth, db } from '../../lib/firebase';

  export default function signUp() {
    const [formData, setFormData] = useState({
      fullName: '',
      email: '',
      password: '',
      mobileNumber: '',
      dateOfBirth: '',
    });

    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);

    const onChangeDate = (event: any, selectedDate?: Date) => {
      const currentDate = selectedDate || date;
      setShowDatePicker(Platform.OS === 'ios');
      setDate(currentDate);
      setFormData({
        ...formData,
        dateOfBirth: format(currentDate, 'dd/MM/yyyy'),
      });
    };

    const handleSignUp = async () => {
      if (!formData.email || !formData.password || !formData.fullName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password should be at least 6 characters');
        return;
      }

      setLoading(true);

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        await setDoc(doc(db, 'users', userCredential.user.uid), {
          fullName: formData.fullName,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          dateOfBirth: formData.dateOfBirth,
          createdAt: new Date().toISOString(),
        });

        Alert.alert('Success', 'Account created successfully!');
        router.replace('/dashboard');
      } catch (error: any) {
        let errorMessage = 'Sign up failed. Please try again.';
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.';
            break;
        }
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    };

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.push('/login')}
                style={styles.backButton}
                disabled={loading}
              >
                <MaterialIcons name="arrow-back" size={24} color={Theme.colors.white} />
              </TouchableOpacity>
              <Text style={styles.title}>New Account</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Full Name */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fullName}
                  onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                  editable={!loading}
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@example.com"
                  placeholderTextColor={Theme.colors.secondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  editable={!loading}
                />
              </View>

              {/* Password */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="********"
                  placeholderTextColor={Theme.colors.secondary}
                  secureTextEntry
                  value={formData.password}
                  onChangeText={(text) => setFormData({ ...formData, password: text })}
                  editable={!loading}
                />
              </View>

              {/* Mobile Number */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="06********"
                  placeholderTextColor={Theme.colors.secondary}
                  keyboardType="phone-pad"
                  value={formData.mobileNumber}
                  onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
                  editable={!loading}
                />
              </View>

              {/* Date Of Birth */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Date Of Birth</Text>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.dateText,
                      { color: formData.dateOfBirth ? Theme.colors.white : Theme.colors.secondary },
                    ]}
                  >
                    {formData.dateOfBirth || 'DD/MM/YYYY'}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    onChange={onChangeDate}
                    maximumDate={new Date()}
                  />
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.disabledButton]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Theme.colors.background,
      
    },
    scrollContainer: {
      paddingHorizontal: Theme.paddings.xl,
      paddingTop: Theme.spacing.x1l,
      paddingBottom: Theme.spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Theme.spacing.lg,
    },
    backButton: {
      position: 'absolute',
      left: 0,
      zIndex: 1,
      padding: Theme.spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: Theme.fontSizes.xl,
      fontFamily: Theme.fonts.bold,
      color: Theme.colors.primary,
      textAlign: 'center',
    },
    formContainer: {
      marginTop: Theme.spacing.md,
    },
    formGroup: {
      marginBottom: Theme.spacing.md,
    },
    label: {
      fontSize: Theme.fontSizes.md,
      fontFamily: Theme.fonts.medium,
      color: Theme.colors.white,
      marginBottom: Theme.spacing.xxs,
    },
    input: {
      height: Theme.heights.input,
      borderWidth: 1,
      borderRadius: Theme.radii.lg,
      borderColor: Theme.colors.white,
      justifyContent: 'center',
      paddingHorizontal: Theme.paddings.md,
      color: Theme.colors.white,
    },
    dateText: {
      fontFamily: Theme.fonts.medium,
      fontSize: Theme.fontSizes.md,
    },
    signUpButton: {
      height: Theme.heights.button,
      backgroundColor: Theme.colors.primary,
      borderRadius: Theme.radii.lgx,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: Theme.spacing.xl,
    },
    disabledButton: {
      opacity: 0.7,
    },
    signUpButtonText: {
      fontSize: Theme.fontSizes.md,
      fontFamily: Theme.fonts.semiBold,
      color: Theme.colors.white,
      textTransform: 'uppercase',
    },
  });
