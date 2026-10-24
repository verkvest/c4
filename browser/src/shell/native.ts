export async function bootNativeShell(onBack: () => void): Promise<void> {
  const bridge = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean }
    }
  ).Capacitor
  if (!bridge?.isNativePlatform?.()) {
    return
  }
  try {
    const [{ App }, { SplashScreen }, { StatusBar, Style }] = await Promise.all(
      [
        import('@capacitor/app'),
        import('@capacitor/splash-screen'),
        import('@capacitor/status-bar'),
      ],
    )
    await StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {})
    await StatusBar.setStyle({ style: Style.Dark }).catch(() => {})
    await App.addListener('backButton', () => {
      onBack()
    })
    await SplashScreen.hide()
  } catch (error) {
    console.error('Native shell setup failed', error)
  }
}

export async function exitNativeApp(): Promise<void> {
  const bridge = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean }
    }
  ).Capacitor
  if (!bridge?.isNativePlatform?.()) {
    return
  }
  const { App } = await import('@capacitor/app')
  await App.exitApp()
}
