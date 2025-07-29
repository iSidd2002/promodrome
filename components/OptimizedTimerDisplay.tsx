'use client';

import { memo, useMemo } from 'react';

interface OptimizedTimerDisplayProps {
  timeLeft: number;
  totalTime: number;
  isRunning: boolean;
  sessionType: string;
}

// Memoized timer display component to prevent unnecessary re-renders
const OptimizedTimerDisplay = memo(function OptimizedTimerDisplay({
  timeLeft,
  totalTime,
  isRunning,
  sessionType,
}: OptimizedTimerDisplayProps) {
  
  // Memoized time formatting to avoid recalculation
  const formattedTime = useMemo(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Memoized progress calculation
  const progress = useMemo(() => {
    if (totalTime === 0) return 0;
    return ((totalTime - timeLeft) / totalTime) * 100;
  }, [timeLeft, totalTime]);

  // Memoized session colors
  const sessionColors = useMemo(() => {
    switch (sessionType) {
      case 'pomodoro':
        return {
          primary: 'text-red-600 dark:text-red-400',
          secondary: 'text-red-500 dark:text-red-300',
          progress: 'stroke-red-500',
          background: 'stroke-red-200 dark:stroke-red-800',
        };
      case 'shortBreak':
        return {
          primary: 'text-green-600 dark:text-green-400',
          secondary: 'text-green-500 dark:text-green-300',
          progress: 'stroke-green-500',
          background: 'stroke-green-200 dark:stroke-green-800',
        };
      case 'longBreak':
        return {
          primary: 'text-blue-600 dark:text-blue-400',
          secondary: 'text-blue-500 dark:text-blue-300',
          progress: 'stroke-blue-500',
          background: 'stroke-blue-200 dark:stroke-blue-800',
        };
      default:
        return {
          primary: 'text-gray-600 dark:text-gray-400',
          secondary: 'text-gray-500 dark:text-gray-300',
          progress: 'stroke-gray-500',
          background: 'stroke-gray-200 dark:stroke-gray-800',
        };
    }
  }, [sessionType]);

  // Memoized session name
  const sessionName = useMemo(() => {
    switch (sessionType) {
      case 'pomodoro':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
      default:
        return 'Timer';
    }
  }, [sessionType]);

  // Memoized SVG circle properties
  const circleProps = useMemo(() => {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;
    
    return {
      radius,
      circumference,
      strokeDashoffset,
      cx: 150,
      cy: 150,
    };
  }, [progress]);

  return (
    <div className="flex flex-col items-center justify-center">
      {/* Circular Progress Indicator */}
      <div className="relative mb-6 md:mb-8">
        <svg
          width="300"
          height="300"
          className="transform -rotate-90"
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
        >
          {/* Background circle */}
          <circle
            cx={circleProps.cx}
            cy={circleProps.cy}
            r={circleProps.radius}
            fill="none"
            strokeWidth="8"
            className={sessionColors.background}
          />
          
          {/* Progress circle */}
          <circle
            cx={circleProps.cx}
            cy={circleProps.cy}
            r={circleProps.radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            className={sessionColors.progress}
            style={{
              strokeDasharray: circleProps.circumference,
              strokeDashoffset: circleProps.strokeDashoffset,
              transition: isRunning ? 'stroke-dashoffset 1s linear' : 'stroke-dashoffset 0.3s ease',
            }}
          />
        </svg>
        
        {/* Timer display in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-4xl md:text-5xl font-bold font-mono ${sessionColors.primary}`}>
            {formattedTime}
          </div>
          <div className={`text-sm md:text-base font-medium mt-2 ${sessionColors.secondary}`}>
            {sessionName}
          </div>
          {isRunning && (
            <div className="mt-2">
              <div className={`w-2 h-2 rounded-full ${sessionColors.progress.replace('stroke-', 'bg-')} animate-pulse`}></div>
            </div>
          )}
        </div>
      </div>

      {/* Progress percentage */}
      <div className="text-center">
        <div className={`text-lg font-semibold ${sessionColors.primary}`}>
          {Math.round(progress)}% Complete
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {Math.floor((totalTime - timeLeft) / 60)}m {(totalTime - timeLeft) % 60}s elapsed
        </div>
      </div>
    </div>
  );
});

export default OptimizedTimerDisplay;
