# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YesSales (耶氏台球斗南销售中心报价系统) is a comprehensive quotation management system for a billiards sales center. The system consists of a modern web application built with Vue 3 + PWA capabilities and a Supabase backend.

## Architecture

### Modern Web Application Architecture
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage + Auth)
- **Frontend**: Vue 3 + PWA Web Application with responsive design
- **Deployment**: Static web hosting with progressive enhancement

### Tech Stack
- **Frontend**: Vue 3 + TypeScript + Pinia + Element Plus/Naive UI
- **PWA Features**: Service Workers, App Manifest, Offline Support
- **Styling**: Modern CSS + Responsive Design (Mobile-first)
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage + Auth)
- **Build Tools**: Vite + TypeScript + ESLint + Prettier + PWA Plugin
- **Deployment**: Static hosting (Netlify/Vercel/CDN) with automated CI/CD

## Directory Structure

```
/
├── frontend/          # Vue 3 + PWA Web Application
│   ├── src/
│   │   ├── components/    # Reusable Vue components
│   │   ├── views/        # Page components  
│   │   ├── router/       # Vue Router configuration
│   │   ├── stores/       # Pinia state management
│   │   ├── api/          # API client methods
│   │   ├── utils/        # Utility functions
│   │   └── styles/       # Global styles and themes
│   ├── public/           # Static assets and PWA manifest
│   └── dist/            # Production build output
├── backend/             # Supabase backend services
│   ├── supabase/       # Database migrations, functions, config
│   ├── scripts/        # Database and backup scripts
│   └── docs/           # Backend documentation
├── shared/              # Shared types, API clients, mock data
└── docs/                # Project documentation
```

## Development Commands

### Frontend Development
```bash
cd frontend/

# Development
npm run dev                      # Development server with HMR (port 3001)
npm run preview                  # Preview production build locally

# Production Build  
npm run build                    # Production build with PWA optimization
npm run build:analyze           # Build with bundle analyzer
./scripts/build-production.sh   # Full production build with validation

# Code Quality
npm run type-check              # TypeScript checking
npm run lint                    # ESLint + Prettier
npm run validate                # Complete validation pipeline
```

### Backend Development (Terminal 1)
```bash
cd backend/

# Supabase Local Development
supabase start                   # Start local Supabase (ports 54321-54329)
supabase status                  # Check service status
supabase stop                    # Stop all services

# Database Management
supabase db reset                # Reset to clean state
supabase db push                 # Push local changes to remote
supabase gen types typescript --local  # Generate TypeScript types
```

### Testing & Validation
```bash
# Frontend validation
npm run validate                 # Type check + lint + format check
npm run test:smoke              # Basic functionality tests

# Database testing
cd backend/scripts/
./monitor-database-performance.sql  # Performance monitoring queries
./optimize-common-queries.sql       # Query optimization
```

## Configuration Management

### Environment Variables
- **Frontend**: Uses `VITE_*` prefixed environment variables
- **Backend**: Supabase configuration in `backend/supabase/config.toml`
- **Production**: Environment files and deployment scripts handle configuration

### Key Configuration Files
- `frontend/vite.config.ts` - Vite configuration with PWA plugin
- `frontend/package.json` - Dependencies and scripts  
- `frontend/tsconfig.json` - TypeScript configuration
- `frontend/public/manifest.json` - PWA manifest
- `backend/supabase/config.toml` - Supabase local development
- `backend/supabase/migrations/` - Database schema versions

## Build System

### Production Build Process
The frontend uses a sophisticated build system with multiple verification stages:

1. **Environment Validation**: Checks Node.js version, environment variables
2. **Quality Gates**: TypeScript checking, ESLint, Prettier validation
3. **Optimized Build**: Vite production build with tree shaking and code splitting
4. **Asset Optimization**: Gzip compression analysis and bundle size reporting
5. **Deployment Packaging**: Automated deployment package with scripts

### Build Configurations
- **Production**: `vite.config.ts` optimized for PWA and static deployment
- **Development**: Hot module replacement with API proxy to Supabase
- **PWA**: Service worker generation and manifest configuration
- **Bundle Analysis**: Rollup bundle analyzer for optimization insights

## Database Schema

Core entities managed by the system:
- **Customers**: Customer information and contact details
- **Products**: Billiards equipment and accessories catalog
- **Quotes**: Quotation records with line items and pricing
- **Users**: System user accounts with role-based permissions
- **Logs**: Comprehensive audit trail for all operations

## API Integration

### Supabase Integration
- **REST API**: Auto-generated from PostgreSQL schema
- **Real-time**: WebSocket subscriptions for live data updates
- **Storage**: File upload handling for product images
- **Auth**: User authentication and session management
- **Edge Functions**: Custom business logic in TypeScript/Deno

### API Client Structure
```typescript
// Shared API client in /shared/api/
client.ts         // Supabase client configuration
auth.ts          // Authentication methods
products.ts      // Product CRUD operations
quotes.ts        // Quotation management
customers.ts     // Customer data management
```

## Development Workflow

### Starting Development
```bash
# 1. Start backend services
cd backend && supabase start

# 2. Install frontend dependencies
cd frontend && npm install

# 3. Start development server
npm run dev

# 4. Access web application at http://localhost:3001
```

### Making Changes
1. **Database Changes**: Create migrations in `backend/supabase/migrations/`
2. **Frontend Changes**: Follow Vue 3 Composition API patterns
3. **API Changes**: Update shared types and client methods
4. **Testing**: Use validation commands before committing

### Production Deployment
```bash
cd frontend/
./scripts/build-production.sh    # Creates optimized build with deployment package
```

## Code Patterns

### Vue 3 Patterns
- **Composition API**: Primary pattern for all components
- **Pinia Stores**: Centralized state management with TypeScript
- **UI Library Components**: Element Plus/Naive UI component system
- **Vue Router**: Client-side routing with navigation guards
- **Responsive Design**: Mobile-first CSS with breakpoint management
- **TypeScript**: Strict typing throughout the application

### State Management
```typescript
// Pinia store pattern in /stores/
export const useQuoteStore = defineStore('quotes', () => {
  // Reactive state
  const quotes = ref<Quote[]>([])
  
  // Computed properties
  const activeQuotes = computed(() => ...)
  
  // Actions
  const fetchQuotes = async () => { ... }
  
  return { quotes, activeQuotes, fetchQuotes }
})
```

### API Integration Pattern
```typescript
// Service layer pattern in /api/
export class QuoteService {
  async create(quote: CreateQuoteRequest): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert(quote)
      .select()
    
    if (error) throw new APIError(error.message)
    return data[0]
  }
}
```

## Debugging & Troubleshooting

### Development Issues
- **Port Conflicts**: Default ports are 3001 (frontend), 54321-54329 (Supabase)
- **Build Failures**: Run validation commands to identify TypeScript/linting issues
- **Database Issues**: Use `supabase db reset` to restore clean state

### Production Issues
- **Build Analysis**: Check `build-report.json` for bundle size and optimization metrics
- **Performance**: Use database performance monitoring scripts
- **Deployment**: Review deployment logs and verify environment configuration

## Security Considerations

### Data Protection
- **Row Level Security (RLS)**: Implemented on all database tables
- **Input Validation**: Client and server-side validation
- **File Upload Security**: Controlled through Supabase Storage policies
- **Authentication**: JWT-based session management

### Environment Security
- **Secrets Management**: Environment variables for sensitive configuration
- **API Security**: Supabase API keys and service role management
- **Production Hardening**: Build process includes security validation steps