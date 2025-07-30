'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PomodoroSession {
  id: string;
  sessionType: 'POMODORO' | 'SHORT_BREAK' | 'LONG_BREAK';
  plannedDuration: number;
  actualDuration?: number;
  completed: boolean;
  startTime: string;
  endTime?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
}

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      loadSessions();
    }
  }, [session, filter]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      let url = '/api/sessions?limit=50';

      // Add date filtering based on filter selection
      const now = new Date();
      if (filter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        url += `&startDate=${startOfDay.toISOString()}`;
      } else if (filter === 'week') {
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        url += `&startDate=${startOfWeek.toISOString()}`;
      } else if (filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        url += `&startDate=${startOfMonth.toISOString()}`;
      }

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSessions(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  const getSessionIcon = (type: string) => {
    switch (type) {
      case 'POMODORO':
        return '🍅';
      case 'SHORT_BREAK':
        return '☕';
      case 'LONG_BREAK':
        return '🌟';
      default:
        return '⏱️';
    }
  };

  const getSessionColor = (type: string) => {
    switch (type) {
      case 'POMODORO':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'SHORT_BREAK':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'LONG_BREAK':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  const getStats = () => {
    const completedSessions = sessions.filter(s => s.completed);
    const totalPomodoros = completedSessions.filter(s => s.sessionType === 'POMODORO').length;
    const totalFocusTime = completedSessions
      .filter(s => s.sessionType === 'POMODORO')
      .reduce((total, s) => total + (s.actualDuration || s.plannedDuration), 0);

    return {
      totalSessions: completedSessions.length,
      totalPomodoros,
      totalFocusTime: Math.floor(totalFocusTime / 60), // Convert to minutes
      averageSession: totalPomodoros > 0 ? Math.round(totalFocusTime / totalPomodoros / 60) || 0 : 0
    };
  };

  const stats = getStats();

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading session history...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-blue-500 hover:text-blue-600 mr-4">
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Session History
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.totalPomodoros}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Pomodoros</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.floor(stats.totalFocusTime / 60)}h {stats.totalFocusTime % 60}m</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Focus Time</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.averageSession}m</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Avg Session</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex flex-wrap gap-2">
            {(['all', 'today', 'week', 'month'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Sessions
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No sessions yet
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Start your first Pomodoro session to see your progress here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Start Timer
                </Link>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="text-2xl mt-1">
                        {getSessionIcon(session.sessionType)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSessionColor(session.sessionType)}`}>
                            {session.sessionType.replace('_', ' ')}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {formatDuration(session.actualDuration || session.plannedDuration)}
                          </span>
                        </div>

                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {formatDate(session.startTime)}
                        </div>

                        {/* Show accomplishments for completed pomodoro sessions */}
                        {session.sessionType === 'POMODORO' && session.completed && session.notes && (
                          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg">
                            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Accomplishments:
                            </div>
                            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                              {session.notes}
                            </div>
                          </div>
                        )}

                        {/* Show tags if any */}
                        {session.tags && session.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {session.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center ml-4">
                      {session.completed ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          ✓ Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                          ⏸ Incomplete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
