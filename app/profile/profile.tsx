import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { auth, db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Theme } from '../../lib/theme';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { User } from 'firebase/auth'; // Assure-toi d'importer le type User
import { updatePassword } from 'firebase/auth'; // Import de updatePassword

export default function Profile() {
  const user = auth.currentUser as User | null;  // Casting explicite
  const [userData, setUserData] = useState({
    fullName: '',
    dateOfBirth: '',
    mobileNumber: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setUserData(docSnap.data() as {
            fullName: string;
            dateOfBirth: string;
            mobileNumber: string;
          });
        }
      } else {
        Alert.alert('Error', 'User is not authenticated.');
      }
    };

    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      // Mise à jour des informations de l'utilisateur
      const { fullName, dateOfBirth, mobileNumber } = userData;
      const userDoc = doc(db, 'users', user.uid);
      try {
        await updateDoc(userDoc, { fullName, dateOfBirth, mobileNumber });
        Alert.alert('Success', 'User information updated successfully');
        setIsEditing(false); // Désactive le mode édition après sauvegarde
      } catch (error) {
        Alert.alert('Error', 'Failed to update user information');
      }

      // Mise à jour du mot de passe
      if (newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          Alert.alert('Error', 'Passwords do not match');
          return;
        }

        // Utilisation de `updatePassword` de Firebase
        if (auth.currentUser) {
          try {
            // Appel à updatePassword avec `firebase.auth()`
            await updatePassword(auth.currentUser, newPassword);
            Alert.alert('Success', 'Password updated successfully');
            setNewPassword('');
            setConfirmPassword('');
          } catch (error) {
            Alert.alert('Error', 'Failed to update password');
          }
        } else {
          Alert.alert('Error', 'User is not authenticated.');
        }
      }
    } else {
      Alert.alert('Error', 'User is not authenticated.');
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={60}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Flèche retour */}
          <TouchableOpacity
            onPress={() => router.push('/dashboard')}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={Theme.colors.white} />
          </TouchableOpacity>

          <View style={styles.avatar} />
          <Text style={styles.title}>
            Welcome {userData.fullName?.split(' ')[0] || ''}
          </Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={user?.email || ''}
            editable={false}  // Email non modifiable
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value="********"
            editable={false}  // Le mot de passe est masqué et non modifiable ici
            secureTextEntry
          />

          <Text style={styles.label}>Mobile Number</Text>
          <TextInput
            style={styles.input}
            value={userData.mobileNumber}
            editable={isEditing} // Modifiable en mode édition
            onChangeText={(text) => setUserData((prev) => ({ ...prev, mobileNumber: text }))}
          />

          <Text style={styles.label}>Date of Birth</Text>
          <TextInput
            style={styles.input}
            value={userData.dateOfBirth}
            editable={isEditing} // Modifiable en mode édition
            onChangeText={(text) => setUserData((prev) => ({ ...prev, dateOfBirth: text }))}
          />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={userData.fullName}
            editable={isEditing} // Modifiable en mode édition
            onChangeText={(text) => setUserData((prev) => ({ ...prev, fullName: text }))}
          />

          {/* Mot de passe */}
          {isEditing && (
            <>
              <Text style={styles.label}>New Password</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          )}

          {/* Sauvegarder les modifications */}
          {isEditing && (
            <TouchableOpacity style={styles.button} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Changes</Text>
            </TouchableOpacity>
          )}

          {/* Lorsque l'utilisateur est en mode lecture */}
          {!isEditing && (
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => setIsEditing(true)} // Active le mode édition
            >
              <Text style={styles.buttonText}>Edit Information</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.background,
    padding: Theme.spacing.lg,
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 80,
    left: 20,
    zIndex: 10,
    backgroundColor: Theme.colors.primary,
    padding: 8,
    borderRadius: 30,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Theme.colors.secondary,
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontFamily: Theme.fonts.bold,
    fontSize: Theme.sizes.subtitle,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.lg,
  },
  label: {
    alignSelf: 'flex-start',
    fontFamily: Theme.fonts.medium,
    fontSize: Theme.fontSizes.md,
    color: Theme.colors.primary,
    marginTop: Theme.spacing.sm,
  },
  input: {
    width: '100%',
    height: Theme.heights.input,
    borderRadius: Theme.radii.md,
    backgroundColor: '#333',
    paddingHorizontal: Theme.spacing.md,
    color: Theme.colors.white,
    fontFamily: Theme.fonts.medium,
    marginBottom: Theme.spacing.sm,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    height: Theme.heights.button,
    borderRadius: Theme.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: Theme.spacing.lg,
  },
  buttonText: {
    color: Theme.colors.white,
    fontFamily: Theme.fonts.semiBold,
    fontSize: Theme.fontSizes.md,
  },
  editButton: {
    backgroundColor: Theme.colors.secondary,
  },
});
