// Timer Web Worker for background execution
// This ensures the timer continues running even when the tab is not active

let timerId = null;
let timerState = {
  isRunning: false,
  timeLeft: 0,
  startTime: null,
  pausedTime: 0,
  sessionType: 'pomodoro'
};

// Timer function with proper error handling
function startTimer() {
  // Clear any existing timer
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }

  // Validate timer state
  if (!timerState.timeLeft || timerState.timeLeft <= 0) {
    console.error('[TIMER WORKER] Cannot start timer - invalid timeLeft:', timerState.timeLeft);
    return;
  }

  timerState.isRunning = true;
  timerState.startTime = performance.now();

  // Send initial update
  self.postMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning
  });

  // Send initial update
  self.postMessage({
    type: 'TIMER_UPDATE',
    timeLeft: timerState.timeLeft,
    isRunning: timerState.isRunning
  });

  // Note: Main thread timer now handles the countdown
  // Worker is kept for potential future background functionality
}

function pauseTimer() {
  if (timerState.isRunning) {
    timerState.isRunning = false;
    timerState.pausedTime = performance.now();
    
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    
    self.postMessage({
      type: 'TIMER_PAUSED',
      timeLeft: timerState.timeLeft
    });
  }
}

function resumeTimer() {
  if (!timerState.isRunning && timerState.timeLeft > 0) {
    startTimer();
    
    self.postMessage({
      type: 'TIMER_RESUMED',
      timeLeft: timerState.timeLeft
    });
  }
}

function resetTimer(newTimeLeft, sessionType = 'pomodoro') {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  
  timerState = {
    isRunning: false,
    timeLeft: newTimeLeft,
    startTime: null,
    pausedTime: 0,
    sessionType: sessionType
  };
  
  self.postMessage({
    type: 'TIMER_RESET',
    timeLeft: timerState.timeLeft,
    sessionType: timerState.sessionType
  });
}

function getTimerState() {
  self.postMessage({
    type: 'TIMER_STATE',
    ...timerState
  });
}

// Handle messages from main thread
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'START_TIMER':
      // Validate payload
      if (!payload || typeof payload.timeLeft !== 'number' || payload.timeLeft <= 0) {
        console.error('[TIMER WORKER] Invalid START_TIMER payload:', payload);
        return;
      }

      timerState.timeLeft = payload.timeLeft;
      timerState.sessionType = payload.sessionType || 'pomodoro';
      startTimer();
      break;
      
    case 'PAUSE_TIMER':
      pauseTimer();
      break;
      
    case 'RESUME_TIMER':
      resumeTimer();
      break;
      
    case 'RESET_TIMER':
      resetTimer(payload.timeLeft, payload.sessionType);
      break;
      
    case 'GET_STATE':
      getTimerState();
      break;
      
    case 'UPDATE_TIME':
      timerState.timeLeft = payload.timeLeft;
      timerState.sessionType = payload.sessionType || timerState.sessionType;
      break;
      
    default:
      console.warn('Unknown message type:', type);
  }
});

// Send initial ready message
self.postMessage({
  type: 'WORKER_READY'
});

// Handle worker termination
self.addEventListener('beforeunload', () => {
  if (timerId) {
    clearInterval(timerId);
  }
});

// Send ready message when worker is initialized
self.postMessage({ type: 'WORKER_READY' });
