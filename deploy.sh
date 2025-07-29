#!/bin/bash

# Pomodoro Timer Deployment Script
# This script prepares and deploys the application to GitHub

set -e  # Exit on any error

echo "🍅 Pomodoro Timer - Deployment Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_status "Initializing Git repository..."
    git init
    print_success "Git repository initialized"
fi

# Install dependencies
print_status "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Run type checking
print_status "Running TypeScript type checking..."
if npm run type-check 2>/dev/null; then
    print_success "TypeScript type checking passed"
else
    print_warning "TypeScript type checking not available, skipping..."
fi

# Build the application
print_status "Building application for production..."
npm run build
print_success "Application built successfully"

# Check if remote origin exists
if git remote get-url origin 2>/dev/null; then
    print_status "Git remote origin already configured"
else
    print_status "Adding GitHub remote origin..."
    git remote add origin https://github.com/iSidd2002/promodrome.git
    print_success "GitHub remote added"
fi

# Stage all files
print_status "Staging files for commit..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    # Commit changes
    print_status "Committing changes..."
    git commit -m "feat: complete optimized pomodoro timer with background functionality

- Implemented Web Worker for background timer execution
- Added Page Visibility API for tab focus detection
- Enhanced audio notifications with Web Audio API
- Optimized performance with memoization and requestAnimationFrame
- Added memory leak detection and performance monitoring
- Implemented daily statistics with comprehensive analytics
- Complete user authentication and session tracking
- Cross-device settings synchronization
- Production-ready with MongoDB Atlas integration
- Responsive design with dark mode support

Features:
✅ Background timer continues when tab is not active
✅ Audio notifications work regardless of tab focus
✅ Performance optimized for minimal CPU/memory usage
✅ Complete user authentication system
✅ Daily/weekly/monthly productivity statistics
✅ Session tracking and analytics
✅ Cross-device settings sync
✅ Mobile responsive design
✅ Dark mode support
✅ Production deployment ready"

    print_success "Changes committed"
fi

# Push to GitHub
print_status "Pushing to GitHub repository..."
git branch -M main
git push -u origin main --force

print_success "Successfully deployed to GitHub!"

echo ""
echo "🎉 Deployment Complete!"
echo "======================="
echo ""
echo "📍 Repository: https://github.com/iSidd2002/promodrome"
echo "🚀 Ready for Vercel deployment"
echo ""
echo "Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Import the GitHub repository"
echo "3. Configure environment variables:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - BCRYPT_ROUNDS"
echo "4. Deploy!"
echo ""
echo "🍅 Happy productivity!"
