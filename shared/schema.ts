import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
  primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  level: integer("level").default(1),
  xp: integer("xp").default(0),
  totalPoints: decimal("total_points", { precision: 10, scale: 2 }).default("0"),
  availablePoints: decimal("available_points", { precision: 10, scale: 2 }).default("0"),
  loginStreak: integer("login_streak").default(0),
  lastLoginDate: timestamp("last_login_date"),
  referralCode: varchar("referral_code", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(),
  bannerUrl: varchar("banner_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  wagerAmount: decimal("wager_amount", { precision: 10, scale: 2 }).default("0"),
  maxParticipants: integer("max_participants").default(100),
  isPrivate: boolean("is_private").default(false),
  rules: text("rules"),
  status: varchar("status", { length: 20 }).default("active"),
  type: varchar("type", { length: 20 }).default("public"),
  creatorId: varchar("creator_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event participants table
export const eventParticipants = pgTable("event_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  userId: varchar("user_id").references(() => users.id),
  prediction: boolean("prediction"),
  wagerAmount: decimal("wager_amount", { precision: 10, scale: 2 }).default("0"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Event pools table
export const eventPools = pgTable("event_pools", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0"),
  yesAmount: decimal("yes_amount", { precision: 10, scale: 2 }).default("0"),
  noAmount: decimal("no_amount", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event messages table
export const eventMessages = pgTable("event_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenges table
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  challengerId: varchar("challenger_id").references(() => users.id),
  challengedId: varchar("challenged_id").references(() => users.id),
  wagerAmount: decimal("wager_amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  category: varchar("category", { length: 50 }),
  dueDate: timestamp("due_date"),
  escrowStatus: varchar("escrow_status", { length: 20 }).default("none"),
  winnerId: varchar("winner_id").references(() => users.id),
  rules: text("rules"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenge messages table
export const challengeMessages = pgTable("challenge_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").references(() => challenges.id),
  userId: varchar("user_id").references(() => users.id),
  message: text("message").notNull(),
  messageType: varchar("message_type", { length: 20 }).default("text"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Escrow table
export const escrow = pgTable("escrow", {
  id: uuid("id").primaryKey().defaultRandom(),
  challengeId: uuid("challenge_id").references(() => challenges.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  releasedAt: timestamp("released_at"),
  releasedTo: varchar("released_to").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Friends table
export const friends = pgTable("friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  friendId: varchar("friend_id").references(() => users.id),
  status: varchar("status", { length: 20 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Achievements table
export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  iconUrl: varchar("icon_url"),
  xpReward: integer("xp_reward").default(0),
  pointsReward: decimal("points_reward", { precision: 10, scale: 2 }).default("0"),
  requirements: jsonb("requirements"),
  createdAt: timestamp("created_at").defaultNow(),
});

// User achievements table
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  achievementId: uuid("achievement_id").references(() => achievements.id),
  unlockedAt: timestamp("unlocked_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  isRead: boolean("is_read").default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).default("completed"),
  referenceId: varchar("reference_id"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Daily login records table
export const dailyLogins = pgTable("daily_logins", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id").references(() => users.id),
  loginDate: timestamp("login_date").notNull(),
  streakCount: integer("streak_count").default(1),
  pointsEarned: decimal("points_earned", { precision: 10, scale: 2 }).default("0"),
  xpEarned: integer("xp_earned").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: varchar("referrer_id").references(() => users.id),
  referredId: varchar("referred_id").references(() => users.id),
  referralCode: varchar("referral_code", { length: 50 }).unique(),
  status: varchar("status", { length: 20 }).default("pending"),
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).default("0"),
  rewardPaid: boolean("reward_paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Referral rewards table
export const referralRewards = pgTable("referral_rewards", {
  id: uuid("id").primaryKey().defaultRandom(),
  referralId: uuid("referral_id").references(() => referrals.id),
  referrerId: varchar("referrer_id").references(() => users.id),
  referredId: varchar("referred_id").references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'referral_bonus', 'signup_bonus'
  paid: boolean("paid").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdEvents: many(events),
  eventParticipants: many(eventParticipants),
  eventMessages: many(eventMessages),
  challengesCreated: many(challenges, { relationName: "challenger" }),
  challengesReceived: many(challenges, { relationName: "challenged" }),
  challengesWon: many(challenges, { relationName: "winner" }),
  challengeMessages: many(challengeMessages),
  friends: many(friends, { relationName: "user" }),
  friendOf: many(friends, { relationName: "friend" }),
  achievements: many(userAchievements),
  notifications: many(notifications),
  transactions: many(transactions),
  dailyLogins: many(dailyLogins),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, { fields: [events.creatorId], references: [users.id] }),
  participants: many(eventParticipants),
  pool: one(eventPools),
  messages: many(eventMessages),
}));

export const challengesRelations = relations(challenges, ({ one, many }) => ({
  challenger: one(users, { fields: [challenges.challengerId], references: [users.id], relationName: "challenger" }),
  challenged: one(users, { fields: [challenges.challengedId], references: [users.id], relationName: "challenged" }),
  winner: one(users, { fields: [challenges.winnerId], references: [users.id], relationName: "winner" }),
  messages: many(challengeMessages),
  escrow: one(escrow),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  wagerAmount: z.coerce.string().optional(),
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertEventMessageSchema = createInsertSchema(eventMessages).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeMessageSchema = createInsertSchema(challengeMessages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertDailyLoginSchema = createInsertSchema(dailyLogins).omit({
  id: true,
  createdAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralRewardSchema = createInsertSchema(referralRewards).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Challenge = typeof challenges.$inferSelect;
export type EventParticipant = typeof eventParticipants.$inferSelect;
export type EventMessage = typeof eventMessages.$inferSelect;
export type ChallengeMessage = typeof challengeMessages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type DailyLogin = typeof dailyLogins.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type ReferralReward = typeof referralRewards.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type InsertEventMessage = z.infer<typeof insertEventMessageSchema>;
export type InsertChallengeMessage = z.infer<typeof insertChallengeMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertDailyLogin = z.infer<typeof insertDailyLoginSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertReferralReward = z.infer<typeof insertReferralRewardSchema>;
