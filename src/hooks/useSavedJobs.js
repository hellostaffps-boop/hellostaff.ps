/**
 * useSavedJobs — Phase 5.2
 * Provides savedJobIds (Set) and toggleSave for any component.
 * Only active when a candidate is authenticated.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/supabaseAuth";
import { getSavedJobIds, toggleSaveJob } from "@/lib/savedJobsService";

export function useSavedJobs() {
  const { user: firebaseUser, userProfile } = useAuth();
  const isCandidate = userProfile?.role === "candidate";
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!firebaseUser || !isCandidate) {
      setSavedJobIds(new Set());
      return;
    }
    setLoading(true);
    getSavedJobIds(firebaseUser.uid).then((ids) => {
      setSavedJobIds(ids);
      setLoading(false);
    });
  }, [firebaseUser?.uid, isCandidate]);

  const toggleSave = useCallback(
    async (job) => {
      if (!firebaseUser || !isCandidate) return;
      // Optimistic update
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (next.has(job.id)) next.delete(job.id);
        else next.add(job.id);
        return next;
      });
      const nowSaved = await toggleSaveJob(firebaseUser.uid, job);
      // Sync in case of mismatch
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (nowSaved) next.add(job.id);
        else next.delete(job.id);
        return next;
      });
    },
    [firebaseUser?.uid, isCandidate]
  );

  return { savedJobIds, toggleSave, loading, isCandidate };
}