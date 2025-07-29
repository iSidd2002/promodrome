'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function AuthBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                🍅 <strong>Sign in required</strong> to use the Pomodoro Timer and track your productivity sessions.
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/auth/signup"
              className="bg-white text-red-600 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Create Account
            </Link>
            <Link
              href="/auth/signin"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors duration-200"
            >
              Sign In
            </Link>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white hover:text-gray-200 transition-colors duration-200"
              aria-label="Dismiss banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
