# BetChat - Social Betting Platform

## Overview

BetChat is a comprehensive social betting and challenge platform that combines event prediction, peer-to-peer challenges, and real-time chat functionality. The application allows users to create prediction events, participate in challenges, interact with friends, and manage their virtual currency through a gamified experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- **Authentication & Profile System Fix (July 2025)**: Fixed authentication middleware on all protected endpoints, implemented complete profile editing system with PUT /api/users/:id endpoint
- **Event Betting System Enhancement (July 2025)**: Added authentication to event join endpoint, fixed wallet balance validation, enhanced event matching system
- **Profile Settings Implementation (July 2025)**: Created fully functional profile settings page with form handling, image upload, and database persistence
- **API Request System Overhaul (July 2025)**: Updated all API requests to include proper authentication headers for GET and POST requests

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live chat and notifications

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with session-based authentication
- **Real-time Features**: WebSocket server for live updates and messaging
- **API Design**: RESTful API with structured error handling

### Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon Database serverless connection with connection pooling
- **Schema**: Comprehensive schema covering users, events, challenges, messaging, and financial transactions
- **Sessions**: PostgreSQL-based session storage for authentication

## Key Components

### User Management
- **Authentication**: Replit Auth integration with OpenID Connect
- **User Profiles**: Level-based progression system with XP and points
- **Social Features**: Friend system with request/acceptance workflow
- **Session Management**: Secure session handling with database persistence

### Event System
- **Event Creation**: Users can create prediction events with categories (Crypto, Sports, Gaming, Music, Politics)
- **Participation**: Pool-based betting with entry fees and prediction tracking
- **Real-time Chat**: Live messaging within event rooms
- **Status Management**: Event lifecycle from creation to completion

### Challenge System
- **Peer-to-Peer Challenges**: Direct challenges between users with wager amounts
- **Escrow System**: Secure fund holding during active challenges
- **Evidence-Based Completion**: Challenge resolution with dispute handling
- **Category-based Organization**: Structured challenge types and rules

### Messaging System
- **Real-time Chat**: WebSocket-based messaging for events and challenges
- **Message Types**: Support for text, emojis, and media content
- **Room Management**: Automatic room joining/leaving based on participation

### Gamification
- **Points System**: Virtual currency for participation and rewards
- **Daily Login Bonuses**: Streak-based reward system
- **Achievement System**: Progress tracking and milestone rewards
- **Leaderboards**: Competitive ranking system

## Data Flow

### Authentication Flow
1. User initiates login through Replit Auth
2. OpenID Connect verification with Replit services
3. Session creation and user profile synchronization
4. Client-side state management through TanStack Query

### Event Participation Flow
1. User browses available events
2. Selects event and makes prediction with wager
3. Database transaction creates participation record
4. Real-time updates notify other participants
5. WebSocket connection established for live chat

### Challenge Flow
1. User creates challenge with target user and terms
2. Challenge invitation sent to target user
3. Acceptance triggers escrow fund transfer
4. Challenge completion requires evidence submission
5. Resolution updates winner and distributes funds

### Real-time Communication
1. WebSocket connection established on authentication
2. Users join specific rooms (event/challenge-based)
3. Messages broadcast to all room participants
4. Automatic reconnection handling for reliability

## External Dependencies

### Database Services
- **Neon Database**: PostgreSQL hosting with serverless architecture
- **Connection Pooling**: Efficient database connection management

### Authentication Services
- **Replit Auth**: OAuth 2.0 / OpenID Connect integration
- **Session Management**: Server-side session storage with expiration

### Real-time Services
- **WebSocket Server**: Native WebSocket implementation for live features
- **Message Broadcasting**: Room-based message distribution

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library for consistent iconography
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Development Environment
- **Replit Integration**: Native Replit development environment support
- **Hot Module Replacement**: Vite-powered development server
- **Environment Variables**: Secure configuration management

### Production Build
- **Frontend**: Vite build with optimized bundle splitting
- **Backend**: ESBuild compilation for Node.js deployment
- **Asset Management**: Static file serving with proper caching

### Database Management
- **Migration System**: Drizzle Kit for schema migrations
- **Environment Separation**: Separate database instances for development/production

### Security Considerations
- **Session Security**: HTTP-only cookies with secure flags
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Zod schema validation for all user inputs
- **SQL Injection Prevention**: Parameterized queries through Drizzle ORM

The application follows a monorepo structure with clear separation between client, server, and shared code, enabling maintainable development and deployment workflows.