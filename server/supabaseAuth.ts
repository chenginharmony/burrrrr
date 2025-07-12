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
      console.error('Supabase auth error:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = { 
      id: user.id,
      claims: { sub: user.id },
      email: user.email,
      ...user 
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};