const { supabase } = require('./supabase');

// Cached demo business reference
let cachedDemoBusiness = null;

async function getDemoBusiness() {
  if (cachedDemoBusiness) return cachedDemoBusiness;
  
  // Find Sharma Engineering or oldest business row
  const { data: sharma } = await supabase
    .from('businesses')
    .select('*')
    .ilike('name', '%Sharma%')
    .maybeSingle();

  if (sharma) {
    cachedDemoBusiness = sharma;
    return sharma;
  }

  const { data: oldest } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  cachedDemoBusiness = oldest;
  return oldest;
}

// Injects req.business, req.user, req.isDemo into every request
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const isDemoHeader = req.headers['x-demo-mode'] === 'true' || req.query.demo === 'true';

    // 1. If explicit demo mode is requested, resolve demo workspace immediately
    if (isDemoHeader) {
      const demoBiz = await getDemoBusiness();
      req.business = demoBiz;
      req.isDemo = true;
      req.user = null;
      return next();
    }

    // 2. Authenticated User Token provided
    if (token) {
      // 2a. Check if token is a direct business ID (UUID)
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      if (isUuid) {
        const { data: directBiz } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', token)
          .maybeSingle();

        if (directBiz) {
          req.business = directBiz;
          req.isDemo = false;
          req.user = {
            id: directBiz.id,
            email: directBiz.email,
            name: directBiz.name,
          };
          return next();
        }
      }

      // 2b. Check if token is a Supabase JWT
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser(token);

        if (!authError && authData?.user) {
          const user = authData.user;
          req.user = user;

          const { data: userBiz } = await supabase
            .from('businesses')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();

          if (userBiz) {
            req.business = userBiz;
            req.isDemo = false;
            return next();
          }

          // If no business row exists yet for this user, create an isolated workspace
          const businessName = user.user_metadata?.business_name ||
            (user.user_metadata?.full_name ? `${user.user_metadata.full_name}'s Enterprise` : 'My Enterprise');

          const { data: newBiz, error: createBizErr } = await supabase
            .from('businesses')
            .insert({
              name: businessName,
              email: user.email,
              industry: 'General Enterprise',
              current_cash: 0,
              minimum_cash_threshold: 0,
            })
            .select()
            .single();

          if (!createBizErr && newBiz) {
            req.business = newBiz;
            req.isDemo = false;
            return next();
          }
        }
      } catch (jwtErr) {
        console.warn('JWT verification warning:', jwtErr.message);
      }
    }

    // 3. Fallback to Demo Business (Sharma Engineering)
    const demoBiz = await getDemoBusiness();
    req.business = demoBiz;
    req.isDemo = true;
    req.user = null;
    return next();
  } catch (err) {
    console.error('authMiddleware error:', err);
    const demoBiz = await getDemoBusiness();
    req.business = demoBiz;
    req.isDemo = true;
    req.user = null;
    return next();
  }
}

module.exports = {
  authMiddleware,
  getDemoBusiness,
};
