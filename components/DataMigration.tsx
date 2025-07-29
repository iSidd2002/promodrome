'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface LocalStorageData {
  settings?: {
    pomodoroDuration: number;
    shortBreakDuration: number;
    longBreakDuration: number;
    longBreakInterval: number;
    autoStartBreaks: boolean;
    autoStartPomodoros: boolean;
  };
  pomodorosCompleted?: number;
}

export default function DataMigration() {
  const { data: session } = useSession();
  const [localData, setLocalData] = useState<LocalStorageData>({});
  const [showMigration, setShowMigration] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (session) {
      checkForLocalData();
    }
  }, [session]);

  const checkForLocalData = () => {
    const settings = localStorage.getItem('pomodoroSettings');
    const pomodorosCompleted = localStorage.getItem('pomodorosCompleted');
    
    const hasLocalData = settings || pomodorosCompleted;
    
    if (hasLocalData) {
      setLocalData({
        settings: settings ? JSON.parse(settings) : null,
        pomodorosCompleted: pomodorosCompleted ? parseInt(pomodorosCompleted) : 0,
      });
      
      // Check if migration was already completed
      const migrationDone = localStorage.getItem('migrationCompleted');
      if (!migrationDone) {
        setShowMigration(true);
      }
    }
  };

  const migrateData = async () => {
    setIsMigrating(true);
    
    try {
      // Migrate settings
      if (localData.settings) {
        await fetch('/api/user/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(localData.settings),
        });
      }

      // Note: Pomodoros completed count is session-based and doesn't need migration
      // as it resets with each session anyway
      
      // Mark migration as complete
      localStorage.setItem('migrationCompleted', 'true');
      setMigrationComplete(true);
      
      setTimeout(() => {
        setShowMigration(false);
        setMigrationComplete(false);
      }, 3000);
      
    } catch (error) {
      console.error('Migration failed:', error);
      alert('Failed to migrate data. Please try again.');
    } finally {
      setIsMigrating(false);
    }
  };

  const skipMigration = () => {
    localStorage.setItem('migrationCompleted', 'true');
    setShowMigration(false);
  };

  if (!showMigration) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
        {migrationComplete ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Migration Complete!
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Your settings have been saved to your account.
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Transfer Your Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                We found existing timer settings on this device. Would you like to transfer them to your account?
              </p>
            </div>

            {localData.settings && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Settings to transfer:</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>• Pomodoro: {localData.settings.pomodoroDuration} minutes</li>
                  <li>• Short Break: {localData.settings.shortBreakDuration} minutes</li>
                  <li>• Long Break: {localData.settings.longBreakDuration} minutes</li>
                  <li>• Long Break Interval: {localData.settings.longBreakInterval} pomodoros</li>
                </ul>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={migrateData}
                disabled={isMigrating}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {isMigrating ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Transferring...
                  </>
                ) : (
                  'Transfer Data'
                )}
              </button>
              
              <button
                onClick={skipMigration}
                disabled={isMigrating}
                className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Skip
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
              You can always access your settings from the dashboard later.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
