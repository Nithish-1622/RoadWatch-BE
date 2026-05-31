import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, useColorScheme, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Search as SearchIcon, ExternalLink } from 'lucide-react-native';
import { searchRoads } from '@/api/search';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchRoads(query);
      setResults(data);
    } catch (error) {
      console.error('Search failed', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, {
    backgroundColor: colors.background
  }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, {
          color: colors.text
        }]}>Global Search</Text>
          <Text style={[styles.subtitle, {
          color: colors.textSecondary
        }]}>Search across roads, budgets, complaints, and documents instantly.</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.inputWrapper, {
          backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.2)' : '#ffffff',
          borderColor: colors.surfaceBorder
        }]}>
            <SearchIcon size={20} color={colors.textMuted} style={styles.searchIcon} />
            <TextInput style={[styles.input, {
            color: colors.text
          }]} placeholder="Enter search query..." placeholderTextColor={colors.textMuted} value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} returnKeyType="search" />
          </View>
          
          <TouchableOpacity onPress={handleSearch} disabled={loading}>
            <LinearGradient colors={[colors.primary, colors.secondary]} start={{
            x: 0,
            y: 0
          }} end={{
            x: 1,
            y: 1
          }} style={styles.searchBtn}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.searchBtnText}>Search</Text>}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {results && <View style={[styles.resultsContainer, {
        backgroundColor: colors.surface,
        borderColor: colors.surfaceBorder
      }]}>
            <Text style={[styles.resultsTitle, {
          color: colors.text
        }]}>Search Results ({Array.isArray(results) ? results.length : 0})</Text>
            
            {Array.isArray(results) && results.length > 0 ? <View style={styles.resultsList}>
                {results.map((item, index) => <View key={index} style={[styles.resultCard, {
            backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc',
            borderColor: colors.surfaceBorder
          }]}>
                    <View style={styles.resultContent}>
                      <Text style={[styles.resultName, {
                color: colors.primary
              }]}>{item.title || item.name || `Result #${index + 1}`}</Text>
                      <Text style={[styles.resultDesc, {
                color: colors.textSecondary
              }]} numberOfLines={2}>
                        {item.description || item.content || JSON.stringify(item)}
                      </Text>
                    </View>
                    <TouchableOpacity style={[styles.actionBtn, {
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]}>
                      <ExternalLink size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>)}
              </View> : <Text style={[styles.noResults, {
          color: colors.textMuted
        }]}>
                No results found for "{query}".
              </Text>}
          </View>}
      </ScrollView>
    </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16
  },
  searchIcon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16
  },
  searchBtn: {
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24
  },
  searchBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  resultsContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  resultsList: {
    gap: 12
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1
  },
  resultContent: {
    flex: 1,
    paddingRight: 16
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4
  },
  resultDesc: {
    fontSize: 14
  },
  actionBtn: {
    padding: 8,
    borderRadius: 8
  },
  noResults: {
    textAlign: 'center',
    paddingVertical: 32,
    fontSize: 16
  }
});