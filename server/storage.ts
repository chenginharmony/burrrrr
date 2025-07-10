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
      query = query.where(sql`${events.title} ILIKE ${`%${searchQuery}%`}`);
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
    let query = db
      .select()
      .from(challenges)
      .orderBy(desc(challenges.createdAt));

    if (userId) {
      query = query.where(
        or(
          eq(challenges.challengerId, userId),
          eq(challenges.challengedId, userId)
        )
      );
    }

    return await query;
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
    if (user) {
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
      return user.loginStreak;
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
}

export const storage = new DatabaseStorage();
