'use client';

import { useState, useEffect } from 'react';

interface SessionAccomplishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accomplishment: string) => void;
  sessionType: 'pomodoro' | 'shortBreak' | 'longBreak';
  duration: number; // in minutes
}

export default function SessionAccomplishmentModal({
  isOpen,
  onClose,
  onSave,
  sessionType,
  duration
}: SessionAccomplishmentModalProps) {
  const [accomplishment, setAccomplishment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAccomplishment('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSave(accomplishment.trim());
      onClose();
    } catch (error) {
      console.error('Failed to save accomplishment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSave('');
    onClose();
  };

  if (!isOpen) return null;

  const sessionTypeDisplay = sessionType === 'pomodoro' ? 'Pomodoro' : 
                           sessionType === 'shortBreak' ? 'Short Break' : 'Long Break';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Session Complete! 🎉
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

          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              You completed a <strong>{duration}-minute {sessionTypeDisplay}</strong> session!
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="accomplishment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What did you accomplish during this session?
              </label>
              <textarea
                id="accomplishment"
                value={accomplishment}
                onChange={(e) => setAccomplishment(e.target.value)}
                placeholder={sessionType === 'pomodoro' 
                  ? "e.g., Completed user authentication feature, Fixed 3 bugs in payment system, Reviewed pull requests..."
                  : "e.g., Took a walk, Stretched, Had a snack, Meditated..."
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {accomplishment.length}/500 characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Saving...' : 'Save & Continue'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Skip
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            This helps you track your progress and plan your next session
          </p>
        </div>
      </div>
    </div>
  );
}
