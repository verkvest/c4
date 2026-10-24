const STORAGE_KEY = 'aureline.sound'

export function soundEnabled(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'off'
}

export function setSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off')
}

let audioContext: AudioContext | null = null

function context(): AudioContext | null {
  if (!soundEnabled()) {
    return null
  }
  const AudioCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!AudioCtor) {
    return null
  }
  if (!audioContext) {
    audioContext = new AudioCtor()
  }
  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }
  return audioContext
}

function tone(
  frequency: number,
  delay: number,
  duration: number,
  volume: number,
  type: OscillatorType,
) {
  try {
    const audio = context()
    if (!audio) {
      return
    }
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime + delay)
    gain.gain.setValueAtTime(volume, audio.currentTime + delay)
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audio.currentTime + delay + duration,
    )
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start(audio.currentTime + delay)
    oscillator.stop(audio.currentTime + delay + duration + 0.02)
  } catch {
    // Autoplay policies and headless browsers can reject audio.
  }
}

async function haptic(kind: 'light' | 'medium') {
  if (!soundEnabled()) {
    return
  }
  const bridge = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean }
    }
  ).Capacitor
  if (bridge?.isNativePlatform?.()) {
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      await Haptics.impact({
        style: kind === 'light' ? ImpactStyle.Light : ImpactStyle.Medium,
      })
    } catch {
      // The native shell is optional in the browser build.
    }
    return
  }
  if (typeof navigator.vibrate === 'function') {
    navigator.vibrate(kind === 'light' ? 12 : 24)
  }
}

export function playDrop(): void {
  tone(540, 0, 0.08, 0.045, 'triangle')
  void haptic('light')
}

export function playWin(): void {
  tone(523, 0, 0.12, 0.05, 'sine')
  tone(659, 0.11, 0.14, 0.05, 'sine')
  tone(784, 0.22, 0.2, 0.06, 'sine')
  void haptic('medium')
}

export function playDraw(): void {
  tone(330, 0, 0.14, 0.04, 'sine')
  tone(262, 0.12, 0.18, 0.035, 'sine')
}
