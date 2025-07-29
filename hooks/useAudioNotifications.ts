import { useEffect, useRef, useCallback } from 'react';

interface UseAudioNotificationsProps {
  enabled: boolean;
}

export function useAudioNotifications({ enabled }: UseAudioNotificationsProps) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize Audio Context and load notification sound
  const initializeAudio = useCallback(async () => {
    if (isInitializedRef.current || !enabled) return;

    try {
      // Create AudioContext (works even when tab is not focused)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Generate a pleasant notification tone programmatically
      const sampleRate = audioContextRef.current.sampleRate;
      const duration = 0.5; // 500ms
      const frameCount = sampleRate * duration;
      
      const audioBuffer = audioContextRef.current.createBuffer(1, frameCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a pleasant two-tone notification sound
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        const frequency1 = 800; // First tone
        const frequency2 = 1000; // Second tone
        
        let sample = 0;
        if (t < 0.25) {
          // First tone
          sample = Math.sin(2 * Math.PI * frequency1 * t) * 0.3;
        } else {
          // Second tone
          sample = Math.sin(2 * Math.PI * frequency2 * t) * 0.3;
        }
        
        // Apply fade out
        const fadeOut = Math.max(0, 1 - (t / duration));
        sample *= fadeOut;
        
        channelData[i] = sample;
      }
      
      audioBufferRef.current = audioBuffer;
      isInitializedRef.current = true;
      
      console.log('Audio notifications initialized');
    } catch (error) {
      console.error('Failed to initialize audio notifications:', error);
    }
  }, [enabled]);

  // Play notification sound
  const playNotification = useCallback(async () => {
    if (!enabled || !audioContextRef.current || !audioBufferRef.current) {
      return;
    }

    try {
      // Resume AudioContext if suspended (required by browser policies)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Create and play the sound
      const source = audioContextRef.current.createBufferSource();
      const gainNode = audioContextRef.current.createGain();
      
      source.buffer = audioBufferRef.current;
      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      // Set volume
      gainNode.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
      
      source.start();
      
      console.log('Notification sound played');
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }, [enabled]);

  // Browser notification (with permission)
  const showBrowserNotification = useCallback(async (title: string, body: string) => {
    if (!enabled) return;

    try {
      // Request permission if not granted
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.log('Notification permission denied');
          return;
        }
      }

      if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'pomodoro-timer',
          requireInteraction: false,
          silent: false, // Allow sound
        });

        // Auto-close after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle click
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, [enabled]);

  // Combined notification function
  const notify = useCallback(async (sessionType: string) => {
    if (!enabled) return;

    const messages = {
      pomodoro: {
        title: '🍅 Pomodoro Complete!',
        body: 'Great work! Time for a break.',
      },
      'short-break': {
        title: '☕ Break Complete!',
        body: 'Ready to get back to work?',
      },
      'long-break': {
        title: '🌟 Long Break Complete!',
        body: 'Refreshed and ready for the next session!',
      },
    };

    const message = messages[sessionType as keyof typeof messages] || messages.pomodoro;

    // Play audio notification
    await playNotification();

    // Show browser notification
    await showBrowserNotification(message.title, message.body);

    // Vibrate on mobile devices
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  }, [enabled, playNotification, showBrowserNotification]);

  // Initialize audio on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initializeAudio();
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    if (enabled && !isInitializedRef.current) {
      document.addEventListener('click', handleUserInteraction);
      document.addEventListener('keydown', handleUserInteraction);
      document.addEventListener('touchstart', handleUserInteraction);
    }

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [enabled, initializeAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    notify,
    playNotification,
    showBrowserNotification,
    isInitialized: isInitializedRef.current,
  };
}
