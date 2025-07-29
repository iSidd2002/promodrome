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

// High-precision timer using performance.now()
function startTimer() {
  if (timerId) {
    clearInterval(timerId);
  }
  
  timerState.isRunning = true;
  timerState.startTime = performance.now();
  
  // Use setInterval with 100ms precision for better accuracy
  timerId = setInterval(() => {
    if (timerState.isRunning && timerState.timeLeft > 0) {
      const now = performance.now();
      const elapsed = Math.floor((now - timerState.startTime) / 1000);
      const newTimeLeft = Math.max(0, timerState.timeLeft - elapsed);
      
      if (newTimeLeft !== timerState.timeLeft) {
        timerState.timeLeft = newTimeLeft;
        timerState.startTime = now; // Reset start time for next interval
        
        // Send update to main thread
        self.postMessage({
          type: 'TIMER_UPDATE',
          timeLeft: timerState.timeLeft,
          isRunning: timerState.isRunning
        });
        
        // Check if timer completed
        if (timerState.timeLeft <= 0) {
          timerState.isRunning = false;
          clearInterval(timerId);
          timerId = null;
          
          self.postMessage({
            type: 'TIMER_COMPLETE',
            sessionType: timerState.sessionType
          });
        }
      }
    }
  }, 100); // 100ms intervals for smooth updates
}

function pauseTimer() {
  if (timerState.isRunning) {
    timerState.isRunning = false;
    timerState.pausedTime = performance.now();
    
    if (timerId) {
      clearInterval(timerId);
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
      if (payload.timeLeft) {
        timerState.timeLeft = payload.timeLeft;
      }
      if (payload.sessionType) {
        timerState.sessionType = payload.sessionType;
      }
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
