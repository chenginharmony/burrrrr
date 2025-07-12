import {
  users,
  events,
  challenges,
  eventParticipants,
  eventMessages,
  challengeMessages,
  notifications,
  transactions,
  dailyLogins,
  achievements,
  userAchievements,
  escrow,
  friends,
  eventPools,
  eventMatches,
  type User,
  type UpsertUser,
  type Event,
  type Challenge,
  type EventParticipant,
  type EventMessage,
  type ChallengeMessage,
  type Notification,
  type Transaction,
  type DailyLogin,
  type Achievement,
  type UserAchievement,
  type InsertEvent,
  type InsertChallenge,
  type InsertEventParticipant,
  type InsertEventMessage,
  type InsertChallengeMessage,
  type InsertNotification,
  type InsertTransaction,
  type InsertDailyLogin,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, gte, lte, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Event operations
  getEvents(searchQuery?: string): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  joinEvent(eventId: string, userId: string, prediction: boolean, wagerAmount?: number): Promise<void>;
  getEventParticipants(eventId: string): Promise<EventParticipant[]>;
  
  // Event messages
  getEventMessages(eventId: string): Promise<EventMessage[]>;
  createEventMessage(message: InsertEventMessage): Promise<EventMessage>;
  
  // Challenge operations
  getChallenges(userId?: string): Promise<Challenge[]>;
  getChallenge(id: string): Promise<Challenge | undefined>;
  createChallenge(challenge: InsertChallenge): Promise<Challenge>;
  updateChallengeStatus(id: string, status: string): Promise<void>;
  acceptChallenge(id: string, challengedId: string): Promise<void>;
  
  // Challenge messages
  getChallengeMessages(challengeId: string): Promise<ChallengeMessage[]>;
  createChallengeMessage(message: InsertChallengeMessage): Promise<ChallengeMessage>;
  
  // Points and achievements
  updateUserPoints(userId: string, pointsToAdd: number, xpToAdd: number): Promise<void>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  unlockAchievement(userId: string, achievementId: string): Promise<void>;
  
  // Daily login
  recordDailyLogin(userId: string): Promise<DailyLogin>;
  getUserLoginStreak(userId: string): Promise<number>;
  
  // Notifications
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: string): Promise<void>;
  
  // Transactions
  getUserTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Friends
  getUserFriends(userId: string): Promise<User[]>;
  sendFriendRequest(userId: string, friendId: string): Promise<void>;
  acceptFriendRequest(userId: string, friendId: string): Promise<void>;
  
  // Leaderboard
  getLeaderboard(limit?: number): Promise<User[]>;

  // User profile operations
  getUserProfile(userId: string): Promise<any>;
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<void>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getUserStats(userId: string): Promise<any>;

  // Referral operations
  generateReferralCode(userId: string): Promise<string>;
  getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalRewards: number;
    referralUsers: User[];
  }>;
  applyReferralCode(referralCode: string, userId: string): Promise<boolean>;
  createReferralReward(referrerId: string, referredId: string, amount: number, type: string): Promise<void>;

  // Recommendation operations
  getRecommendedEvents(userId: string, limit?: number): Promise<Event[]>;
  trackUserInteraction(userId: string, eventId: string, interactionType: string, metadata?: any): Promise<void>;

  // Event matching operations
  findEventMatch(eventId: string, userId: string, prediction: boolean, amount: number): Promise<string | null>;
  createEventMatch(eventId: string, user1Id: string, user2Id: string, user1Prediction: boolean, user2Prediction: boolean, user1Amount: number, user2Amount: number): Promise<void>;
  completeEventMatch(matchId: string, winnerId: string, payoutAmount: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Event operations
  async getEvents(searchQuery?: string): Promise<Event[]> {
    let query = db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        category: events.category,
        bannerUrl: events.bannerUrl,
        startTime: events.startTime,
        endTime: events.endTime,
        wagerAmount: events.wagerAmount,
        maxParticipants: events.maxParticipants,
        isPrivate: events.isPrivate,
        rules: events.rules,
        status: events.status,
        type: events.type,
        creatorId: events.creatorId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .orderBy(desc(events.createdAt));

    if (searchQuery) {
      return await query.where(sql`${events.title} ILIKE ${`%${searchQuery}%`}`);
    }

    return await query;
  }

  async getEvent(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    
    // Create initial event pool
    await db.insert(eventPools).values({
      eventId: newEvent.id,
      totalAmount: "0",
      yesAmount: "0",
      noAmount: "0",
    });
    
    return newEvent;
  }

  async joinEvent(eventId: string, userId: string, prediction: boolean, wagerAmount: number = 0): Promise<void> {
    await db.insert(eventParticipants).values({
      eventId,
      userId,
      prediction,
      wagerAmount: wagerAmount.toString(),
    });

    // Update event pool
    if (wagerAmount > 0) {
      const poolUpdate = prediction ? 
        { yesAmount: sql`${eventPools.yesAmount} + ${wagerAmount}` } :
        { noAmount: sql`${eventPools.noAmount} + ${wagerAmount}` };
      
      await db
        .update(eventPools)
        .set({
          ...poolUpdate,
          totalAmount: sql`${eventPools.totalAmount} + ${wagerAmount}`,
        })
        .where(eq(eventPools.eventId, eventId));
    }
  }

  async getEventParticipants(eventId: string): Promise<EventParticipant[]> {
    return await db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, eventId));
  }

  // Event messages
  async getEventMessages(eventId: string): Promise<EventMessage[]> {
    return await db
      .select()
      .from(eventMessages)
      .where(eq(eventMessages.eventId, eventId))
      .orderBy(desc(eventMessages.createdAt));
  }

  async createEventMessage(message: InsertEventMessage): Promise<EventMessage> {
    const [newMessage] = await db.insert(eventMessages).values(message).returning();
    return newMessage;
  }

  // Challenge operations
  async getChallenges(userId?: string): Promise<Challenge[]> {
    if (userId) {
      return await db
        .select()
        .from(challenges)
        .where(
          or(
            eq(challenges.challengerId, userId),
            eq(challenges.challengedId, userId)
          )
        )
        .orderBy(desc(challenges.createdAt));
    } else {
      return await db
        .select()
        .from(challenges)
        .orderBy(desc(challenges.createdAt));
    }
  }

  async getChallenge(id: string): Promise<Challenge | undefined> {
    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
    return challenge;
  }

  async createChallenge(challenge: InsertChallenge): Promise<Challenge> {
    const [newChallenge] = await db.insert(challenges).values(challenge).returning();
    return newChallenge;
  }

  async updateChallengeStatus(id: string, status: string): Promise<void> {
    await db
      .update(challenges)
      .set({ status, updatedAt: new Date() })
      .where(eq(challenges.id, id));
  }

  async acceptChallenge(id: string, challengedId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update challenge status
      await tx
        .update(challenges)
        .set({ status: "active", updatedAt: new Date() })
        .where(eq(challenges.id, id));

      // Create escrow record
      const [challenge] = await tx
        .select()
        .from(challenges)
        .where(eq(challenges.id, id));

      if (challenge) {
        await tx.insert(escrow).values({
          challengeId: id,
          amount: challenge.wagerAmount,
          status: "locked",
        });
      }
    });
  }

  // Challenge messages
  async getChallengeMessages(challengeId: string): Promise<ChallengeMessage[]> {
    return await db
      .select()
      .from(challengeMessages)
      .where(eq(challengeMessages.challengeId, challengeId))
      .orderBy(desc(challengeMessages.createdAt));
  }

  async createChallengeMessage(message: InsertChallengeMessage): Promise<ChallengeMessage> {
    const [newMessage] = await db.insert(challengeMessages).values(message).returning();
    return newMessage;
  }

  // Points and achievements
  async updateUserPoints(userId: string, pointsToAdd: number, xpToAdd: number): Promise<void> {
    await db
      .update(users)
      .set({
        totalPoints: sql`${users.totalPoints} + ${pointsToAdd}`,
        availablePoints: sql`${users.availablePoints} + ${pointsToAdd}`,
        xp: sql`${users.xp} + ${xpToAdd}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Check for level up
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (user && user.xp !== null && user.level !== null) {
      const newLevel = Math.floor(user.xp / 100) + 1;
      if (newLevel > user.level) {
        await db
          .update(users)
          .set({ level: newLevel, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }
    }
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db
      .select()
      .from(userAchievements)
      .where(eq(userAchievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: string): Promise<void> {
    await db.insert(userAchievements).values({
      userId,
      achievementId,
    });
  }

  // Daily login
  async recordDailyLogin(userId: string): Promise<DailyLogin> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user already logged in today
    const [existingLogin] = await db
      .select()
      .from(dailyLogins)
      .where(
        and(
          eq(dailyLogins.userId, userId),
          gte(dailyLogins.loginDate, today)
        )
      );

    if (existingLogin) {
      return existingLogin;
    }

    // Get current streak
    const currentStreak = await this.getUserLoginStreak(userId);
    const newStreak = currentStreak + 1;

    // Calculate rewards
    const basePoints = 50;
    const streakBonus = Math.min(newStreak * 10, 200);
    const pointsEarned = basePoints + streakBonus;
    const xpEarned = 25 + Math.min(newStreak * 5, 100);

    // Record login
    const [newLogin] = await db.insert(dailyLogins).values({
      userId,
      loginDate: new Date(),
      streakCount: newStreak,
      pointsEarned: pointsEarned.toString(),
      xpEarned,
    }).returning();

    // Update user points and streak
    await db
      .update(users)
      .set({
        loginStreak: newStreak,
        lastLoginDate: new Date(),
        totalPoints: sql`${users.totalPoints} + ${pointsEarned}`,
        availablePoints: sql`${users.availablePoints} + ${pointsEarned}`,
        xp: sql`${users.xp} + ${xpEarned}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return newLogin;
  }

  async getUserLoginStreak(userId: string): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!user || !user.lastLoginDate) {
      return 0;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const lastLogin = new Date(user.lastLoginDate);
    lastLogin.setHours(0, 0, 0, 0);

    // Check if last login was yesterday (streak continues) or today (current streak)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (lastLogin.getTime() >= yesterday.getTime()) {
      return user.loginStreak || 0;
    } else {
      // Reset streak if more than 1 day gap
      await db
        .update(users)
        .set({ loginStreak: 0, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return 0;
    }
  }

  // Notifications
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  // Transactions
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  // Friends
  async getUserFriends(userId: string): Promise<User[]> {
    const friendIds = await db
      .select({ friendId: friends.friendId })
      .from(friends)
      .where(
        and(
          eq(friends.userId, userId),
          eq(friends.status, "accepted")
        )
      );

    if (friendIds.length === 0) {
      return [];
    }

    return await db
      .select()
      .from(users)
      .where(
        sql`${users.id} IN ${friendIds.map(f => f.friendId)}`
      );
  }

  async sendFriendRequest(userId: string, friendId: string): Promise<void> {
    await db.insert(friends).values({
      userId,
      friendId,
      status: "pending",
    });
  }

  async acceptFriendRequest(userId: string, friendId: string): Promise<void> {
    await db.transaction(async (tx) => {
      // Update the original request
      await tx
        .update(friends)
        .set({ status: "accepted", updatedAt: new Date() })
        .where(
          and(
            eq(friends.userId, friendId),
            eq(friends.friendId, userId)
          )
        );

      // Create reciprocal friendship
      await tx.insert(friends).values({
        userId,
        friendId,
        status: "accepted",
      });
    });
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.xp))
      .limit(limit);
  }

  // User profile operations
  async getUserProfile(userId: string): Promise<any> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return null;

    const stats = await this.getUserStats(userId);
    
    return {
      ...user,
      stats,
      isFollowing: false, // Will be set by API route based on current user
    };
  }

  async followUser(followerId: string, followingId: string): Promise<void> {
    await db.insert(friends).values({
      userId: followerId,
      friendId: followingId,
      status: "accepted", // Using friends table for following functionality
    });
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await db
      .delete(friends)
      .where(
        and(
          eq(friends.userId, followerId),
          eq(friends.friendId, followingId)
        )
      );
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [friendship] = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.userId, followerId),
          eq(friends.friendId, followingId)
        )
      );
    return !!friendship;
  }

  async getUserStats(userId: string): Promise<any> {
    // Get events won
    const eventsWon = await db
      .select({ count: count() })
      .from(eventParticipants)
      .where(eq(eventParticipants.userId, userId));
    
    // Get total events participated
    const totalEvents = await db
      .select({ count: count() })
      .from(eventParticipants)
      .where(eq(eventParticipants.userId, userId));
    
    // Get followers count
    const followersCount = await db
      .select({ count: count() })
      .from(friends)
      .where(eq(friends.friendId, userId));
    
    // Get following count
    const followingCount = await db
      .select({ count: count() })
      .from(friends)
      .where(eq(friends.userId, userId));
    
    // Get total earnings from transactions
    const earnings = await db
      .select({ 
        total: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'earn' THEN ${transactions.amount} ELSE 0 END), 0)::int`
      })
      .from(transactions)
      .where(eq(transactions.userId, userId));

    return {
      eventsWon: eventsWon[0]?.count || 0,
      totalEvents: totalEvents[0]?.count || 0,
      followersCount: followersCount[0]?.count || 0,
      followingCount: followingCount[0]?.count || 0,
      totalEarnings: earnings[0]?.total || 0,
      winRate: totalEvents[0]?.count > 0 ? ((eventsWon[0]?.count || 0) / totalEvents[0]?.count) * 100 : 0,
    };
  }

  // Referral operations
  async generateReferralCode(userId: string): Promise<string> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error('User not found');
    }

    let referralCode = user.referralCode;
    
    if (!referralCode) {
      // Generate a unique referral code
      referralCode = `${user.username || user.id}${Date.now().toString().slice(-4)}`;
      
      // Update user with referral code
      await db
        .update(users)
        .set({ referralCode, updatedAt: new Date() })
        .where(eq(users.id, userId));
    }

    return referralCode;
  }

  async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalRewards: number;
    referralUsers: User[];
  }> {
    // For now, return mock data until we have the referral tables
    return {
      totalReferrals: 0,
      pendingReferrals: 0,
      completedReferrals: 0,
      totalRewards: 0,
      referralUsers: []
    };
  }

  async applyReferralCode(referralCode: string, userId: string): Promise<boolean> {
    // Find the referrer by referral code
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.referralCode, referralCode));

    if (!referrer || referrer.id === userId) {
      return false;
    }

    // For now, just return true - we'll implement the full logic when tables are ready
    return true;
  }

  async createReferralReward(referrerId: string, referredId: string, amount: number, type: string): Promise<void> {
    // Create a transaction record for the reward
    await this.createTransaction({
      userId: referrerId,
      type: 'referral_reward',
      amount: amount.toString(),
      description: `Referral reward for inviting user`,
      status: 'completed',
      referenceId: referredId,
      metadata: { type }
    });

    // Update referrer's points
    await this.updateUserPoints(referrerId, amount, amount * 2);
  }

  // Recommendation operations
  async getRecommendedEvents(userId: string, limit: number = 10): Promise<Event[]> {
    const { recommendationEngine } = await import('./recommendationEngine');
    const recommendedIds = await recommendationEngine.getRecommendations(userId, limit);
    
    if (recommendedIds.length === 0) {
      return [];
    }
    
    return await db.select()
      .from(events)
      .where(inArray(events.id, recommendedIds))
      .orderBy(desc(events.createdAt));
  }

  async trackUserInteraction(userId: string, eventId: string, interactionType: string, metadata?: any): Promise<void> {
    const { recommendationEngine } = await import('./recommendationEngine');
    await recommendationEngine.updateUserPreferences(userId, eventId, interactionType);
  }

  // Event matching operations
  async findEventMatch(eventId: string, userId: string, prediction: boolean, amount: number): Promise<string | null> {
    // Look for pending participants with opposite prediction and similar wager amount
    const oppositeParticipants = await db.select({
      id: eventParticipants.id,
      userId: eventParticipants.userId,
      wagerAmount: eventParticipants.wagerAmount,
      prediction: eventParticipants.prediction,
    })
    .from(eventParticipants)
    .where(and(
      eq(eventParticipants.eventId, eventId),
      eq(eventParticipants.prediction, !prediction),
      // Look for similar wager amounts (within 20% range)
      gte(eventParticipants.wagerAmount, (amount * 0.8).toString()),
      lte(eventParticipants.wagerAmount, (amount * 1.2).toString())
    ))
    .orderBy(desc(eventParticipants.joinedAt))
    .limit(1);

    if (oppositeParticipants.length > 0) {
      return oppositeParticipants[0].userId;
    }
    
    return null;
  }

  async createEventMatch(eventId: string, user1Id: string, user2Id: string, user1Prediction: boolean, user2Prediction: boolean, user1Amount: number, user2Amount: number): Promise<void> {
    await db.insert(eventMatches).values({
      eventId,
      user1Id,
      user2Id,
      user1Prediction,
      user2Prediction,
      user1Amount: user1Amount.toString(),
      user2Amount: user2Amount.toString(),
      status: 'active',
    });
  }

  async completeEventMatch(matchId: string, winnerId: string, payoutAmount: number): Promise<void> {
    await db.update(eventMatches)
      .set({
        status: 'completed',
        winnerId,
        payoutAmount: payoutAmount.toString(),
        completedAt: new Date(),
      })
      .where(eq(eventMatches.id, matchId));
  }
}

export const storage = new DatabaseStorage();
