import { db } from './db';
import { 
  events, 
  eventParticipants, 
  userPreferences, 
  userInteractions, 
  users,
  eventPools
} from '../shared/schema';
import { eq, and, desc, inArray, not, gte, lte, isNull, or, sql } from 'drizzle-orm';

interface RecommendationScore {
  eventId: string;
  score: number;
  reasons: string[];
}

interface UserProfile {
  userId: string;
  favoriteCategories: string[];
  preferredWagerRange?: { min: number; max: number };
  riskTolerance: 'low' | 'medium' | 'high';
  activeHours: number[];
  followedCreators: string[];
  blockedCategories: string[];
  recentInteractions: Array<{
    eventId: string;
    category: string;
    wagerAmount: number;
    prediction: boolean;
    timestamp: Date;
  }>;
  bettingPattern: {
    avgWagerAmount: number;
    winRate: number;
    preferredPrediction: boolean | null; // tends to bet YES or NO
    categoriesPlayed: string[];
  };
}

export class RecommendationEngine {
  /**
   * Get personalized event recommendations for a user
   */
  async getRecommendations(userId: string, limit: number = 10): Promise<string[]> {
    try {
      // Get user profile
      const userProfile = await this.buildUserProfile(userId);
      
      // Get available events (not ended, user hasn't joined)
      const availableEvents = await this.getAvailableEvents(userId);
      
      // Score each event
      const scoredEvents = await this.scoreEvents(userProfile, availableEvents);
      
      // Sort by score and return top recommendations
      const recommendations = scoredEvents
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(event => event.eventId);
      
      // Track recommendation interaction
      await this.trackRecommendationShown(userId, recommendations);
      
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback to trending events
      return await this.getFallbackRecommendations(userId, limit);
    }
  }

  /**
   * Build comprehensive user profile for recommendations
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    // Get user preferences
    const [preferences] = await db.select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    // Get recent interactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentInteractions = await db.select({
      eventId: userInteractions.eventId,
      interactionType: userInteractions.interactionType,
      metadata: userInteractions.metadata,
      createdAt: userInteractions.createdAt,
      category: events.category,
    })
    .from(userInteractions)
    .innerJoin(events, eq(userInteractions.eventId, events.id))
    .where(and(
      eq(userInteractions.userId, userId),
      gte(userInteractions.createdAt, thirtyDaysAgo)
    ))
    .orderBy(desc(userInteractions.createdAt))
    .limit(100);

    // Get betting history
    const bettingHistory = await db.select({
      eventId: eventParticipants.eventId,
      prediction: eventParticipants.prediction,
      wagerAmount: eventParticipants.wagerAmount,
      category: events.category,
      joinedAt: eventParticipants.joinedAt,
    })
    .from(eventParticipants)
    .innerJoin(events, eq(eventParticipants.eventId, events.id))
    .where(eq(eventParticipants.userId, userId))
    .orderBy(desc(eventParticipants.joinedAt))
    .limit(50);

    // Calculate betting patterns
    const bettingPattern = this.analyzeBettingPattern(bettingHistory);
    
    // Build recent interactions summary
    const recentBets = bettingHistory.slice(0, 10).map(bet => ({
      eventId: bet.eventId,
      category: bet.category,
      wagerAmount: parseFloat(bet.wagerAmount || '0'),
      prediction: bet.prediction,
      timestamp: bet.joinedAt,
    }));

    return {
      userId,
      favoriteCategories: preferences?.favoriteCategories || [],
      preferredWagerRange: preferences?.preferredWagerRange,
      riskTolerance: (preferences?.riskTolerance as any) || 'medium',
      activeHours: preferences?.activeHours || [],
      followedCreators: preferences?.followedCreators || [],
      blockedCategories: preferences?.blockedCategories || [],
      recentInteractions: recentBets,
      bettingPattern,
    };
  }

  /**
   * Analyze user's betting patterns
   */
  private analyzeBettingPattern(bettingHistory: any[]) {
    if (bettingHistory.length === 0) {
      return {
        avgWagerAmount: 0,
        winRate: 0,
        preferredPrediction: null,
        categoriesPlayed: [],
      };
    }

    const amounts = bettingHistory.map(bet => parseFloat(bet.wagerAmount || '0'));
    const avgWagerAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    const yesCount = bettingHistory.filter(bet => bet.prediction === true).length;
    const noCount = bettingHistory.filter(bet => bet.prediction === false).length;
    const totalBets = bettingHistory.length;
    
    let preferredPrediction: boolean | null = null;
    if (yesCount > noCount * 1.5) preferredPrediction = true;
    else if (noCount > yesCount * 1.5) preferredPrediction = false;
    
    const categoriesPlayed = [...new Set(bettingHistory.map(bet => bet.category))];
    
    return {
      avgWagerAmount,
      winRate: 0.5, // TODO: Calculate actual win rate when event resolution is implemented
      preferredPrediction,
      categoriesPlayed,
    };
  }

  /**
   * Get events available for recommendation
   */
  private async getAvailableEvents(userId: string) {
    const now = new Date();
    
    return await db.select({
      id: events.id,
      title: events.title,
      category: events.category,
      wagerAmount: events.wagerAmount,
      startTime: events.startTime,
      endTime: events.endTime,
      creatorId: events.creatorId,
      participantCount: sql<number>`(
        SELECT COUNT(*) FROM ${eventParticipants} 
        WHERE ${eventParticipants.eventId} = ${events.id}
      )`,
      totalPool: sql<number>`(
        SELECT COALESCE(${eventPools.totalAmount}, 0) 
        FROM ${eventPools} 
        WHERE ${eventPools.eventId} = ${events.id}
      )`,
    })
    .from(events)
    .where(and(
      gte(events.endTime, now), // Not ended
      eq(events.status, 'active'), // Active
      not(events.id.in( // User hasn't joined
        db.select({ eventId: eventParticipants.eventId })
          .from(eventParticipants)
          .where(eq(eventParticipants.userId, userId))
      ))
    ));
  }

  /**
   * Score events based on user profile
   */
  private async scoreEvents(userProfile: UserProfile, availableEvents: any[]): Promise<RecommendationScore[]> {
    const scores: RecommendationScore[] = [];
    
    for (const event of availableEvents) {
      let score = 0;
      const reasons: string[] = [];
      
      // Category preference scoring (0-30 points)
      if (userProfile.favoriteCategories.includes(event.category)) {
        score += 30;
        reasons.push('Matches your favorite category');
      } else if (userProfile.bettingPattern.categoriesPlayed.includes(event.category)) {
        score += 20;
        reasons.push('Category you\'ve played before');
      }
      
      // Block categories (eliminate)
      if (userProfile.blockedCategories.includes(event.category)) {
        continue; // Skip this event
      }
      
      // Wager amount preference (0-20 points)
      const eventWager = parseFloat(event.wagerAmount || '0');
      if (userProfile.preferredWagerRange) {
        const { min, max } = userProfile.preferredWagerRange;
        if (eventWager >= min && eventWager <= max) {
          score += 20;
          reasons.push('Matches your preferred bet amount');
        } else if (eventWager < min) {
          score += 10;
          reasons.push('Lower risk option');
        }
      } else {
        // Score based on user's average wager pattern
        const avgWager = userProfile.bettingPattern.avgWagerAmount;
        const ratio = eventWager / (avgWager || 1000);
        if (ratio >= 0.5 && ratio <= 2) {
          score += 15;
          reasons.push('Similar to your usual bet amount');
        }
      }
      
      // Creator following (0-25 points)
      if (userProfile.followedCreators.includes(event.creatorId)) {
        score += 25;
        reasons.push('Created by someone you follow');
      }
      
      // Risk tolerance scoring (0-15 points)
      const poolSize = parseFloat(event.totalPool?.toString() || '0');
      const participants = event.participantCount || 0;
      
      if (userProfile.riskTolerance === 'high' && poolSize > 10000) {
        score += 15;
        reasons.push('High stakes event');
      } else if (userProfile.riskTolerance === 'medium' && poolSize > 1000 && poolSize <= 10000) {
        score += 15;
        reasons.push('Medium risk event');
      } else if (userProfile.riskTolerance === 'low' && poolSize <= 1000) {
        score += 15;
        reasons.push('Low risk event');
      }
      
      // Timing preference (0-10 points)
      const eventHour = new Date(event.startTime).getHours();
      if (userProfile.activeHours.includes(eventHour)) {
        score += 10;
        reasons.push('Starts during your active hours');
      }
      
      // Popularity bonus (0-10 points)
      if (participants > 50) {
        score += 10;
        reasons.push('Popular event');
      } else if (participants > 20) {
        score += 5;
        reasons.push('Active participation');
      }
      
      // Recency bonus (0-5 points)
      const hoursUntilStart = (new Date(event.startTime).getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntilStart <= 24) {
        score += 5;
        reasons.push('Starting soon');
      }
      
      scores.push({
        eventId: event.id,
        score: Math.round(score),
        reasons,
      });
    }
    
    return scores;
  }

  /**
   * Track that recommendations were shown to user
   */
  private async trackRecommendationShown(userId: string, eventIds: string[]) {
    try {
      for (const eventId of eventIds) {
        await db.insert(userInteractions).values({
          userId,
          eventId,
          interactionType: 'recommendation_shown',
          metadata: { timestamp: new Date().toISOString() },
        });
      }
    } catch (error) {
      console.error('Error tracking recommendations:', error);
    }
  }

  /**
   * Fallback recommendations when algorithm fails
   */
  private async getFallbackRecommendations(userId: string, limit: number): Promise<string[]> {
    const now = new Date();
    
    const trendingEvents = await db.select({ id: events.id })
      .from(events)
      .where(and(
        gte(events.endTime, now),
        eq(events.status, 'active'),
        not(events.id.in(
          db.select({ eventId: eventParticipants.eventId })
            .from(eventParticipants)
            .where(eq(eventParticipants.userId, userId))
        ))
      ))
      .orderBy(desc(events.createdAt))
      .limit(limit);
    
    return trendingEvents.map(event => event.id);
  }

  /**
   * Update user preferences based on interactions
   */
  async updateUserPreferences(userId: string, eventId: string, interactionType: string) {
    try {
      // Get event details
      const [event] = await db.select()
        .from(events)
        .where(eq(events.id, eventId))
        .limit(1);
        
      if (!event) return;

      // Track interaction
      await db.insert(userInteractions).values({
        userId,
        eventId,
        interactionType,
        metadata: { 
          category: event.category,
          timestamp: new Date().toISOString()
        },
      });

      // Update preferences if this is a positive interaction
      if (['join', 'bet', 'like'].includes(interactionType)) {
        const [preferences] = await db.select()
          .from(userPreferences)
          .where(eq(userPreferences.userId, userId))
          .limit(1);

        if (preferences) {
          // Add category to favorites if user interacts positively
          const favoriteCategories = preferences.favoriteCategories || [];
          if (!favoriteCategories.includes(event.category)) {
            favoriteCategories.push(event.category);
            
            await db.update(userPreferences)
              .set({
                favoriteCategories,
                updatedAt: new Date(),
              })
              .where(eq(userPreferences.userId, userId));
          }
        } else {
          // Create initial preferences
          await db.insert(userPreferences).values({
            userId,
            favoriteCategories: [event.category],
            riskTolerance: 'medium',
          });
        }
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }
}

export const recommendationEngine = new RecommendationEngine();