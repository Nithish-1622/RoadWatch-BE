import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect, useContext } from 'react';
import { AuthProvider, AuthContext } from '@/context/AuthContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
function RootLayoutNav() {
  const {
    user,
    loading
  } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (!loading) {
      // @ts-ignore
      const inAuthGroup = segments[0] === '(auth)';
      if (!user && !inAuthGroup) {
        // @ts-ignore
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        // @ts-ignore
        router.replace('/(drawer)/dashboard');
      }
    }
  }, [user, loading, segments]);
  if (loading) {
    return <AnimatedSplashOverlay />;
  }
  return <Slot />;
}
export default function RootLayout() {
  return <GestureHandlerRootView style={{
    flex: 1
  }}>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </GestureHandlerRootView>;
}