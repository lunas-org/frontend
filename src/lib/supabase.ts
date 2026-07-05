// Supabase integration — off-chain Merchant/Product/Order metadata + status cache.
// Payment truth stays on-chain (OrderPaid event); this is a cache + human-readable fields.
// See CLAUDE.md §8 for the data model.
//
// TODO: createClient(SUPABASE_URL, SUPABASE_ANON_KEY) from @supabase/supabase-js.
// TODO: define Merchant / Product / Order table access matching CLAUDE.md §8's shape.
