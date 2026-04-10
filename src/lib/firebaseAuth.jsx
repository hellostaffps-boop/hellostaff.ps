/**
 * firebaseAuth.jsx — COMPAT SHIM. Firebase has been removed.
 * Re-exports from supabaseAuth so any remaining imports don't crash.
 */
export { useAuth as useFirebaseAuth, SupabaseAuthProvider as FirebaseAuthProvider } from "@/lib/supabaseAuth";