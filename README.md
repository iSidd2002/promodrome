# 🍅 Pomodoro Timer - Complete Productivity Application

A beautiful, feature-rich Pomodoro Timer built with Next.js 15, TypeScript, and MongoDB Atlas. Track your productivity with user accounts, session history, and detailed statistics.

![Pomodoro Timer](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)

## ✨ Features

### 🎯 **Core Timer Functionality**
- **Background Timer** - Continues running when browser tab is not active
- **Web Worker Integration** - High-precision timing with minimal CPU usage
- **Page Visibility API** - Automatic sync when returning to tab
- **Customizable Durations** - Set your own pomodoro, short break, and long break times
- **Auto-cycling Sessions** - Automatically switch between work and break periods
- **Enhanced Audio Notifications** - Web Audio API with background support
- **Visual Progress** - Optimized circular progress indicator
- **Pause/Resume** - Full control over your sessions

### 🔐 **Mandatory Authentication**
- **Required Sign-in** - Authentication required for all timer functionality
- **Secure Registration** - Create accounts with email and password
- **Session Management** - Persistent login with NextAuth.js
- **Protected Routes** - Server-side middleware protection for all pages
- **API Protection** - All endpoints require authentication
- **Guest Preview** - Visual preview with disabled functionality for unauthenticated users

### 📊 **Advanced Analytics**
- **Session Tracking** - Complete history of all pomodoro sessions
- **Daily Statistics** - Detailed breakdown by day with completion rates
- **Focus Time Tracking** - Total productive time calculations
- **Progress Visualization** - Charts and progress bars
- **Weekly/Monthly Views** - Extended analytics periods

### ⚙️ **Smart Settings**
- **Cross-device Sync** - Settings saved to your account
- **Local Storage Fallback** - Works offline for guest users
- **Auto-start Options** - Customize session transitions
- **Theme Support** - Light and dark mode

### 📱 **Modern UI/UX**
- **Responsive Design** - Perfect on mobile, tablet, and desktop
- **Dark Mode** - Beautiful dark theme support
- **Smooth Animations** - RequestAnimationFrame optimized
- **Performance Optimized** - Minimal memory usage and CPU consumption
- **Memory Leak Prevention** - Automatic cleanup of resources
- **Accessibility** - Screen reader friendly

## ⚡ **Performance Features**

### **Background Timer Technology**
- **Web Workers** - Timer runs in separate thread for accuracy
- **Page Visibility API** - Detects tab focus and syncs state
- **High Precision** - Uses performance.now() for microsecond accuracy
- **Memory Efficient** - Automatic cleanup prevents memory leaks
- **CPU Optimized** - Minimal processing overhead

### **Audio Notifications**
- **Web Audio API** - Works even when tab is not focused
- **Browser Notifications** - System-level alerts with permissions
- **Mobile Vibration** - Haptic feedback on supported devices
- **Programmatic Sounds** - No external audio files required

### **Performance Monitoring**
- **Real-time Metrics** - Memory usage and render performance tracking
- **Render Optimization** - Memoized components prevent unnecessary updates
- **Bundle Optimization** - Code splitting and tree shaking
- **Resource Management** - Automatic cleanup of timers and listeners

## 🚀 Live Demo

**[View Live Application](https://promodrome.vercel.app)** *(Will be available after deployment)*

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Authentication**: NextAuth.js with JWT sessions
- **Database**: MongoDB Atlas with Prisma ORM
- **Deployment**: Vercel
- **Styling**: Tailwind CSS with dark mode
- **State Management**: React hooks with optimistic updates

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd pomodoro-timer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-super-secret-key"
BCRYPT_ROUNDS="12"
```

4. **Set up the database**
```bash
npx prisma db push
npx prisma generate
```

5. **Start development server**
```bash
npm run dev
```

Visit `http://localhost:3001` to see the application.

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Vercel**
- Go to [vercel.com](https://vercel.com)
- Import your repository
- Configure environment variables

3. **Environment Variables**
Set these in Vercel dashboard:
```
DATABASE_URL=mongodb+srv://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generated-secure-secret
BCRYPT_ROUNDS=12
```

4. **Deploy**
- Click "Deploy"
- Test all functionality

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📖 Usage

### For Unauthenticated Users
1. **Visual Preview** - See the timer interface design
2. **Sign-in Prompts** - Clear calls-to-action for registration
3. **Feature Highlights** - Learn about timer capabilities
4. **Seamless Registration** - Quick account creation process

### For Authenticated Users
1. **Full Timer Access** - Complete pomodoro timer functionality
2. **Session Tracking** - All sessions automatically saved to database
3. **Daily Statistics** - Comprehensive productivity analytics
4. **Cross-device Sync** - Settings and data available everywhere
5. **Background Timer** - Continues running when tab is not active
6. **Audio Notifications** - Alerts work regardless of tab focus

### Key Features
- **Timer Controls** - Start, pause, reset sessions
- **Session Types** - Pomodoro, short break, long break
- **Auto-cycling** - Automatic session transitions
- **Statistics** - Daily, weekly, monthly views
- **Settings** - Customize all timer preferences

## 🏗️ Project Structure

```
pomodoro-timer/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # User dashboard
│   └── page.tsx           # Main timer page
├── components/            # React components
├── lib/                   # Utilities and configurations
├── prisma/               # Database schema
└── public/               # Static assets
```

## 🔧 API Endpoints

- `POST /api/register` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings
- `POST /api/sessions` - Create new session
- `PUT /api/sessions/[id]` - Update session
- `GET /api/sessions` - Get session history
- `GET /api/stats/daily` - Get daily statistics

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **Pomodoro Technique** - Francesco Cirillo
- **Next.js Team** - Amazing framework
- **Vercel** - Excellent hosting platform
- **MongoDB** - Reliable database solution

---

**Built with ❤️ using Next.js, TypeScript, and MongoDB Atlas**

🍅 **Happy Productivity!** 🍅
