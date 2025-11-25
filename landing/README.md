# QuickServe Landing Page

A modern React TypeScript landing page for QuickServe restaurant management platform.

## Features

- **Modern Authentication**: Clean login and signup forms with validation
- **Restaurant Registration**: Complete registration flow for new restaurants
- **Dashboard**: Centralized dashboard to access admin and customer panels
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Clean, professional design with shadcn/ui components

## Tech Stack

- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and better development experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **React Hook Form**: Performant forms with easy validation
- **React Router**: Client-side routing

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Backend Integration

The landing page connects to the QuickServe backend at `http://localhost:5000`. Make sure the backend is running before testing authentication features.

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── LoginForm.tsx   # Login form component
│   ├── SignupForm.tsx  # Registration form component
│   └── Dashboard.tsx   # Main dashboard component
├── context/            # React context providers
│   └── AuthContext.tsx # Authentication context and hooks
├── pages/              # Page components
│   └── LandingPage.tsx # Main landing page
├── lib/                # Utility functions
│   └── utils.ts        # Common utility functions
├── App.tsx             # Main app component with routing
├── main.tsx           # React app entry point
└── index.css          # Global styles and Tailwind imports
```

## Environment Variables

No environment variables are required for development. The app connects to the backend at `http://localhost:5000` by default.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features in Detail

### Authentication

- **Login**: Secure login for existing restaurants
- **Registration**: Complete registration flow with validation
- **Protected Routes**: Automatic redirects based on auth state
- **Persistent Sessions**: Login state persists across browser sessions

### Dashboard

- **Restaurant Info**: Display restaurant details
- **Quick Access**: Direct links to admin and customer panels
- **Modern UI**: Clean, professional interface
- **Responsive**: Works on all device sizes

### Integration

The landing page integrates seamlessly with:
- **Admin Panel**: Restaurant management interface
- **Customer App**: Customer-facing ordering system
- **Backend API**: Full integration with QuickServe backend

## Deployment

For production deployment:

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Configure environment variables for production backend URL

## Contributing

1. Follow the existing code style and patterns
2. Add TypeScript types for all new code
3. Ensure responsive design for all new components
4. Test authentication flow thoroughly