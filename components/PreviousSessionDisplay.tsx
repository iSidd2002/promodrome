'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PreviousSession {
  id: string;
  sessionType: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';
  plannedDuration: number;
  actualDuration?: number;
  completed: boolean;
  startTime: string;
  endTime?: string;
  notes?: string;
  createdAt: string;
}

interface PreviousSessionDisplayProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function PreviousSessionDisplay({ isVisible, onClose }: PreviousSessionDisplayProps) {
  const { data: session } = useSession();
  const [previousSession, setPreviousSession] = useState<PreviousSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible && session) {
      fetchPreviousSession();
    }
  }, [isVisible, session]);

  const fetchPreviousSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/sessions/previous');
      if (response.ok) {
        const data = await response.json();
        setPreviousSession(data);
      } else if (response.status === 404) {
        setPreviousSession(null);
      } else {
        throw new Error('Failed to fetch previous session');
      }
    } catch (err) {
      console.error('Error fetching previous session:', err);
      setError('Failed to load previous session');
    } finally {
      setIsLoading(false);
    }
  };

  const formatSessionType = (type: string) => {
    switch (type) {
      case 'POMODORO': return 'Pomodoro';
      case 'SHORT_BREAK': return 'Short Break';
      case 'LONG_BREAK': return 'Long Break';
      default: return type;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Previous Session
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {!isLoading && !error && !previousSession && (
            <div className="text-center py-8">
              <div className="text-gray-400 dark:text-gray-500 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400">No previous sessions found</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Complete your first pomodoro to see your accomplishments here
              </p>
            </div>
          )}

          {!isLoading && !error && previousSession && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {formatSessionType(previousSession.sessionType)}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-300">
                    {formatDate(previousSession.endTime || previousSession.startTime)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-blue-700 dark:text-blue-300">
                  <span>Duration: {formatDuration(previousSession.actualDuration || previousSession.plannedDuration)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    previousSession.completed 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {previousSession.completed ? 'Completed' : 'Incomplete'}
                  </span>
                </div>
              </div>

              {previousSession.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What you accomplished:
                  </h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                      {previousSession.notes}
                    </p>
                  </div>
                </div>
              )}

              {!previousSession.notes && previousSession.completed && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                    No accomplishments recorded for this session
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
