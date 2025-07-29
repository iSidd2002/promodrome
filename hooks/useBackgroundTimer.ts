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
  const lastUpdateTimeRef = useRef<number>(Date.now());

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
              lastUpdateTimeRef.current = Date.now();
              onTimerUpdate(data.timeLeft);
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
      
      if (isVisible && workerRef.current && isWorkerReady) {
        // Request current state when tab becomes visible
        workerRef.current.postMessage({ type: 'GET_STATE' });
        
        // Check if we missed any updates while tab was hidden
        const timeSinceLastUpdate = Date.now() - lastUpdateTimeRef.current;
        if (timeSinceLastUpdate > 2000) { // More than 2 seconds
          console.log('Tab was hidden for', timeSinceLastUpdate, 'ms - syncing timer state');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isWorkerReady]);

  // Timer control functions
  const startTimer = useCallback((timeLeft: number, sessionType: string) => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({
        type: 'START_TIMER',
        payload: { timeLeft, sessionType }
      });
    }
  }, [isWorkerReady]);

  const pauseTimer = useCallback(() => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({ type: 'PAUSE_TIMER' });
    }
  }, [isWorkerReady]);

  const resumeTimer = useCallback(() => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({ type: 'RESUME_TIMER' });
    }
  }, [isWorkerReady]);

  const resetTimer = useCallback((timeLeft: number, sessionType: string) => {
    if (workerRef.current && isWorkerReady) {
      workerRef.current.postMessage({
        type: 'RESET_TIMER',
        payload: { timeLeft, sessionType }
      });
    }
  }, [isWorkerReady]);

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
