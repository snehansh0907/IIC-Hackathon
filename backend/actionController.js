const { supabase, getPrimaryBusiness } = require('./supabase');

// GET /api/actions
async function getActions(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found' });
    }

    const { data: actions, error } = await supabase
      .from('actions')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data: actions || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/actions/:id/complete
async function completeAction(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found' });
    }

    // Check if id is a UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      const { data, error } = await supabase
        .from('actions')
        .update({ status: 'completed' })
        .eq('id', id)
        .eq('business_id', business.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return res.json({ success: true, data: data || { id, status: 'completed' } });
    } else {
      // If client sent a synthetic action id (e.g. ACT-1234), log it as completed
      return res.json({ success: true, data: { id, status: 'completed' } });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getActions,
  completeAction,
};
