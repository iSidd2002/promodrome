#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * Checks that all required environment variables are properly configured
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'BCRYPT_ROUNDS'
];

const optionalEnvVars = [
  'NODE_ENV',
  'VERCEL_URL'
];

console.log('🔍 Verifying Environment Variables...\n');

let hasErrors = false;

// Check required variables
console.log('📋 Required Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    // Mask sensitive values
    const displayValue = varName.includes('SECRET') || varName.includes('PASSWORD') 
      ? '***HIDDEN***' 
      : varName === 'DATABASE_URL' 
        ? value.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
        : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 Optional Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value}`);
  } else {
    console.log(`⚪ ${varName}: not set`);
  }
});

// Validate specific values
console.log('\n🔍 Validation Checks:');

// Check NEXTAUTH_URL format
const nextAuthUrl = process.env.NEXTAUTH_URL;
if (nextAuthUrl) {
  try {
    new URL(nextAuthUrl);
    console.log('✅ NEXTAUTH_URL: Valid URL format');
  } catch (error) {
    console.log('❌ NEXTAUTH_URL: Invalid URL format');
    hasErrors = true;
  }
} else {
  console.log('❌ NEXTAUTH_URL: Missing');
  hasErrors = true;
}

// Check NEXTAUTH_SECRET length
const nextAuthSecret = process.env.NEXTAUTH_SECRET;
if (nextAuthSecret) {
  if (nextAuthSecret.length >= 32) {
    console.log('✅ NEXTAUTH_SECRET: Adequate length');
  } else {
    console.log('⚠️  NEXTAUTH_SECRET: Should be at least 32 characters');
  }
} else {
  console.log('❌ NEXTAUTH_SECRET: Missing');
  hasErrors = true;
}

// Check DATABASE_URL format
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl) {
  if (databaseUrl.startsWith('mongodb://') || databaseUrl.startsWith('mongodb+srv://')) {
    console.log('✅ DATABASE_URL: Valid MongoDB connection string');
  } else {
    console.log('❌ DATABASE_URL: Should be a MongoDB connection string');
    hasErrors = true;
  }
} else {
  console.log('❌ DATABASE_URL: Missing');
  hasErrors = true;
}

// Check BCRYPT_ROUNDS
const bcryptRounds = process.env.BCRYPT_ROUNDS;
if (bcryptRounds) {
  const rounds = parseInt(bcryptRounds);
  if (rounds >= 10 && rounds <= 15) {
    console.log('✅ BCRYPT_ROUNDS: Valid range (10-15)');
  } else {
    console.log('⚠️  BCRYPT_ROUNDS: Recommended range is 10-15');
  }
} else {
  console.log('❌ BCRYPT_ROUNDS: Missing');
  hasErrors = true;
}

console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ Environment configuration has errors!');
  console.log('\n📝 To fix these issues:');
  console.log('1. Create a .env.local file in your project root');
  console.log('2. Add the missing environment variables');
  console.log('3. For production deployment, set these in Vercel dashboard');
  console.log('\n📖 See VERCEL-DEPLOYMENT.md for detailed instructions');
  process.exit(1);
} else {
  console.log('✅ All environment variables are properly configured!');
  console.log('🚀 Ready for deployment');
  process.exit(0);
}
