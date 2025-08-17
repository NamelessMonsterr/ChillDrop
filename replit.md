# ChillDrop - Secure File Sharing Application

## Overview

ChillDrop is a full-stack web application that provides secure, temporary file sharing and chat functionality through private rooms. The application emphasizes privacy and security with automatic expiration, password protection, and client-side encryption. Built with modern web technologies, it features a React frontend with shadcn/ui components, Express.js backend, and PostgreSQL database with Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- Updated footer branding to "Made By Hammad" instead of copyright notice
- Removed Contact link from footer navigation  
- Enhanced room statistics display with glassmorphism cards
- Implemented comprehensive feature set including QR codes, bulk downloads, emoji picker, and typing indicators

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and building
- **UI Components**: shadcn/ui component library providing pre-built, accessible components
- **Styling**: Tailwind CSS with custom design system featuring glassmorphism effects and gradient themes
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth transitions and interactive elements

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **API Design**: RESTful API with structured route handling for rooms, files, and messages
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Password-based room access with bcrypt hashing
- **File Storage**: Supabase Storage for secure file uploads with signed URLs
- **Development**: Hot reload with Vite integration for seamless development experience

### Database Schema
- **Rooms Table**: Stores room metadata with name, password hash, expiration timestamps
- **Files Table**: Tracks uploaded files with metadata, storage paths, and encryption keys
- **Messages Table**: Handles chat messages with sender information and optional file attachments
- **Relationships**: Foreign key constraints with cascade delete for data integrity

### Security Implementation
- **Client-Side Encryption**: Web Crypto API with AES-GCM encryption for files before upload
- **Password Security**: Bcrypt hashing with high salt rounds for room passwords
- **Access Control**: Signed URLs with short expiration times (15 minutes) for file downloads
- **Zero-Knowledge Architecture**: Encryption keys never leave the client browser
- **Automatic Cleanup**: Scheduled deletion of expired rooms and files

### Real-time Features
- **Chat System**: Real-time messaging with polling-based updates every 2 seconds
- **File Notifications**: Automatic refresh of file lists when new uploads are detected
- **Expiry Countdown**: Live countdown timers showing remaining room lifetime
- **Presence Indicators**: Basic participant count tracking for active rooms

## External Dependencies

### Core Infrastructure
- **Supabase**: Backend-as-a-Service providing database, storage, and real-time capabilities
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Drizzle Kit**: Database migration tool for schema management

### UI and Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe utility for component variant styling

### Development Tools
- **TypeScript**: Static type checking for enhanced developer experience
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds
- **React Hook Form**: Form validation and state management

### Security and Utilities
- **bcrypt**: Password hashing library for secure authentication
- **Zod**: Runtime type validation for API requests and responses
- **React Dropzone**: Drag-and-drop file upload interface
- **QR Code Generation**: For easy room sharing (planned feature)