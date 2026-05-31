import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '@/context/AuthContext';
import { login } from '@/api/auth';
import { LogIn } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const {
    loginUser
  } = useContext(AuthContext);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const data = await login({
        email,
        password
      });
      await loginUser(data.user || {
        email
      }, data.accessToken || 'mock_token');
      // RootLayout will handle redirect to dashboard
    } catch (err) {
      const msg = err.response?.data?.message || 'Network Error: Make sure backend is running';
      Alert.alert('Login Failed', msg);
    } finally {
      setLoading(false);
    }
  };
  return <SafeAreaView style={[styles.container, {
    backgroundColor: colors.background
  }]}>
      <View style={[styles.card, {
      backgroundColor: colors.surface,
      borderColor: colors.surfaceBorder
    }]}>
        <View style={styles.header}>
          <LogIn size={48} color={colors.primary} />
          <Text style={[styles.title, {
          color: colors.text
        }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, {
          color: colors.textSecondary
        }]}>Sign in to RoadWatch</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, {
          color: colors.textSecondary
        }]}>Email</Text>
          <TextInput style={[styles.input, {
          backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
          color: colors.text,
          borderColor: colors.surfaceBorder
        }]} placeholder="Enter your email" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, {
          color: colors.textSecondary
        }]}>Password</Text>
          <TextInput style={[styles.input, {
          backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
          color: colors.text,
          borderColor: colors.surfaceBorder
        }]} placeholder="••••••••" placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <TouchableOpacity onPress={handleSubmit} disabled={loading}>
          <LinearGradient colors={[colors.primary, colors.secondary]} start={{
          x: 0,
          y: 0
        }} end={{
          x: 1,
          y: 1
        }} style={styles.button}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkContainer} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24
  },
  card: {
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8
    },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 5
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    gap: 8
  },
  title: {
    fontSize: 28,
    fontWeight: '700'
  },
  subtitle: {
    fontSize: 16
  },
  inputGroup: {
    marginBottom: 20,
    gap: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '500'
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  linkContainer: {
    marginTop: 24,
    alignItems: 'center'
  },
  linkText: {
    color: '#a78bfa',
    fontSize: 14
  }
});