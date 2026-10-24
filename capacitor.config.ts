import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'es.verkvest.aureline',
  appName: 'Aureline',
  webDir: 'browser/dist',
  backgroundColor: '#071421',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#071421',
  },
  android: {
    backgroundColor: '#071421',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#071421',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
}

export default config
