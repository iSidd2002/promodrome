'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import DataMigration from '@/components/DataMigration';
import { useBackgroundTimer } from '@/hooks/useBackgroundTimer';
import { useAudioNotifications } from '@/hooks/useAudioNotifications';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import OptimizedTimerDisplay from '@/components/OptimizedTimerDisplay';
import GuestPreview from '@/components/GuestPreview';
import AuthBanner from '@/components/AuthBanner';

// Types for our application
type SessionType = 'pomodoro' | 'shortBreak' | 'longBreak';
type TimerState = 'idle' | 'running' | 'paused';

interface Settings {
  pomodoroDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  longBreakInterval: number; // number of pomodoros before long break
}

export default function PomodoroTimer() {
  // Authentication
  const { data: session, status } = useSession();

  // Timer state
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [currentSession, setCurrentSession] = useState<SessionType>('pomodoro');

  // Session tracking
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Performance optimization - prevent unnecessary re-renders
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());

  // Session tracking
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);

  // Settings
  const [settings, setSettings] = useState<Settings>({
    pomodoroDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
  });

  // UI state
  const [showSettings, setShowSettings] = useState(false);

  // Refs for timer management
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Performance monitoring
  const { getMetrics } = usePerformanceMonitor('PomodoroTimer');

  // Audio notifications
  const { notify: playNotification } = useAudioNotifications({
    enabled: true, // TODO: Make this configurable in settings
  });

  // Background timer callbacks (memoized for performance)
  const handleTimerUpdate = useCallback((newTimeLeft: number) => {
    const now = Date.now();
    // Throttle updates to prevent excessive re-renders
    if (now - lastUpdateTime > 50) { // Max 20 FPS
      setTimeLeft(newTimeLeft);
      setLastUpdateTime(now);
    }
  }, [lastUpdateTime]);

  const handleTimerComplete = useCallback(async (sessionType: string) => {
    setTimerState('idle');

    // Play notification
    await playNotification(sessionType);

    // Complete the current session in the database
    if (currentSessionId) {
      await completeSession(currentSessionId, true);
      setCurrentSessionId(null);
      setSessionStartTime(null);
    }

    if (currentSession === 'pomodoro') {
      setPomodorosCompleted(prev => prev + 1);
    }

    const nextSession = getNextSession();
    setCurrentSession(nextSession);
    setTimeLeft(getSessionDuration(nextSession));
  }, [currentSessionId, currentSession, playNotification]);

  const handleTimerPaused = useCallback(() => {
    setTimerState('paused');
  }, []);

  const handleTimerResumed = useCallback(() => {
    setTimerState('running');
  }, []);

  // Background timer hook
  const {
    isWorkerReady,
    isTabVisible,
    startTimer: startBackgroundTimer,
    pauseTimer: pauseBackgroundTimer,
    resumeTimer: resumeBackgroundTimer,
    resetTimer: resetBackgroundTimer,
    updateTimer: updateBackgroundTimer,
  } = useBackgroundTimer({
    onTimerUpdate: handleTimerUpdate,
    onTimerComplete: handleTimerComplete,
    onTimerPaused: handleTimerPaused,
    onTimerResumed: handleTimerResumed,
  });

  // Load settings from user account or localStorage
  useEffect(() => {
    if (session) {
      // Load settings from user account
      loadUserSettings();
    } else {
      // Load settings from localStorage for non-authenticated users
      const savedSettings = localStorage.getItem('pomodoroSettings');
      const savedPomodorosCompleted = localStorage.getItem('pomodorosCompleted');

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          setTimeLeft(parsedSettings.pomodoroDuration * 60);
        } catch (error) {
          console.error('Error loading settings from localStorage:', error);
        }
      }

      if (savedPomodorosCompleted) {
        try {
          setPomodorosCompleted(parseInt(savedPomodorosCompleted) || 0);
        } catch (error) {
          console.error('Error loading pomodoros count from localStorage:', error);
        }
      }
    }
  }, [session]);

  // Load user settings from database
  const loadUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings');
      if (response.ok) {
        const userSettings = await response.json();
        setSettings(userSettings);
        // Update timer with loaded settings
        if (currentSession === 'pomodoro') {
          setTimeLeft(userSettings.pomodoroDuration * 60);
        }
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // Fallback to localStorage
      const savedSettings = localStorage.getItem('pomodoroSettings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          if (currentSession === 'pomodoro') {
            setTimeLeft(parsedSettings.pomodoroDuration * 60);
          }
        } catch (error) {
          console.error('Error loading settings from localStorage:', error);
        }
      }
    }
  };

  // Save settings to localStorage and user account whenever they change
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));

    // Also save to user account if authenticated
    if (session) {
      saveUserSettings(settings);
    }
  }, [settings, session]);

  // Save user settings to database
  const saveUserSettings = async (newSettings: typeof settings) => {
    try {
      await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  };

  // Start a new session in the database
  const startSession = async (sessionType: SessionType, duration: number) => {
    if (!session) return null;

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionType: sessionType.toUpperCase(),
          plannedDuration: duration * 60, // Convert minutes to seconds
          startTime: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const sessionData = await response.json();
        return sessionData.id;
      }
    } catch (error) {
      console.error('Failed to start session:', error);
    }
    return null;
  };

  // Complete a session in the database
  const completeSession = async (sessionId: string, completed: boolean = true) => {
    if (!session || !sessionId) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          completed,
          endTime: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to complete session:', error);
    }
  };

  // Save pomodoros completed to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('pomodorosCompleted', pomodorosCompleted.toString());
  }, [pomodorosCompleted]);

  // Helper function to format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function to get session duration in seconds
  const getSessionDuration = (sessionType: SessionType): number => {
    switch (sessionType) {
      case 'pomodoro':
        return settings.pomodoroDuration * 60;
      case 'shortBreak':
        return settings.shortBreakDuration * 60;
      case 'longBreak':
        return settings.longBreakDuration * 60;
    }
  };



  // Function to determine next session type
  const getNextSession = (): SessionType => {
    if (currentSession === 'pomodoro') {
      // Check if it's time for a long break
      if ((pomodorosCompleted + 1) % settings.longBreakInterval === 0) {
        return 'longBreak';
      } else {
        return 'shortBreak';
      }
    } else {
      // After any break, return to pomodoro
      return 'pomodoro';
    }
  };



  // Sync background timer when settings change
  useEffect(() => {
    if (isWorkerReady && timerState === 'idle') {
      updateBackgroundTimer(timeLeft, currentSession);
    }
  }, [isWorkerReady, timeLeft, currentSession, timerState, updateBackgroundTimer]);

  // Update timer when session type changes
  useEffect(() => {
    if (timerState === 'idle') {
      setTimeLeft(getSessionDuration(currentSession));
    }
  }, [currentSession, settings, timerState]);

  // Update page title with timer status
  useEffect(() => {
    const sessionName = currentSession === 'pomodoro' ? 'Focus' :
                       currentSession === 'shortBreak' ? 'Short Break' : 'Long Break';

    if (timerState === 'running') {
      document.title = `${formatTime(timeLeft)} - ${sessionName} | Pomodoro Timer`;
    } else if (timerState === 'paused') {
      document.title = `⏸️ ${formatTime(timeLeft)} - ${sessionName} | Pomodoro Timer`;
    } else {
      document.title = `${sessionName} Ready | Pomodoro Timer`;
    }

    // Reset title when component unmounts
    return () => {
      document.title = 'Pomodoro Timer';
    };
  }, [timeLeft, timerState, currentSession]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Authentication Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                🍅 Pomodoro Timer
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              {status === 'loading' ? (
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 h-8 w-20 rounded"></div>
              ) : session ? (
                <>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Hi, {session.user.name}
                  </span>
                  <Link
                    href="/dashboard"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => signOut()}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Authentication Banner for Guest Users */}
      {!session && <AuthBanner />}

      {/* Timer Content */}
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 4rem)' }}>
        <div className="w-full max-w-lg mx-auto">
          {/* Welcome Message for New Users */}
          {!session && (
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome to Pomodoro Timer! 🍅
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Start using the timer right away. No sign-up required!
              </p>
            </div>
          )}

        {/* Main Timer Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 text-center backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          {/* Session Type Tabs */}
          <div className="flex justify-center mb-6 md:mb-8">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-1 flex flex-wrap sm:flex-nowrap gap-1 sm:gap-0">
              {(['pomodoro', 'shortBreak', 'longBreak'] as SessionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setCurrentSession(type);
                    setTimerState('idle'); // Reset timer when switching sessions
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    currentSession === type
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {type === 'pomodoro' ? 'Focus' : type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </button>
              ))}
            </div>
          </div>

          {/* Optimized Timer Display */}
          <div className="mb-8">
            <OptimizedTimerDisplay
              timeLeft={timeLeft}
              totalTime={getSessionDuration(currentSession)}
              isRunning={timerState === 'running'}
              sessionType={currentSession}
            />
          </div>

          {/* Control Buttons */}
          {session ? (
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 md:mb-8 px-4">
            <button
              onClick={async () => {
                if (!isWorkerReady) return;

                if (timerState === 'running') {
                  // Pause timer
                  pauseBackgroundTimer();
                  setTimerState('paused');
                } else if (timerState === 'paused') {
                  // Resume timer
                  resumeBackgroundTimer();
                  setTimerState('running');
                } else {
                  // Start new timer
                  setTimerState('running');
                  startBackgroundTimer(timeLeft, currentSession);

                  // Start a new session if we're starting from idle
                  if (session) {
                    const sessionId = await startSession(currentSession, Math.ceil(timeLeft / 60));
                    if (sessionId) {
                      setCurrentSessionId(sessionId);
                      setSessionStartTime(new Date());
                    }
                  }
                }
              }}
              className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-semibold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                timerState === 'running'
                  ? 'bg-orange-500 hover:bg-orange-600 shadow-lg'
                  : 'bg-green-500 hover:bg-green-600 shadow-lg'
              }`}
            >
              {timerState === 'running' ? '⏸️ Pause' : '▶️ Start'}
            </button>

            <button
              onClick={async () => {
                if (!isWorkerReady) return;

                // Mark current session as incomplete if it exists
                if (currentSessionId) {
                  await completeSession(currentSessionId, false);
                  setCurrentSessionId(null);
                  setSessionStartTime(null);
                }

                const newTimeLeft = getSessionDuration(currentSession);
                setTimerState('idle');
                setTimeLeft(newTimeLeft);
                resetBackgroundTimer(newTimeLeft, currentSession);
              }}
              className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              🔄 Reset
            </button>
            </div>
          ) : (
            <GuestPreview>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6 md:mb-8 px-4">
                <button
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-semibold text-white bg-green-500 transition-all duration-200 cursor-not-allowed opacity-60"
                  disabled
                >
                  ▶️ Start
                </button>
                <button
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 transition-all duration-200 cursor-not-allowed opacity-60"
                  disabled
                >
                  🔄 Reset
                </button>
              </div>
            </GuestPreview>
          )}

          {/* Session Stats */}
          <div className="border-t dark:border-gray-700 pt-6">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center flex-1">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {pomodorosCompleted}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Pomodoros Completed
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Next long break in {settings.longBreakInterval - (pomodorosCompleted % settings.longBreakInterval)} pomodoros
                </div>
              </div>

              <button
                onClick={() => setPomodorosCompleted(0)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Session Tracking Status */}
          {session && (
            <div className="border-t dark:border-gray-700 pt-4">
              <div className="flex items-center justify-center space-x-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isWorkerReady ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
                  <span className="text-gray-600 dark:text-gray-300">
                    {isWorkerReady ? 'Background timer active' : 'Initializing background timer...'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Sessions tracked to account</span>
                {!isTabVisible && (
                  <span className="text-blue-500">• Running in background</span>
                )}
              </div>
              {currentSessionId && sessionStartTime && (
                <div className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Current session started at {sessionStartTime.toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* Settings Button */}
          <div className="border-t dark:border-gray-700 pt-6">
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 px-4 py-2 rounded-lg"
            >
              ⚙️ Settings
            </button>
          </div>
        </div>

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pomodoro Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.pomodoroDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, pomodoroDuration: parseInt(e.target.value) || 25 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.shortBreakDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, shortBreakDuration: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={settings.longBreakDuration}
                    onChange={(e) => setSettings(prev => ({ ...prev, longBreakDuration: parseInt(e.target.value) || 15 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Long Break Interval (pomodoros)
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={settings.longBreakInterval}
                    onChange={(e) => setSettings(prev => ({ ...prev, longBreakInterval: parseInt(e.target.value) || 4 }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    // Reset timer to new duration if idle
                    if (timerState === 'idle') {
                      setTimeLeft(getSessionDuration(currentSession));
                    }
                  }}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Data Migration Modal */}
      <DataMigration />
    </div>
  );
}
