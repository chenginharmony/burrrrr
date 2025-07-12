import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const supabaseIsAuthenticated = async (req: any, res: any, next: any) => {
  try {
    // Check for token in Authorization header first
    let token = req.headers.authorization?.replace('Bearer ', '');

    // If not in header, check query params (for WebSocket)
    if (!token && req.query?.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.log('Invalid token:', error?.message);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Ensure user exists in database
    try {
      await storage.upsertUser({
        id: user.id,
        email: user.email || '',
        firstName: user.user_metadata?.firstName || '',
        lastName: user.user_metadata?.lastName || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || '',
        profileImageUrl: user.user_metadata?.avatar_url || null,
      });
    } catch (dbError) {
      console.error('Error upserting user to database:', dbError);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};