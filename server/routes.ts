import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { paystackService } from './paystack';
import { insertEventSchema, insertChallengeSchema, insertEventMessageSchema, insertChallengeMessageSchema, users, eventParticipants, events, eventPools, transactions } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { db } from "./db";
import { eq, and, or, sql, ne } from "drizzle-orm";
import crypto from 'crypto';
import { supabaseIsAuthenticated, supabase } from './supabaseAuth';

interface WebSocketClient extends WebSocket {
  userId?: string;
  eventId?: string;
  challengeId?: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  // await setupAuth(app);

  // Auth routes are handled by setupAuth()

  // Add error handling for OAuth failures
  app.get('/api/callback', (req, res, next) => {
    // Check for OAuth error parameters
    if (req.query.error) {
      console.error('OAuth Error:', req.query.error, req.query.error_description);
      return res.redirect('/?auth_error=1');
    }
    next();
  });

  app.get('/api/auth/user', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      // Use Supabase authentication: user ID should be at req.user.id
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.get('/api/users/:id', async (req, res) => {
    try {
      const profile = await storage.getUserProfile(req.params.id);
      if (!profile) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });

  app.post('/api/users/:id/follow', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.id;

      if (userId === targetUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      await storage.followUser(userId, targetUserId);
      res.json({ message: "Successfully followed user" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.post('/api/users/:id/unfollow', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const targetUserId = req.params.id;

      await storage.unfollowUser(userId, targetUserId);
      res.json({ message: "Successfully unfollowed user" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get('/api/users/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json([]);
      }

      // Search users by username or firstName
      const users = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
        })
        .from(users)
        .where(
          or(
            sql`${users.username} ILIKE ${`%${query}%`}`,
            sql`${users.firstName} ILIKE ${`%${query}%`}`
          )
        )
        .limit(10);

      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.post('/api/transactions/tip', async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { recipientId, amount } = req.body;

      if (!recipientId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Invalid tip data" });
      }

      if (userId === recipientId) {
        return res.status(400).json({ message: "Cannot tip yourself" });
      }

      // Check if user has enough balance
      const user = await storage.getUser(userId);
      if (!user || Number(user.availablePoints) < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Create tip transaction
      await storage.createTransaction({
        userId,
        type: "tip",
        amount: amount.toString(),
        description: `Tip sent to user`,
        status: "completed",
        referenceId: recipientId,
        metadata: { recipientId }
      });

      // Update user points
      await storage.updateUserPoints(userId, -amount, 0);
      await storage.updateUserPoints(recipientId, amount, 0);

      res.json({ message: "Tip sent successfully" });
    } catch (error) {
      console.error("Error sending tip:", error);
      res.status(500).json({ message: "Failed to send tip" });
    }
  });

  // Events routes
  app.get('/api/events', async (req: any, res) => {
    try {
      const searchQuery = req.query.search as string;
      const useRecommendations = req.query.recommended === 'true';
      let events;
      if (useRecommendations && !searchQuery && req.user && req.user.id) {
        // Get personalized recommendations only if user is authenticated
        const recommendedEvents = await storage.getRecommendedEvents(req.user.id, 20);
        const regularEvents = await storage.getEvents();
        const recommendedIds = new Set(recommendedEvents.map(e => e.id));
        const otherEvents = regularEvents.filter(e => !recommendedIds.has(e.id));
        events = [...recommendedEvents, ...otherEvents.slice(0, 10)];
      } else {
        events = await storage.getEvents(searchQuery);
      }
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get single event
  app.get('/api/events/:id', async (req: any, res) => {
    try {
      const event = await db.select().from(events).where(eq(events.id, req.params.id)).limit(1);
      if (event.length === 0) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Get creator info
      const creator = await db.select().from(users).where(eq(users.id, event[0].creatorId)).limit(1);
      const creatorUsername = creator.length > 0 ? creator[0].username || creator[0].firstName : null;

      // Get participant count
      const participantCount = await db.select({ count: sql<number>`count(*)` })
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, req.params.id));

      const eventWithDetails = {
        ...event[0],
        creatorUsername,
        participantCount: participantCount[0]?.count || 0
      };

      res.json(eventWithDetails);
    } catch (error) {
      console.error('Error fetching event:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get event participants
  app.get('/api/events/:id/participants', async (req: any, res) => {
    try {
      const participants = await db.select({
        userId: eventParticipants.userId,
        joinedAt: eventParticipants.joinedAt,
        prediction: eventParticipants.prediction,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName
      })
      .from(eventParticipants)
      .leftJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, req.params.id));

      res.json({
        count: participants.length,
        participants
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Event recommendations route
  app.get('/api/events/recommended/:userId', async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      // Verify user can access these recommendations
      if (req.user.claims.sub !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const recommendations = await storage.getRecommendedEvents(userId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/events', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEventSchema.parse({
        ...req.body,
        creatorId: userId,
      });

      const event = await storage.createEvent(validatedData);

      // Get creator info
      const creator = await storage.getUser(userId);
      const eventWithCreator = {
        ...event,
        creator: {
          id: creator?.id,
          username: creator?.username || creator?.firstName,
        }
      };

      res.status(201).json(eventWithCreator);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  app.post('/api/events/:id/join', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { prediction, wagerAmount } = req.body;
      const eventId = req.params.id;

      // Check if user has sufficient balance
      const user = await storage.getUser(userId);
      if (!user || parseFloat(user.availablePoints || '0') < wagerAmount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Check if user already joined this event
      const existingParticipation = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        ))
        .limit(1);

      if (existingParticipation.length > 0) {
        return res.status(400).json({ message: "Already joined this event" });
      }

      // Deduct wager amount from user's balance
      if (wagerAmount > 0) {
        await db
          .update(users)
          .set({
            availablePoints: sql`${users.availablePoints} - ${wagerAmount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));
      }

      // Join the event
      await storage.joinEvent(eventId, userId, prediction, wagerAmount || 0);

      // Track user interaction for recommendations
      await storage.trackUserInteraction(userId, eventId, 'bet', {
        prediction,
        wagerAmount,
        timestamp: new Date().toISOString()
      });

      // Send "looking for match" notification
      await storage.createNotification({
        userId,
        type: 'bet_placed',
        title: 'Bet Placed',
        content: 'You are currently being matched, please wait...',
        metadata: { eventId, prediction, wagerAmount }
      });

      // Broadcast notification via WebSocket
      broadcastToEventRoom(eventId, 'bet_placed', {
        userId,
        prediction,
        wagerAmount,
        message: 'Looking for opponent...'
      });

      // Look for matching opponent
      const matchedUserId = await storage.findEventMatch(eventId, userId, prediction, wagerAmount);

      if (matchedUserId) {
        // Get matched user details
        const matchedUser = await storage.getUser(matchedUserId);

        // Create match record
        await storage.createEventMatch(
          eventId,
          userId,
          matchedUserId,
          prediction,
          !prediction,
          wagerAmount,
          wagerAmount
        );

        // Send match notifications to both users
        await storage.createNotification({
          userId,
          type: 'match_found',
          title: 'Match Found!',
          content: `You have been matched with @${matchedUser?.username || 'user'}, Good luck!`,
          metadata: { eventId, opponentId: matchedUserId, opponentUsername: matchedUser?.username }
        });

        await storage.createNotification({
          userId: matchedUserId,
          type: 'match_found',
          title: 'Match Found!',
          content: `You have been matched with @${user.username || 'user'}, Good luck!`,
          metadata: { eventId, opponentId: userId, opponentUsername: user.username }
        });

        // Broadcast match found notifications
        broadcastToEventRoom(eventId, 'match_found', {
          user1: { id: userId, username: user.username, prediction },
          user2: { id: matchedUserId, username: matchedUser?.username, prediction: !prediction },
          eventId
        });
      }

      res.json({ 
        message: "Successfully joined event",
        matched: !!matchedUserId,
        matchedWith: matchedUserId ? matchedUserId : null
      });
    } catch (error) {
      console.error("Error joining event:", error);
      res.status(500).json({ message: "Failed to join event" });
    }
  });

  // Get event pool data
  app.get('/api/events/:id/pool', async (req, res) => {
    try {
      const eventId = req.params.id;

      // Get pool amounts
      const [pool] = await db.select()
        .from(eventPools)
        .where(eq(eventPools.eventId, eventId))
        .limit(1);

      // Get participant counts
      const participantCounts = await db.select({
        prediction: eventParticipants.prediction,
        count: sql<number>`count(*)`,
      })
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId))
      .groupBy(eventParticipants.prediction);

      const yesCount = participantCounts.find(p => p.prediction === true)?.count || 0;
      const noCount = participantCounts.find(p => p.prediction === false)?.count || 0;

      res.json({
        totalAmount: parseFloat(pool?.totalAmount || '0'),
        yesAmount: parseFloat(pool?.yesAmount || '0'),
        noAmount: parseFloat(pool?.noAmount || '0'),
        yesParticipants: yesCount,
        noParticipants: noCount,
      });
    } catch (error) {
      console.error("Error fetching event pool:", error);
      res.status(500).json({ message: "Failed to fetch event pool" });
    }
  });

  // Get user participation in event
  app.get('/api/events/:id/participation/:userId', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { id: eventId, userId } = req.params;
      const currentUserId = req.user.claims.sub;

      // Only allow users to check their own participation
      if (currentUserId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const [participation] = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.userId, userId)
        ))
        .limit(1);

      if (!participation) {
        return res.json({ hasJoined: false });
      }

      res.json({
        hasJoined: true,
        prediction: participation.prediction,
        amount: parseFloat(participation.wagerAmount || '0'),
        joinedAt: participation.joinedAt,
      });
    } catch (error) {
      console.error("Error fetching user participation:", error);
      res.status(500).json({ message: "Failed to fetch user participation" });
    }
  });

  app.get('/api/events/:id/participants', async (req, res) => {
    try {
      const participants = await storage.getEventParticipants(req.params.id);
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ message: "Failed to fetch participants" });
    }
  });

  // Broadcast notification to all users
  app.post('/api/notifications/broadcast', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { type, title, message, eventId } = req.body;
      const userId = req.user.claims.sub;

      console.log('Broadcasting notification:', { type, title, message, eventId });

      // Get user info for the notification
      const creator = await storage.getUser(userId);
      const notificationMessage = `@${creator?.username || creator?.firstName || 'Someone'} has just created a new event. Join now!`;

      // Broadcast to all connected WebSocket clients
      const notification = {
        type: 'new_event_notification',
        data: {
          type,
          title,
          message: notificationMessage,
          eventId,
          creatorId: userId,
          creatorName: creator?.username || creator?.firstName,
          timestamp: new Date().toISOString()
        }
      };

      // Send to all connected clients
      wss.clients.forEach((client: WebSocketClient) => {
        if (client.readyState === WebSocket.OPEN && client.userId !== userId) {
          client.send(JSON.stringify(notification));
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error broadcasting notification:", error);
      res.status(500).json({ message: "Failed to broadcast notification" });
    }
  });

  // Event messages routes
  app.get('/api/events/:id/messages', async (req, res) => {
    try {
      const messages = await storage.getEventMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching event messages:", error);
      res.status(500).json({ message: "Failed to fetch event messages" });
    }
  });

  app.post('/api/events/:id/messages', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertEventMessageSchema.parse({
        ...req.body,
        eventId: req.params.id,
        userId,
      });

      const message = await storage.createEventMessage(validatedData);

      // Broadcast to WebSocket clients
      broadcastToEventRoom(req.params.id, 'new_message', message);

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating event message:", error);
      res.status(500).json({ message: "Failed to create event message" });
    }
  });

  // Challenges routes
  app.get('/api/challenges', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const challenges = await storage.getChallenges(userId);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.get('/api/challenges/:id', async (req, res) => {
    try {
      const challenge = await storage.getChallenge(req.params.id);
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      res.json(challenge);
    } catch (error) {
      console.error("Error fetching challenge:", error);
      res.status(500).json({ message: "Failed to fetch challenge" });
    }
  });

  app.post('/api/challenges', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChallengeSchema.parse({
        ...req.body,
        challengerId: userId,
      });

      const challenge = await storage.createChallenge(validatedData);
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Error creating challenge:", error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  app.post('/api/challenges/:id/accept', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.acceptChallenge(req.params.id, userId);
      res.json({ message: "Challenge accepted" });
    } catch (error) {
      console.error("Error accepting challenge:", error);
      res.status(500).json({ message: "Failed to accept challenge" });
    }
  });

  app.post('/api/challenges/:id/decline', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      await storage.updateChallengeStatus(req.params.id, "declined");
      res.json({ message: "Challenge declined" });
    } catch (error) {
      console.error("Error declining challenge:", error);
      res.status(500).json({ message: "Failed to decline challenge" });
    }
  });

  // Challenge messages routes
  app.get('/api/challenges/:id/messages', async (req, res) => {
    try {
      const messages = await storage.getChallengeMessages(req.params.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching challenge messages:", error);
      res.status(500).json({ message: "Failed to fetch challenge messages" });
    }
  });

  app.post('/api/challenges/:id/messages', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertChallengeMessageSchema.parse({
        ...req.body,
        challengeId: req.params.id,
        userId,
      });

      const message = await storage.createChallengeMessage(validatedData);

      // Broadcast to WebSocket clients
      broadcastToChallengeRoom(req.params.id, 'new_message', message);

      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating challenge message:", error);
      res.status(500).json({ message: "Failed to create challenge message" });
    }
  });

  // Daily login routes
  app.post('/api/daily-login', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const dailyLogin = await storage.recordDailyLogin(userId);
      res.json(dailyLogin);
    } catch (error) {
      console.error("Error recording daily login:", error);
      res.status(500).json({ message: "Failed to record daily login" });
    }
  });

  // Notifications routes
  app.get('/api/notifications', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications/:id/read', supabaseIsAuthenticated, async (req, res) => {
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Transactions routes
  app.get('/api/transactions', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Users routes
  app.get('/api/users', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/users/search', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.user.claims.sub;
      const searchQuery = req.query.q as string;

      if (!searchQuery || searchQuery.length < 2) {
        return res.json([]);
      }

      // Get all users for search (excluding current user)
      const users = await storage.getUserFriends(currentUserId);

      // Filter users based on search query
      const filteredUsers = users.filter(user => 
        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );

      res.json(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  // Get user profile by ID
  app.get('/api/users/:userId', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;

      const profile = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          profileImageUrl: true,
          level: true,
          xp: true,
          availablePoints: true,
          totalPoints: true,
          loginStreak: true,
          createdAt: true,
        },
      });

      if (!profile) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate stats (you might want to add actual data from your DB)
      const stats = {
        eventsWon: 0,
        totalEvents: 0,
        totalEarnings: 0,
        followersCount: 0,
        followingCount: 0,
        winRate: 0,
      };

      // Check if current user is following this profile (implement your follow logic)
      const isFollowing = false;

      const profileData = {
        ...profile,
        stats,
        isFollowing,
      };

      res.json(profileData);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // Update user profile
  app.put('/api/users/:userId', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.user?.id;

      // Only allow users to update their own profile
      if (currentUserId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const { firstName, lastName, username, profileImageUrl } = req.body;

      const [updatedUser] = await db.update(users)
        .set({
          firstName,
          lastName,
          username,
          profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // Friends routes
  app.get('/api/friends', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const friends = await db.query.users.findMany({
        where: ne(users.id, userId),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          profileImageUrl: true,
          level: true,
          xp: true,
          availablePoints: true,
          totalPoints: true,
          loginStreak: true,
          createdAt: true,
        },
        limit: 50,
      });

      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

    // Follow/Unfollow user
  app.post('/api/users/:userId/follow', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;

      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
      }

      // Check if user exists
      const targetUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // TODO: Implement follow logic in your database
      // For now, just return success
      res.json({ success: true, message: 'User followed successfully' });
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  });

  app.post('/api/users/:userId/unfollow', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;

      // TODO: Implement unfollow logic in your database
      // For now, just return success
      res.json({ success: true, message: 'User unfollowed successfully' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
    }
  });

  // Send tip to user
  app.post('/api/transactions/tip', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { recipientId, amount } = req.body;

      if (!recipientId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid recipient ID and amount are required' });
      }

      // Check if user has enough balance
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
      });

      if (!currentUser || parseFloat(currentUser.availablePoints) < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Check if recipient exists
      const recipient = await db.query.users.findFirst({
        where: eq(users.id, recipientId),
      });

      if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
      }

      // Create transactions
      const tipTransaction = await db.insert(transactions).values({
        id: crypto.randomUUID(),
        userId: req.user.id,
        type: 'tip_sent',
        amount: amount.toString(),
        description: `Tip sent to ${recipient.firstName || 'User'}`,
        status: 'completed',
        createdAt: new Date(),
      }).returning();

      await db.insert(transactions).values({
        id: crypto.randomUUID(),
        userId: recipientId,
        type: 'tip_received',
        amount: amount.toString(),
        description: `Tip received from ${currentUser.firstName || 'User'}`,
        status: 'completed',
        createdAt: new Date(),
      });

      // Update balances
      await db.update(users)
        .set({ 
          availablePoints: sql`${users.availablePoints} - ${amount}`
        })
        .where(eq(users.id, req.user.id));

      await db.update(users)
        .set({ 
          availablePoints: sql`${users.availablePoints} + ${amount}`,
          totalPoints: sql`${users.totalPoints} + ${amount}`
        })
        .where(eq(users.id, recipientId));

      res.status(201).json({ success: true, transaction: tipTransaction[0] });
    } catch (error) {
      console.error('Error sending tip:', error);
      res.status(500).json({ error: 'Failed to send tip' });
    }
  });

  app.post('/api/friends/request', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.body;
      await storage.sendFriendRequest(userId, friendId);
      res.json({ message: "Friend request sent" });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });



  app.post('/api/friends/accept', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.body;
      await storage.acceptFriendRequest(userId, friendId);
      res.json({ message: "Friend request accepted" });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  // Leaderboard routes
  app.get('/api/leaderboard', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // User achievements routes
  app.get('/api/achievements', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const achievements = await storage.getUserAchievements(userId);
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Referral routes
  app.get('/api/referral/code', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const referralCode = await storage.generateReferralCode(userId);
      res.json(referralCode);
    } catch (error) {
      console.error("Error generating referral code:", error);
      res.status(500).json({ message: "Failed to generate referral code" });
    }
  });

  app.get('/api/referral/stats', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReferralStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ message: "Failed to fetch referral stats" });
    }
  });

  app.post('/api/referral/apply', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { referralCode } = req.body;
      const success = await storage.applyReferralCode(referralCode, userId);

      if (success) {
        res.json({ message: "Referral code applied successfully" });
      } else {
        res.status(400).json({ message: "Invalid referral code" });
      }
    } catch (error) {
      console.error("Error applying referral code:", error);
      res.status(500).json({ message: "Failed to apply referral code" });
    }
  });

    // Create a new transaction
  app.post('/api/transactions', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const { type, amount, description } = req.body;

      if (!type || amount === undefined) {
        return res.status(400).json({ error: 'Type and amount are required' });
      }

      const transaction = await db.insert(transactions).values({
        id: crypto.randomUUID(),
        userId: req.user.id,
        type,
        amount: amount.toString(),
        description: description || '',
        status: 'completed',
        createdAt: new Date(),
      }).returning();

      // Update user points
      if (type === 'deposit') {
        await db.update(users)
          .set({ 
            availablePoints: sql`${users.availablePoints} + ${amount}`,
            totalPoints: sql`${users.totalPoints} + ${amount}`
          })
          .where(eq(users.id, req.user.id));
      } else if (type === 'withdrawal') {
        await db.update(users)
          .set({ 
            availablePoints: sql`${users.availablePoints} - ${amount}`
          })
          .where(eq(users.id, req.user.id));
      }

      res.status(201).json(transaction[0]);
    } catch (error) {
      console.error('Error creating transaction:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server setup
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    verifyClient: async (info) => {
      try {
        const url = new URL(info.req.url!, `http://${info.req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
          console.log('WebSocket connection rejected: No token');
          return false;
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          console.log('WebSocket connection rejected: Invalid token');
          return false;
        }

        // Store user info for later use
        (info.req as any).user = user;
        return true;
      } catch (error) {
        console.error('WebSocket verification error:', error);
        return false;
      }
    }
  });

  const clients = new Set<WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient, req) => {
    clients.add(ws);
    ws.userId = (req as any).user?.id;
    console.log('New WebSocket connection for user:', ws.userId);

    ws.on('message', async (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());

        switch (data.type) {
          case 'join_event':
            ws.eventId = data.eventId;
            ws.userId = data.userId;
            break;
          case 'join_challenge':
            ws.challengeId = data.challengeId;
            ws.userId = data.userId;
            break;
          case 'leave_event':
            ws.eventId = undefined;
            break;
          case 'leave_challenge':
            ws.challengeId = undefined;
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket connection closed');
    });
  });

  // Helper functions for broadcasting
  function broadcastToEventRoom(eventId: string, type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.eventId === eventId) {
        client.send(message);
      }
    });
  }

  function broadcastToChallengeRoom(challengeId: string, type: string, data: any) {
    const message = JSON.stringify({ type, data });
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client.challengeId === challengeId) {
        client.send(message);
      }
    });
  }

  // Wallet routes
  app.post('/api/wallet/deposit', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { amount } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!amount || amount < 100) {
        return res.status(400).json({ message: "Minimum deposit amount is ₦100" });
      }

      if (amount > 1000000) {
        return res.status(400).json({ message: "Maximum deposit amount is ₦1,000,000" });
      }

      const user = await storage.getUser(userId);
      if (!user?.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      const reference = paystackService.generateReference();

      const response = await paystackService.initializeTransaction(
        amount,
        user.email,
        reference
      );

      if (response.status) {
        res.json({
          authorization_url: response.data.authorization_url,
          access_code: response.data.access_code,
          reference: reference
        });
      } else {
        res.status(400).json({ message: response.message });
      }
    } catch (error) {
      console.error("Error initializing deposit:", error);
      res.status(500).json({ message: "Failed to initialize deposit" });
    }
  });

  app.post('/api/wallet/verify-payment', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { reference } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const response = await paystackService.verifyTransaction(reference);

      if (response.status && response.data.status === 'success') {
        const amount = response.data.amount / 100; // Convert from kobo

        // Get current user to calculate new balance
        const currentUser = await storage.getUser(userId);
        const currentBalance = parseFloat(currentUser?.availablePoints || '0');
        const newBalance = currentBalance + amount;

        // Update user balance
        await db
          .update(users)
          .set({
            availablePoints: newBalance.toString(),
            totalPoints: sql`${users.totalPoints} + ${amount}`,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Create transaction record
        await storage.createTransaction({
          userId,
          type: 'deposit',
          amount: amount.toString(),
          description: `Wallet deposit via Paystack`,
          status: 'completed',
          referenceId: reference,
          metadata: response.data
        });

        // Create in-app notification
        await storage.createNotification({
          userId,
          type: 'deposit_success',
          title: 'Deposit Successful!',
          message: `₦${amount.toLocaleString()} has been added to your wallet. Your funds are ready for betting!`,
          metadata: { amount, reference, type: 'deposit' }
        });

        // Send WebSocket notification to user
        const notification = {
          type: 'deposit_success',
          data: {
            userId,
            amount,
            message: `₦${amount.toLocaleString()} deposited successfully! Your funds are ready for betting.`,
            timestamp: new Date().toISOString()
          }
        };

        // Broadcast to user's WebSocket connection
        wss.clients.forEach((client: WebSocketClient) => {
          if (client.readyState === WebSocket.OPEN && client.userId === userId) {
            client.send(JSON.stringify(notification));
          }
        });

        res.json({ 
          message: "Payment verified and balance updated",
          amount,
          newBalance: newBalance.toString()
        });
      } else {
        res.status(400).json({ message: "Payment verification failed" });
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ message: "Failed to verify payment" });
    }
  });

  app.post('/api/wallet/withdraw', supabaseIsAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id || req.user?.claims?.sub;
      const { amount, accountNumber, bankCode, accountName } = req.body;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      if (!amount || amount < 500) {
        return res.status(400).json({ message: "Minimum withdrawal amount is ₦500" });
      }

      const user = await storage.getUser(userId);
      const balance = parseFloat(user?.availablePoints || '0');

      if (amount > balance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct amount from user's balance
      await db
        .update(users)
        .set({
          availablePoints: sql`${users.availablePoints} - ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Create transaction record
      await storage.createTransaction({
        userId,
        type: 'withdraw',
        amount: amount.toString(),
        description: `Withdrawal request`,
        status: 'pending',
        metadata: { accountNumber, bankCode, accountName }
      });

      // Send WebSocket notification to user
      const notification = {
        type: 'withdrawal_success',
        data: {
          userId,
          amount,
          message: `₦${amount.toLocaleString()} withdrawal request submitted. Processing may take 1-3 business days.`,
          timestamp: new Date().toISOString()
        }
      };

      // Broadcast to user's WebSocket connection
      wss.clients.forEach((client: WebSocketClient) => {
        if (client.readyState === WebSocket.OPEN && client.userId === userId) {
          client.send(JSON.stringify(notification));
        }
      });

      res.json({ 
        message: "Withdrawal request submitted successfully",
        amount,
        newBalance: (parseFloat(user?.availablePoints || '0') - amount).toString()
      });
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  });

  return httpServer;
}