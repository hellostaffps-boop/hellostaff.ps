import { supabase } from '../supabaseClient';

export const saasService = {
  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================
  async getOrganizationSubscription(organizationId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    return data;
  },

  async createOrUpdateSubscription(subscriptionData) {
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'organization_id' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // TRIAL SHIFTS
  // ==========================================
  async getTrialShiftsForEmployer(organizationId) {
    const { data, error } = await supabase
      .from('trial_shifts')
      .select('*, candidate:profiles(id, full_name, avatar_url, email), job:jobs(title)')
      .eq('organization_id', organizationId)
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getTrialShiftsForCandidate(candidateId) {
    const { data, error } = await supabase
      .from('trial_shifts')
      .select('*, organization:organizations(name, logo_url, city), job:jobs(title)')
      .eq('candidate_id', candidateId)
      .order('scheduled_date', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createTrialShift(trialData) {
    const { data, error } = await supabase
      .from('trial_shifts')
      .insert(trialData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTrialShiftStatus(id, status) {
    const { data, error } = await supabase
      .from('trial_shifts')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // ==========================================
  // INTERVIEWS
  // ==========================================
  async getInterviewsForEmployer(organizationId) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*, candidate:profiles(id, full_name, avatar_url, email), application:applications(job_title)')
      .eq('organization_id', organizationId)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getInterviewsForCandidate(candidateId) {
    const { data, error } = await supabase
      .from('interviews')
      .select('*, organization:organizations(name, logo_url, city), application:applications(job_title)')
      .eq('candidate_id', candidateId)
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createInterview(interviewData) {
    const { data, error } = await supabase
      .from('interviews')
      .insert(interviewData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateInterviewStatus(id, status) {
    const { data, error } = await supabase
      .from('interviews')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
