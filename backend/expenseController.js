const { supabase, getPrimaryBusiness } = require('./supabase');

// GET /api/expenses
async function getExpenses(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('business_id', business.id)
      .order('due_date', { ascending: true });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// POST /api/expenses
async function createExpense(req, res) {
  try {
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { category, description, amount, due_date, recurring, status } = req.body;

    if (!category || !amount || !due_date) {
      return res
        .status(400)
        .json({ success: false, error: 'category, amount, and due_date are required' });
    }

    const { data, error } = await supabase
      .from('expenses')
      .insert({
        business_id: business.id,
        category,
        description: description || null,
        amount,
        due_date,
        recurring: recurring ?? false,
        status: status || 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// PUT /api/expenses/:id
async function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { category, description, amount, due_date, recurring, status } = req.body;

    const { data, error } = await supabase
      .from('expenses')
      .update({
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(amount !== undefined && { amount }),
        ...(due_date !== undefined && { due_date }),
        ...(recurring !== undefined && { recurring }),
        ...(status !== undefined && { status }),
      })
      .eq('id', id)
      .eq('business_id', business.id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// DELETE /api/expenses/:id
async function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const business = req.business || await getPrimaryBusiness();
    if (!business) {
      return res.status(404).json({ success: false, error: 'No business found.' });
    }

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)
      .eq('business_id', business.id);

    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
};
