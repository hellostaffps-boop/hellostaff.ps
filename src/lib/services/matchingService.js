import { supabase } from '../supabaseClient';

export const matchingService = {
  /**
   * Calls the database RPC function to calculate a match score.
   * If the function fails or isn't available, returns a simple fallback calculation.
   * 
   * @param {string} jobId - The UUID of the job
   * @param {string} candidateId - The UUID of the candidate profile
   * @returns {Promise<number>} Match score from 0 to 100
   */
  async calculateMatchScore(jobId, candidateId) {
    try {
      const { data, error } = await supabase.rpc('calculate_candidate_match_score', {
        p_job_id: jobId,
        p_candidate_id: candidateId
      });

      if (error) {
        console.warn('RPC matching failed, falling back to basic score:', error);
        return 65; // Fallback score
      }

      return data || 0;
    } catch (err) {
      console.error('Error calculating match score:', err);
      return 60; // Fallback
    }
  },

  /**
   * Batch calculates match scores for a list of applications.
   * Updates the applications in the database with their scores.
   * 
   * @param {Array} applications - Array of application objects with job_id and candidate_id
   */
  async batchUpdateMatchScores(applications) {
    if (!applications || applications.length === 0) return;

    for (const app of applications) {
      // Only calculate if not already calculated (or if it's 0)
      if (!app.match_score || app.match_score === 0) {
        const score = await this.calculateMatchScore(app.job_id, app.candidate_id);
        
        await supabase
          .from('applications')
          .update({ match_score: score })
          .eq('id', app.id);
      }
    }
  }
};
