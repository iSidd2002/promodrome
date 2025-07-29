#!/usr/bin/env node

/**
 * Authentication Test Script
 * Tests the authentication flow locally
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Check if test user exists
    console.log('1️⃣ Checking if test user exists...');
    const testUser = await prisma.user.findUnique({
      where: { email: 'testuser@example.com' }
    });

    if (testUser) {
      console.log('✅ Test user found:', {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name
      });

      // Test 2: Verify password hashing
      console.log('\n2️⃣ Testing password verification...');
      const isPasswordValid = await bcrypt.compare('TestPassword123', testUser.password);
      console.log('✅ Password verification:', isPasswordValid ? 'VALID' : 'INVALID');

      if (!isPasswordValid) {
        console.log('❌ Password verification failed - this could be the issue!');
      }
    } else {
      console.log('❌ Test user not found');
    }

    // Test 3: Check database connection
    console.log('\n3️⃣ Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('✅ Database connected. Total users:', userCount);

    // Test 4: Check environment variables
    console.log('\n4️⃣ Checking environment variables...');
    const requiredVars = ['DATABASE_URL', 'NEXTAUTH_URL', 'NEXTAUTH_SECRET'];
    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        const displayValue = varName.includes('SECRET') ? '***HIDDEN***' : value;
        console.log(`✅ ${varName}: ${displayValue}`);
      } else {
        console.log(`❌ ${varName}: MISSING`);
      }
    });

  } catch (error) {
    console.error('💥 Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
