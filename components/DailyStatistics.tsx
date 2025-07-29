'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DayStats {
  date: string;
  formattedDate: string;
  shortDate: string;
  attempted: number;
  completed: number;
  totalFocusMinutes: number;
  totalFocusTime: {
    hours: number;
    minutes: number;
    formatted: string;
  };
  completionRate: number;
  allSessions: number;
  completedSessions: number;
}

interface StatsSummary {
  totalAttempted: number;
  totalCompleted: number;
  totalFocusMinutes: number;
  totalFocusTime: {
    hours: number;
    minutes: number;
    formatted: string;
  };
  averageCompletionRate: number;
  activeDays: number;
}

interface DailyStatsResponse {
  dailyStats: DayStats[];
  summary: StatsSummary;
  dateRange: {
    start: string;
    end: string;
    days: number;
  };
}

export default function DailyStatistics() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DailyStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '14' | '30'>('7');

  useEffect(() => {
    if (session) {
      loadStats();
    }
  }, [session, selectedPeriod]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stats/daily?days=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Daily Statistics
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Unable to load statistics. Please try again later.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const todayStats = stats.dailyStats.find(day => day.date === today);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Daily Statistics
          </h2>
          <div className="flex space-x-2">
            {(['7', '14', '30'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period} days
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.summary.totalCompleted}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Completed Pomodoros
            </div>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.summary.totalFocusTime.formatted}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Total Focus Time
            </div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.summary.averageCompletionRate}%
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Avg Completion Rate
            </div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.summary.activeDays}
            </div>
            <div className="text-sm text-orange-600 dark:text-orange-400">
              Active Days
            </div>
          </div>
        </div>

        {/* Today's Highlight */}
        {todayStats && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white mb-6">
            <h3 className="font-semibold mb-2">Today&apos;s Progress</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-xl font-bold">{todayStats.completed}</div>
                <div className="text-sm opacity-90">Completed</div>
              </div>
              <div>
                <div className="text-xl font-bold">{todayStats.attempted}</div>
                <div className="text-sm opacity-90">Attempted</div>
              </div>
              <div>
                <div className="text-xl font-bold">{todayStats.totalFocusTime.formatted}</div>
                <div className="text-sm opacity-90">Focus Time</div>
              </div>
              <div>
                <div className="text-xl font-bold">{todayStats.completionRate}%</div>
                <div className="text-sm opacity-90">Success Rate</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Daily Breakdown
        </h3>
        
        <div className="space-y-3">
          {stats.dailyStats.map((day) => (
            <div
              key={day.date}
              className={`p-4 rounded-lg border transition-colors ${
                day.date === today
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {day.date === today ? 'Today' : day.shortDate}
                    {day.date === today && (
                      <span className="ml-2 text-sm text-blue-600 dark:text-blue-400">
                        ({day.formattedDate})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {day.completed}/{day.attempted} pomodoros • {day.totalFocusTime.formatted} focus time
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-semibold ${
                    day.completionRate >= 80 ? 'text-green-600 dark:text-green-400' :
                    day.completionRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    day.completionRate > 0 ? 'text-orange-600 dark:text-orange-400' :
                    'text-gray-400 dark:text-gray-500'
                  }`}>
                    {day.attempted > 0 ? `${day.completionRate}%` : '—'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    success rate
                  </div>
                </div>
              </div>
              
              {/* Progress Bar */}
              {day.attempted > 0 && (
                <div className="mt-3">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        day.completionRate >= 80 ? 'bg-green-500' :
                        day.completionRate >= 60 ? 'bg-yellow-500' :
                        day.completionRate > 0 ? 'bg-orange-500' :
                        'bg-gray-400'
                      }`}
                      style={{ width: `${day.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {stats.dailyStats.every(day => day.attempted === 0) && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-500 text-4xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Start your first Pomodoro session to see your daily statistics here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
