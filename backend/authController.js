const { supabase } = require('./supabase');
const { getDemoBusiness } = require('./authMiddleware');

// POST /api/auth/signup
async function signup(req, res) {
  try {
    const { name, email, password, businessName } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanBizName = (businessName && businessName.trim()) ? businessName.trim() : `${cleanName}'s Enterprise`;

    let authUser = null;
    let authSession = null;

    // 1. Attempt Supabase Auth signup
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            business_name: cleanBizName,
          },
        },
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
        authSession = authData.session;
      }
    } catch (e) {
      console.warn('Supabase Auth signup notice:', e.message);
    }

    // 2. Lookup or create private business record in `businesses` table
    const { data: existingBiz } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    let userBusiness = existingBiz;
    if (!userBusiness) {
      const { data: newBiz, error: bizErr } = await supabase
        .from('businesses')
        .insert({
          name: cleanBizName,
          email: cleanEmail,
          industry: 'General Enterprise',
          current_cash: 0,
          minimum_cash_threshold: 0,
        })
        .select()
        .single();

      if (bizErr) throw bizErr;
      userBusiness = newBiz;
    }

    const token = authSession?.access_token || userBusiness.id;

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: authUser?.id || userBusiness.id,
          email: cleanEmail,
          name: cleanName,
        },
        business: userBusiness,
        token,
        session: authSession || { access_token: token },
        message: 'Account and private workspace created successfully.',
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }
    if (!password) {
      return res.status(400).json({ success: false, error: 'Password is required.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    let authUser = null;
    let authSession = null;

    // 1. Attempt Supabase Auth login
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!authError && authData?.user) {
        authUser = authData.user;
        authSession = authData.session;
      }
    } catch (e) {
      console.warn('Supabase Auth signIn notice:', e.message);
    }

    // 2. Lookup the user's business record
    const { data: userBiz } = await supabase
      .from('businesses')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!userBiz && !authUser) {
      return res.status(400).json({ success: false, error: 'Invalid email or password.' });
    }

    let activeBusiness = userBiz;
    if (!activeBusiness && authUser) {
      const bizName = authUser.user_metadata?.business_name ||
        (authUser.user_metadata?.full_name ? `${authUser.user_metadata.full_name}'s Enterprise` : 'My Enterprise');

      const { data: newBiz } = await supabase
        .from('businesses')
        .insert({
          name: bizName,
          email: cleanEmail,
          industry: 'General Enterprise',
          current_cash: 0,
          minimum_cash_threshold: 0,
        })
        .select()
        .single();

      activeBusiness = newBiz;
    }

    const token = authSession?.access_token || activeBusiness.id;

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: authUser?.id || activeBusiness.id,
          email: cleanEmail,
          name: authUser?.user_metadata?.full_name || activeBusiness.name,
        },
        business: activeBusiness,
        token,
        session: authSession || { access_token: token },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: req.user || null,
        business: req.business || null,
        isDemo: Boolean(req.isDemo),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// GET /api/auth/demo
async function getDemoSession(req, res) {
  try {
    const demoBiz = await getDemoBusiness();
    return res.status(200).json({
      success: true,
      data: {
        business: demoBiz,
        isDemo: true,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  signup,
  login,
  getMe,
  getDemoSession,
};
