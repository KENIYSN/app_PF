import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TouchableWithoutFeedback,
  View,
  Text,
  SafeAreaView
} from "react-native";
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Theme } from '../../lib/theme';

interface HeaderProps {
  titleAnim: Animated.Value;
  subtitleAnim: Animated.Value;
  formAnim: Animated.Value;
}

const Header: React.FC<HeaderProps> = ({ titleAnim, subtitleAnim, formAnim }) => (
  <Animated.View style={[
    styles.headerContainer,
    {
      transform: [{
        translateY: formAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -50]
        })
      }],
      opacity: formAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 1, 1]
      })
    }
  ]}>
    <Animated.Text style={[
      styles.title,
      {
        transform: [
          { 
            translateY: titleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-40, 0]
            })
          },
          { 
            scale: titleAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.8, 1]
            })
          }
        ]
      }
    ]}>
      MyHealth
    </Animated.Text>

    <Animated.Text style={[
      styles.subtitle,
      {
        opacity: subtitleAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1]
        }),
        transform: [{
          translateY: subtitleAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-30, 0]
          })
        }]
      }
    ]}>
      Welcome
    </Animated.Text>
  </Animated.View>
);

interface LoginFormProps {
  email: string;
  password: string;
  loading: boolean;
  setEmail: (text: string) => void;
  setPassword: (text: string) => void;
  handleLogin: () => Promise<void>;
  formAnim: Animated.Value;
  router: any;
}

const LoginForm: React.FC<LoginFormProps> = ({ 
  email, 
  password, 
  loading,
  setEmail,
  setPassword,
  handleLogin,
  formAnim,
  router
}) => (
  <Animated.View style={[
    styles.formContainer,
    {
      opacity: formAnim,
      transform: [{
        translateY: formAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0]
        })
      }]
    }
  ]}>
    <View style={styles.inputGroup}>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="example@example.com"
        placeholderTextColor={Theme.colors.white}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="**********"
        placeholderTextColor={Theme.colors.white}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
    </View>

    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={handleLogin}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={styles.buttonText}>Log in</Text>
      )}
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.secondaryButton}
      onPress={() => router.push('/signUp')}
    >
      <Text style={styles.buttonText}>Sign up</Text>
    </TouchableOpacity>
  </Animated.View>
);

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const titleAnim = React.useRef(new Animated.Value(0)).current;
  const subtitleAnim = React.useRef(new Animated.Value(0)).current;
  const formAnim = React.useRef(new Animated.Value(0)).current;
  const formAnimValue = useRef(0);

  const [fontsLoaded] = useFonts({
    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
  });

  useEffect(() => {
    const listenerId = formAnim.addListener(({ value }) => {
      formAnimValue.current = value;
    });
    return () => {
      formAnim.removeListener(listenerId);
    };
  }, []);

  const startIntroAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(titleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(subtitleAnim, {
        toValue: 1,
        delay: 150,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const showForm = useCallback(() => {
    Animated.parallel([
      Animated.spring(formAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      startIntroAnimation();
    }
  }, [fontsLoaded]);

  const handleScreenPress = () => {
    if (formAnimValue.current < 0.5) {
      showForm();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
      alert(`Échec de la connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableWithoutFeedback onPress={handleScreenPress}>
        <View style={styles.container}>
          <Header 
            titleAnim={titleAnim} 
            subtitleAnim={subtitleAnim}
            formAnim={formAnim} 
          />
          
          <LoginForm
            email={email}
            password={password}
            loading={loading}
            setEmail={setEmail}
            setPassword={setPassword}
            handleLogin={handleLogin}
            formAnim={formAnim}
            router={router}
          />
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.dark,
  },
  container: {
    flex: 1,
    paddingHorizontal: Theme.spacing.lg,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 36,
    fontFamily: Theme.fonts.bold,
    color: Theme.colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.white,
  },
  formContainer: {
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.sizes.body,
    fontFamily: Theme.fonts.medium,
    color: Theme.colors.white,
    marginBottom: Theme.spacing.xs,
  },
  input: {
    height: Theme.heights.input,
    borderWidth: 1,
    borderColor: Theme.colors.white,
    borderRadius: Theme.radii.lg,
    paddingHorizontal: Theme.spacing.md,
    fontFamily: Theme.fonts.medium,
    fontSize: Theme.sizes.body,
    color: Theme.colors.white,
  },
  primaryButton: {
    height: Theme.heights.button,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radii.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  secondaryButton: {
    marginTop: Theme.spacing.lg,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: Theme.fonts.bold,
    fontSize: Theme.sizes.small,
    color: Theme.colors.white,
  },
});