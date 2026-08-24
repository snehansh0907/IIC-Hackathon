// This file creates ONE shared Supabase client that every controller/service
// can import and reuse. It reads credentials from environment variables so
// nothing secret is ever hardcoded in the codebase.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // We don't throw here because that would crash the server before it can
  // even print a helpful message. Instead we log a clear warning so a
  // student debugging this for the first time knows exactly what's wrong.
  console.warn(
    '[supabase] Warning: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing from your .env file. ' +
    'Database calls will fail until these are set.'
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * DuesOS doesn't have authentication yet, so for now the whole API works
 * against a single "primary" business — the oldest row in the businesses
 * table. Once login is added later, this can be replaced with "the
 * business belonging to the logged-in user" without touching every
 * controller that calls it.
 */
async function getPrimaryBusiness() {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = { supabase, getPrimaryBusiness };
