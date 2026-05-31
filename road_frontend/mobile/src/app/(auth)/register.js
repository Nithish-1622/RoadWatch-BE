import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { register } from '@/api/auth';
import { UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
// We need to install this or use a simple alternative, for now I'll use a custom selectable component

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CITIZEN');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const handleSubmit = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role
      });
      Alert.alert('Success', 'Account created successfully');
      router.push('/(auth)/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Network Error: Make sure backend is running';
      Alert.alert('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };
  return <SafeAreaView style={[styles.container, {
    backgroundColor: colors.background
  }]}>
      <ScrollView contentContainerStyle={{
      flexGrow: 1,
      justifyContent: 'center'
    }}>
        <View style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
          <View style={styles.header}>
            <UserPlus size={48} color={colors.primary} />
            <Text style={[styles.title, {
            color: colors.text
          }]}>Create Account</Text>
            <Text style={[styles.subtitle, {
            color: colors.textSecondary
          }]}>Join RoadWatch</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {
            color: colors.textSecondary
          }]}>Name</Text>
            <TextInput style={[styles.input, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
            color: colors.text,
            borderColor: colors.surfaceBorder
          }]} placeholder="Enter your name" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
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

          <View style={styles.inputGroup}>
            <Text style={[styles.label, {
            color: colors.textSecondary
          }]}>Role</Text>
            <View style={{
            flexDirection: 'row',
            gap: 10
          }}>
              <TouchableOpacity style={[styles.roleButton, {
              borderColor: colors.surfaceBorder
            }, role === 'CITIZEN' && {
              backgroundColor: colors.primaryGlow,
              borderColor: colors.primary
            }]} onPress={() => setRole('CITIZEN')}>
                <Text style={[{
                color: colors.text
              }, role === 'CITIZEN' && {
                color: colors.primary,
                fontWeight: 'bold'
              }]}>Citizen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.roleButton, {
              borderColor: colors.surfaceBorder
            }, role === 'GOVERNMENT' && {
              backgroundColor: colors.primaryGlow,
              borderColor: colors.primary
            }]} onPress={() => setRole('GOVERNMENT')}>
                <Text style={[{
                color: colors.text
              }, role === 'GOVERNMENT' && {
                color: colors.primary,
                fontWeight: 'bold'
              }]}>Gov Official</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={loading}>
            <LinearGradient colors={[colors.primary, colors.secondary]} start={{
            x: 0,
            y: 0
          }} end={{
            x: 1,
            y: 1
          }} style={styles.button}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkContainer} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center'
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