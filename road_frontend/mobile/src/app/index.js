import { Redirect } from 'expo-router';
import { useContext } from 'react';
import { AuthContext } from '@/context/AuthContext';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
export default function Index() {
  const {
    user,
    loading
  } = useContext(AuthContext);
  if (loading) {
    return <AnimatedSplashOverlay />;
  }
  if (user) {
    // @ts-ignore
    return <Redirect href={'/(drawer)/dashboard'} />;
  }
  // @ts-ignore
  return <Redirect href={'/(auth)/login'} />;
}