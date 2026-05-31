import { Drawer } from 'expo-router/drawer';
import { useColorScheme, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from 'expo-router/drawer';
import { Colors } from '@/constants/Colors';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { LogOut, Activity, Map, DollarSign, FileText, Users, Search, BrainCircuit, Bell } from 'lucide-react-native';
function CustomDrawerContent(props) {
  const {
    logoutUser
  } = useContext(AuthContext);
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return <View style={{
    flex: 1,
    backgroundColor: colors.background
  }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.header}>
          <Text style={[styles.title, {
          color: colors.primary
        }]}>RoadWatch</Text>
        </View>
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      <View style={[styles.footer, {
      borderTopColor: colors.surfaceBorder
    }]}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logoutUser}>
          <LogOut size={20} color={colors.danger} />
          <Text style={[styles.logoutText, {
          color: colors.danger
        }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>;
}
export default function DrawerLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  return <Drawer drawerContent={props => <CustomDrawerContent {...props} />} screenOptions={{
    headerStyle: {
      backgroundColor: colors.surface
    },
    headerTintColor: colors.text,
    drawerStyle: {
      backgroundColor: colors.background
    },
    drawerActiveTintColor: colors.primary,
    drawerInactiveTintColor: colors.textSecondary,
    drawerActiveBackgroundColor: colors.primaryGlow
  }}>
      <Drawer.Screen name="dashboard" options={{
      drawerLabel: 'Dashboard',
      title: 'Dashboard',
      drawerIcon: ({
        color,
        size
      }) => <Activity color={color} size={size} />
    }} />
      <Drawer.Screen name="roads" options={{
      drawerLabel: 'Roads',
      title: 'Roads Management',
      drawerIcon: ({
        color,
        size
      }) => <Map color={color} size={size} />
    }} />
      <Drawer.Screen name="budgets" options={{
      drawerLabel: 'Budgets',
      title: 'Budget Allocation',
      drawerIcon: ({
        color,
        size
      }) => <DollarSign color={color} size={size} />
    }} />
      <Drawer.Screen name="complaints" options={{
      drawerLabel: 'Complaints',
      title: 'User Complaints',
      drawerIcon: ({
        color,
        size
      }) => <Activity color={color} size={size} /> // Using Activity as warning isn't standard in lucide sometimes, let's use Activity
    }} />
      <Drawer.Screen name="contractors" options={{
      drawerLabel: 'Contractors',
      title: 'Contractor DB',
      drawerIcon: ({
        color,
        size
      }) => <Users color={color} size={size} />
    }} />
      <Drawer.Screen name="documents" options={{
      drawerLabel: 'Documents',
      title: 'Documents',
      drawerIcon: ({
        color,
        size
      }) => <FileText color={color} size={size} />
    }} />
      <Drawer.Screen name="search" options={{
      drawerLabel: 'Search',
      title: 'Search',
      drawerIcon: ({
        color,
        size
      }) => <Search color={color} size={size} />
    }} />
      <Drawer.Screen name="ai-predictor" options={{
      drawerLabel: 'AI Predictor',
      title: 'AI Predictor',
      drawerIcon: ({
        color,
        size
      }) => <BrainCircuit color={color} size={size} />
    }} />
      <Drawer.Screen name="notifications" options={{
      drawerLabel: 'Notifications',
      title: 'Notifications',
      drawerIcon: ({
        color,
        size
      }) => <Bell color={color} size={size} />
    }} />
    </Drawer>;
}
const styles = StyleSheet.create({
  header: {
    padding: 20,
    marginTop: 10,
    marginBottom: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  footer: {
    padding: 20,
    borderTopWidth: 1
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500'
  }
});