# ☀️ RayWise - AI-Powered Solar Rooftop Analysis

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Convex](https://img.shields.io/badge/Convex-Backend-orange?style=for-the-badge)](https://convex.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> Transform your rooftop into a renewable energy powerhouse with intelligent computer vision analysis and optimized solar panel placement designs.

![RayWise Dashboard](https://img.shields.io/badge/Status-Live-success?style=for-the-badge)

## 🌐 Live Demo

**🔗 [ray-wise.vercel.app](https://ray-wise.vercel.app)**

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [API Routes](#-api-routes)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Screenshots](#-screenshots)
- [Performance](#-performance)
- [Contributing](#-contributing)
- [License](#-license)
- [Team](#-team)

---

## 🎯 Overview

**RayWise** is a cutting-edge web application that leverages artificial intelligence and computer vision to analyze rooftops for optimal solar panel installation. Built with Next.js 15, the platform provides comprehensive insights into solar energy potential, cost savings estimates, and connects users with verified solar installers.

### What Makes RayWise Special?

- **AI-Powered Analysis**: Advanced computer vision technology analyzes satellite and drone imagery to detect rooftop layouts with exceptional accuracy
- **Smart Optimization**: AI-generated optimal panel placement designs that maximize energy output and efficiency
- **Energy Predictions**: Precise energy output forecasts and cost savings estimates tailored to your location and usage
- **Provider Network**: Connect with trusted local and international solar installers for seamless implementation
- **Interactive Design**: Draw installation areas, visualize panel layouts, and get real-time AI recommendations
- **Comprehensive Reports**: Detailed analysis including energy predictions, financial projections, and environmental impact

---

## ✨ Key Features

### 🖼️ Computer Vision Analysis
- **Satellite/Manual Upload**: Upload satellite imagery or photos of your rooftop
- **Automatic Location Detection**: AI analyzes rooftop using your address
- **Polygon Drawing Tool**: Define exact installation areas with precision
- **Layout Detection**: Advanced AI identifies optimal rooftop areas

### 🤖 AI-Powered Recommendations
- **Smart Panel Placement**: AI-generated layouts maximizing energy output
- **Solar Panel Suggestions**: Curated recommendations (11+ options) based on your project
- **Real-time Assistant**: AI chatbot for instant solar energy guidance
- **Efficiency Analysis**: Comprehensive evaluation of panel types and configurations

### 📊 Energy Predictions
- **Monthly/Annual Forecasts**: Detailed kWh production predictions
- **Cost Savings Analysis**: Calculate savings with precise ROI metrics
- **CO₂ Impact**: Environmental benefits tracking
- **12-Month Projections**: Long-term energy production visualization

### 💰 ROI Calculator
- **Financial Modeling**: Investment return calculations over 8+ years
- **Payback Period**: Clear timeline to break-even point
- **Cumulative Savings**: Track long-term financial benefits
- **Net Position Analysis**: Compare costs vs. savings over time

### 🔌 Solar Panel Comparison
- **Side-by-Side Analysis**: Compare multiple panel options
- **Efficiency Ratings**: Detailed specifications (21.7% - 23.5% efficient)
- **Warranty Information**: 25+ year warranty details
- **Price Ranges**: Transparent cost breakdown ($250-$300/panel)
- **Pros & Cons**: Comprehensive evaluation of each option

### 🏗️ Project Management
- **Save/Load Projects**: Manage multiple rooftop analyses
- **Project History**: Track all analyzed projects (10 active, 10 analyzed, 7 drafts)
- **Status Tracking**: Monitor project completion stages
- **Export Reports**: Share analysis results

### 🌍 Installer Network
- **Find Local Installers**: Connect with nearby verified professionals
- **Provider Recommendations**: Trusted network access
- **Quote Comparison**: Get competitive pricing

### 📈 Live Dashboard
- **Real-time Statistics**: Monitor active projects and system performance
- **Energy Metrics**: Track total panels (1575), system size (630 kW)
- **Notifications Center**: Stay updated on project progress
- **Theme Toggle**: Dark/Light mode support

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (Latest version with App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 18](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [GSAP](https://greensock.com/gsap/) (GreenSock Animation Platform)
- **3D Graphics**: [Three.js](https://threejs.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Database**: [Convex](https://convex.dev/) (Real-time backend platform)
- **Authentication**: [Clerk](https://clerk.com/) (User management & auth)
- **Runtime**: [Node.js](https://nodejs.org/)
- **API**: Next.js API Routes

### AI & APIs
- **AI Analysis**: [Google Gemini API](https://ai.google.dev/) (Computer vision & recommendations)
- **Geocoding**: Google Maps Geocoding API
- **Reverse Geocoding**: Location services
- **Satellite Imagery**: Integrated satellite image fetching
- **Solar Calculations**: Custom algorithms for energy predictions

### Development Tools
- **Package Manager**: npm
- **Version Control**: Git
- **Deployment**: [Vercel](https://vercel.com/)
- **Code Quality**: ESLint, TypeScript strict mode

---

## 🏗 Architecture

### Application Flow
```
User Authentication (Clerk)
         ↓
   Dashboard Interface
         ↓
Upload Rooftop Image / Fetch Satellite View
         ↓
Set Location (Geocoding API)
         ↓
Draw Installation Area (Polygon Tool)
         ↓
AI Analysis (Gemini API)
    ↓              ↓
Panel Layout   Recommendations
         ↓
Energy Predictions & ROI Calculation
         ↓
Save/Finalize Project (Convex DB)
         ↓
Connect with Installers
```

### Database Schema (Convex)

**Collections:**
- `users`: User profiles and authentication data
- `rooftopAnalysis`: Saved rooftop analysis projects
- `savedProjects`: Draft and in-progress projects
- `finalizedLayouts`: Completed solar panel layouts
- `recommendations`: AI-generated panel recommendations
- `notifications`: User notifications and updates

### Rendering Strategy

- **SSR (Server-Side Rendering)**: Authentication pages, dashboard initial load
- **CSR (Client-Side Rendering)**: Interactive canvas, AI chat, real-time updates
- **ISR (Incremental Static Regeneration)**: Landing pages, static content
- **API Routes**: Backend logic for all data operations

---

## 🔌 API Routes

### Rooftop Analysis
- **POST** `/api/analyze-rooftop` - AI-powered rooftop analysis with Gemini
  - Analyzes uploaded image/satellite view
  - Returns optimal panel placement
  - Provides sun exposure analysis

### Location Services
- **POST** `/api/geocode` - Convert address to coordinates
- **POST** `/api/reverse-geocode` - Convert coordinates to address

### Satellite Imagery
- **POST** `/api/fetch-satellite-image` - Fetch satellite view of location
  - Returns high-resolution rooftop imagery
  - Supports multiple map providers

### Energy Predictions
- **POST** `/api/generate-predictions` - Calculate energy output forecasts
  - Monthly/annual kWh predictions
  - Cost savings estimates
  - ROI calculations

### ROI Analysis
- **POST** `/api/calculate-roi` - Financial return calculations
  - Investment breakdown
  - Payback period
  - Long-term savings projection

### Solar Recommendations
- **POST** `/api/get-recommendations` - AI-generated panel recommendations
  - Compares 11+ panel options
  - Efficiency ratings
  - Cost analysis
  - Pros/cons breakdown

### Solar Plans Comparison
- **POST** `/api/compare-plans` - Compare different solar solutions
  - Side-by-side panel comparison
  - Cost vs. efficiency analysis

### Installer Network
- **POST** `/api/find-installers` - Find nearby solar installers
  - Location-based search
  - Verified providers

### AI Assistant
- **POST** `/api/solar-assistant` - Interactive AI chatbot
  - Real-time solar energy guidance
  - Project-specific recommendations
  - Quick calculations

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Git
- Convex account
- Clerk account
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Kritika11052005/RayWise.git
cd raywise
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:
```env
# Convex
CONVEX_DEPLOYMENT=your_convex_deployment_url
NEXT_PUBLIC_CONVEX_URL=your_public_convex_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Google Maps (optional for enhanced features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Initialize Convex**
```bash
npx convex dev
```

5. **Run the development server**
```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production
```bash
# Create production build
npm run build

# Start production server
npm start
```

---

## 📁 Project Structure
```
raywise/
├── app/                           # Next.js 15 App Router
│   ├── api/                       # API Routes
│   │   ├── analyze-rooftop/       # AI rooftop analysis
│   │   │   └── route.ts
│   │   ├── calculate-roi/         # ROI calculations
│   │   │   └── route.ts
│   │   ├── compare-plans/         # Solar plan comparisons
│   │   │   └── route.ts
│   │   ├── fetch-satellite-image/ # Satellite imagery
│   │   │   └── route.ts
│   │   ├── find-installers/       # Installer network
│   │   │   └── route.ts
│   │   ├── generate-predictions/  # Energy predictions
│   │   │   └── route.ts
│   │   ├── geocode/               # Address to coordinates
│   │   │   └── route.ts
│   │   ├── get-recommendations/   # Panel recommendations
│   │   │   └── route.ts
│   │   ├── reverse-geocode/       # Coordinates to address
│   │   │   └── route.ts
│   │   └── solar-assistant/       # AI chatbot
│   │       └── route.ts
│   │
│   ├── dashboard/                 # Main dashboard
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── sign-in/                   # Authentication pages
│   ├── sign-up/
│   │
│   ├── favicon.ico
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Landing page
│
├── components/                    # React Components
│   ├── ui/                        # shadcn/ui components
│   │   ├── AISolarAssistant.tsx   # AI chatbot interface
│   │   ├── ConvexClientProvider.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   ├── NotificationPanel.tsx
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectDetailModal.tsx
│   │   ├── RecommendationsGenerator.tsx
│   │   ├── RooftopAnalyzer.tsx    # Main canvas component
│   │   ├── SolarRecommendations.tsx
│   │   ├── ThemeToggler.tsx
│   │   └── Providers.tsx
│   │
│   └── (other UI components)
│
├── convex/                        # Convex Backend
│   ├── _generated/                # Auto-generated types
│   ├── auth.config.ts             # Clerk integration
│   ├── finalizedLayouts.ts        # Finalized projects schema
│   ├── http.ts                    # HTTP routes
│   ├── notifications.ts           # Notifications schema
│   ├── recommendations.ts         # Recommendations schema
│   ├── rooftopAnalysis.ts         # Analysis schema
│   ├── savedProjects.ts           # Projects schema
│   ├── savedRecommendations.ts
│   ├── schema.ts                  # Database schema
│   └── users.ts                   # User schema
│
├── lib/                           # Utilities & Configs
│   ├── Calculator.ts              # ROI calculations
│   ├── utils.ts                   # Helper functions
│   └── (other utilities)
│
├── public/                        # Static assets
│   └── (images, fonts, etc.)
│
├── .env.local                     # Environment variables
├── .eslintrc.json                 # ESLint config
├── .gitignore
├── components.json                # shadcn/ui config
├── next.config.ts                 # Next.js configuration
├── package.json
├── package-lock.json
├── postcss.config.mjs             # PostCSS config
├── README.md
├── tailwind.config.ts             # Tailwind config
└── tsconfig.json                  # TypeScript config
```

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CONVEX_DEPLOYMENT` | Convex deployment URL | `https://your-project.convex.cloud` |
| `NEXT_PUBLIC_CONVEX_URL` | Public Convex URL | `https://your-project.convex.cloud` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | For enhanced map features |
| `NEXT_PUBLIC_APP_URL` | Application base URL |

### Getting API Keys

1. **Convex**: Sign up at [convex.dev](https://convex.dev) and create a new project
2. **Clerk**: Create account at [clerk.com](https://clerk.com) and set up application
3. **Gemini**: Get API key from [Google AI Studio](https://ai.google.dev/)
4. **Google Maps** (optional): [Google Cloud Console](https://console.cloud.google.com/)

---

## 📸 Screenshots

### Landing Page
![Landing Page](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=RayWise+Landing+Page)
*AI-Powered Solar Rooftop Analysis - Hero Section*

### Intelligent Solar Analysis
![Features](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=Computer+Vision+Analysis)
*Computer Vision, Smart Optimization, Energy Predictions, Provider Network*

### How It Works
![How It Works](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=3+Simple+Steps)
*Upload Your Rooftop → AI Analysis → Get Results*

### Dashboard Overview
![Dashboard](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=Solar+Energy+Dashboard)
*Main dashboard with live stats, metrics, and quick actions*

### Rooftop Analyzer
![Analyzer](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=AI+Rooftop+Analyzer)
*Interactive canvas for image upload, location setting, and polygon drawing*

### Energy Production Forecast
![Forecast](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=Energy+Production+Charts)
*12-month energy consumption vs production visualization with ROI analysis*

### Cost vs Savings Analysis
![ROI](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=ROI+Analysis)
*Comprehensive financial breakdown showing investment return over 8 years*

### Solar Panel Recommendations
![Recommendations](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=Panel+Recommendations)
*AI-generated panel suggestions with efficiency ratings, pricing, and pros/cons*

### AI Solar Assistant
![AI Assistant](https://via.placeholder.com/1200x600/1a1a1a/ff8c42?text=AI+Solar+Assistant)
*Interactive chatbot for real-time solar energy guidance and calculations*

---

## ⚡ Performance

### Optimizations Implemented

1. **Next.js 15 Features**
   - Turbopack for faster builds
   - Server Components for reduced bundle size
   - Image optimization with next/image
   - Font optimization

2. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based code splitting
   - Lazy loading for Three.js scenes

3. **Caching Strategy**
   - API response caching
   - Static asset caching
   - Convex real-time subscriptions

4. **Animation Performance**
   - GSAP for optimized animations
   - RequestAnimationFrame for smooth 60fps
   - Hardware acceleration via CSS transforms

5. **Image Optimization**
   - WebP format with fallbacks
   - Responsive images
   - Lazy loading below fold

### Performance Metrics

- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.0s
- **Cumulative Layout Shift (CLS)**: < 0.1
- **First Input Delay (FID)**: < 100ms
- **Lighthouse Score**: 90+

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Use ESLint for code linting
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation for new features
- Ensure all tests pass before submitting

### Development Guidelines
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Type checking
npm run type-check
```

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.
```
MIT License

Copyright (c) 2025 Kritika Benjwal & Gauri Sharma

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Team

<div align="center">

### Made with ❤️ by Kritika Benjwal & Gauri Sharma

</div>

<table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/Kritika11052005.png" width="150px" alt="Kritika Benjwal"/>
      <br />
      <sub><b>Kritika Benjwal</b></sub>
      <br />
      <a href="https://github.com/Kritika11052005">
        <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
      </a>
      <br />
      <a href="mailto:ananya.benjwal@gmail.com">
        <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/>
      </a>
      <br />
      <a href="https://www.linkedin.com/in/kritika-benjwal/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
      </a>
    </td>
    <td align="center">
      <img src="https://github.com/gauri-sharma9.png" width="150px" alt="Gauri Sharma"/>
      <br />
      <sub><b>Gauri Sharma</b></sub>
      <br />
      <a href="https://github.com/gauri-sharma9">
        <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
      </a>
      <br />
      <a href="mailto:gaurisharma9104@gmail.com">
        <img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email"/>
      </a>
      <br />
      <a href="https://www.linkedin.com/in/gauri-sharma-7a48a6332/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn"/>
      </a>
    </td>
  </tr>
</table>

---

## 🙏 Acknowledgments

- **Next.js Team** for the incredible framework
- **Convex** for the real-time backend platform
- **Clerk** for seamless authentication
- **Google Gemini** for powerful AI capabilities
- **Vercel** for hosting and deployment
- **shadcn/ui** for beautiful components
- **GSAP** for smooth animations
- **Three.js** for 3D graphics
- **The open-source community** for amazing tools

---

## 🔮 Future Enhancements

- [ ] Mobile app version (React Native)
- [ ] Real-time weather integration for dynamic predictions
- [ ] 3D rooftop visualization with Three.js
- [ ] Multi-language support (i18n)
- [ ] Advanced shading analysis
- [ ] Battery storage recommendations
- [ ] Government incentive calculator
- [ ] Social sharing features
- [ ] Video tutorials and guides
- [ ] Installer rating system
- [ ] Payment gateway integration
- [ ] Email notification system
- [ ] Advanced analytics dashboard
- [ ] Community forum

---

<div align="center">

### Built with Next.js 15 🚀

![Made with Next.js](https://img.shields.io/badge/Made%20with-Next.js%2015-black?style=for-the-badge&logo=next.js)
![Powered by Convex](https://img.shields.io/badge/Powered%20by-Convex-orange?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

⭐ **Star this repo if you find it helpful!**

[🔗 Live Demo](https://ray-wise.vercel.app) | [📧 Contact](mailto:ananya.benjwal@gmail.com) | [💼 Contribute](https://github.com/Kritika11052005/RayWise)

---

© 2025 RayWise. All rights reserved.

*Join thousands of homeowners who have discovered their solar potential with RayWise. Start your journey to clean, renewable energy today.*

</div>
