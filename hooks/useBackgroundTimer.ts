import { useEffect, useRef, useCallback, useState } from 'react';

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  sessionType: string;
}

interface UseBackgroundTimerProps {
  onTimerUpdate: (timeLeft: number) => void;
  onTimerComplete: (sessionType: string) => void;
  onTimerPaused: () => void;
  onTimerResumed: () => void;
}

export function useBackgroundTimer({
  onTimerUpdate,
  onTimerComplete,
  onTimerPaused,
  onTimerResumed,
}: UseBackgroundTimerProps) {
  const workerRef = useRef<Worker | null>(null);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const lastUpdateTimeRef = useRef<number>(0); // Start with 0 to indicate no updates yet
  const hasStartedTimerRef = useRef(false); // Track if timer has been started

  // Initialize Web Worker
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        workerRef.current = new Worker('/timer-worker.js');
        
        workerRef.current.onmessage = (event) => {
          const { type, ...data } = event.data;
          
          switch (type) {
            case 'WORKER_READY':
              setIsWorkerReady(true);
              break;
              
            case 'TIMER_UPDATE':
              // Worker updates are now secondary to main thread timer
              lastUpdateTimeRef.current = Date.now();
              break;
              
            case 'TIMER_COMPLETE':
              onTimerComplete(data.sessionType);
              break;
              
            case 'TIMER_PAUSED':
              onTimerPaused();
              break;
              
            case 'TIMER_RESUMED':
              onTimerResumed();
              break;
              
            case 'TIMER_RESET':
              onTimerUpdate(data.timeLeft);
              break;

            case 'TIMER_STATE':
              // Handle timer state sync message - only if timer is actually running
              if (data.isRunning && data.timeLeft !== undefined) {
                onTimerUpdate(data.timeLeft);
              }
              break;

            default:
              console.log('Unknown worker message:', type, data);
          }
        };
        
        workerRef.current.onerror = (error) => {
          console.error('Timer worker error:', error);
          setIsWorkerReady(false);
        };
      } catch (error) {
        console.error('Failed to create timer worker:', error);
        setIsWorkerReady(false);
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [onTimerUpdate, onTimerComplete, onTimerPaused, onTimerResumed]);

  // Page Visibility API for tab focus detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      
      if (isVisible && workerRef.current && isWorkerReady && hasStartedTimerRef.current) {
        // Only sync if we have actually started a timer before
        // Request current state when tab becomes visible
        workerRef.current.postMessage({ type: 'GET_STATE' });

        // Check if we missed any updates while tab was hidden
        const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
        if (lastUpdateTimeRef.current > 0 && timeSinceLastUpdate > 5000) { // More than 5 seconds and we've had updates before
          console.log('Tab was hidden for', timeSinceLastUpdate, 'ms - syncing timer state');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isWorkerReady]);

  // Main thread timer (fallback for development issues)
  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const timerStateRef = useRef<{timeLeft: number, isRunning: boolean, sessionType: string}>({
    timeLeft: 0,
    isRunning: false,
    sessionType: 'pomodoro'
  });

  // Main thread timer (reliable for development)
  const startTimer = useCallback((timeLeft: number, sessionType: string) => {
    // Clear any existing timer
    if (mainTimerRef.current) {
      clearInterval(mainTimerRef.current);
    }

    // Set up timer state
    timerStateRef.current = {
      timeLeft,
      isRunning: true,
      sessionType
    };

    hasStartedTimerRef.current = true;
    lastUpdateTimeRef.current = Date.now();

    // Send initial update
    onTimerUpdate(timeLeft);

    // Start main thread interval
    mainTimerRef.current = setInterval(() => {
      if (timerStateRef.current.isRunning && timerStateRef.current.timeLeft > 0) {
        timerStateRef.current.timeLeft--;
        onTimerUpdate(timerStateRef.current.timeLeft);

        if (timerStateRef.current.timeLeft <= 0) {
          timerStateRef.current.isRunning = false;
          if (mainTimerRef.current) {
            clearInterval(mainTimerRef.current);
            mainTimerRef.current = null;
          }
          onTimerComplete(timerStateRef.current.sessionType);
        }
      }
    }, 1000);
  }, [onTimerUpdate, onTimerComplete]);

  const pauseTimer = useCallback(() => {
    timerStateRef.current.isRunning = false;
    if (mainTimerRef.current) {
      clearInterval(mainTimerRef.current);
      mainTimerRef.current = null;
    }
    onTimerPaused();
  }, [onTimerPaused]);

  const resumeTimer = useCallback(() => {
    if (timerStateRef.current.timeLeft > 0) {
      timerStateRef.current.isRunning = true;

      mainTimerRef.current = setInterval(() => {
        if (timerStateRef.current.isRunning && timerStateRef.current.timeLeft > 0) {
          timerStateRef.current.timeLeft--;
          onTimerUpdate(timerStateRef.current.timeLeft);

          if (timerStateRef.current.timeLeft <= 0) {
            timerStateRef.current.isRunning = false;
            if (mainTimerRef.current) {
              clearInterval(mainTimerRef.current);
              mainTimerRef.current = null;
            }
            onTimerComplete(timerStateRef.current.sessionType);
          }
        }
      }, 1000);

      onTimerResumed();
    }
  }, [onTimerUpdate, onTimerComplete, onTimerResumed]);

  const resetTimer = useCallback((timeLeft: number, sessionType: string) => {
    timerStateRef.current = {
      timeLeft,
      isRunning: false,
      sessionType
    };

    if (mainTimerRef.current) {
      clearInterval(mainTimerRef.current);
      mainTimerRef.current = null;
    }

    onTimerUpdate(timeLeft);
  }, [onTimerUpdate]);

  const updateTimer = useCallback((timeLeft: number, sessionType: string) => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({
        type: 'UPDATE_TIME',
        payload: { timeLeft, sessionType }
      });
    }
  }, [isWorkerReady]);

  const getTimerState = useCallback(() => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({ type: 'GET_STATE' });
    }
  }, [isWorkerReady]);

  return {
    isWorkerReady,
    isTabVisible,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    updateTimer,
    getTimerState,
  };
}
