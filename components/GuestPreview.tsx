'use client';

import Link from 'next/link';
import { useState } from 'react';

interface GuestPreviewProps {
  children: React.ReactNode;
}

export default function GuestPreview({ children }: GuestPreviewProps) {
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);

  const handleInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowSignInPrompt(true);
  };

  return (
    <div className="relative">
      {/* Overlay for guest users */}
      <div 
        className="absolute inset-0 z-10 bg-transparent cursor-pointer"
        onClick={handleInteraction}
      />
      
      {/* Disabled content */}
      <div className="pointer-events-none opacity-60 select-none">
        {children}
      </div>

      {/* Sign-in prompt modal */}
      {showSignInPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md mx-4 shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                🍅 Sign In Required
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                To use the Pomodoro Timer and track your productivity sessions, you need to create an account or sign in.
              </p>

              {/* Features list */}
              <div className="text-left mb-6 space-y-2">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Track your focus sessions
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  View daily productivity statistics
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Sync settings across devices
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                  </svg>
                  Background timer functionality
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/auth/signup"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Create Account
                </Link>
                <Link
                  href="/auth/signin"
                  className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 text-center"
                >
                  Sign In
                </Link>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowSignInPrompt(false)}
                className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
              >
                Continue browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
