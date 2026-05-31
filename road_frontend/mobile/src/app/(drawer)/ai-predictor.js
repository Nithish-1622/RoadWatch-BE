import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Cpu, Send, Activity } from 'lucide-react-native';
import { predict } from '@/api/ai';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
export default function AIPredictorScreen() {
  const [inputData, setInputData] = useState('{\n  "traffic_volume": 5000,\n  "age_years": 10,\n  "last_maintenance_months": 24\n}');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const parsedData = JSON.parse(inputData);
      const data = await predict(parsedData);
      setPrediction(data);
    } catch (error) {
      console.error('Prediction failed', error);
      setPrediction({
        error: 'Failed to parse JSON or connect to AI Gateway.'
      });
    } finally {
      setLoading(false);
    }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, {
    backgroundColor: colors.background
  }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <LinearGradient colors={['#a855f7', '#8b5cf6']} start={{
          x: 0,
          y: 0
        }} end={{
          x: 1,
          y: 1
        }} style={styles.iconContainer}>
            <Cpu size={24} color="#fff" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={[styles.title, {
            color: colors.text
          }]}>AI Predictor</Text>
            <Text style={[styles.subtitle, {
            color: colors.textSecondary
          }]}>Leverage ML to predict road maintenance needs.</Text>
          </View>
        </View>

        <View style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
          <View style={styles.cardHeader}>
            <Activity size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, {
            color: colors.text
          }]}>Input Parameters</Text>
          </View>

          <Text style={[styles.label, {
          color: colors.textSecondary
        }]}>Road Telemetry Data (JSON format)</Text>
          <TextInput style={[styles.input, {
          backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#f8fafc',
          color: colors.text,
          borderColor: colors.surfaceBorder,
          fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
        }]} value={inputData} onChangeText={setInputData} multiline textAlignVertical="top" />

          <TouchableOpacity onPress={handlePredict} disabled={loading}>
            <LinearGradient colors={[colors.primary, colors.secondary]} start={{
            x: 0,
            y: 0
          }} end={{
            x: 1,
            y: 1
          }} style={styles.btn}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <>
                  <Send size={18} color="#fff" style={{
                marginRight: 8
              }} />
                  <Text style={styles.btnText}>Generate Prediction</Text>
                </>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
          <Text style={[styles.cardTitle, {
          color: colors.text,
          marginBottom: 16
        }]}>Prediction Results</Text>
          
          <View style={[styles.resultContainer, {
          backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.3)' : '#f1f5f9',
          borderColor: colors.surfaceBorder
        }]}>
            {loading ? <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{
              color: colors.primary,
              marginTop: 12
            }}>Running Inference...</Text>
              </View> : prediction ? prediction.error ? <Text style={[styles.errorText, {
            color: colors.danger
          }]}>{prediction.error}</Text> : <Text style={[styles.resultText, {
            color: colors.success,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace'
          }]}>
                  {JSON.stringify(prediction, null, 2)}
                </Text> : <View style={styles.centerBox}>
                <Text style={{
              color: colors.textSecondary
            }}>Awaiting input parameters...</Text>
              </View>}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 16
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerText: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2
  },
  card: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  label: {
    fontSize: 14,
    marginBottom: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    height: 200,
    marginBottom: 16,
    fontSize: 14
  },
  btn: {
    flexDirection: 'row',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  resultContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 150
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32
  },
  resultText: {
    fontSize: 14
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center'
  }
});