/**
 * aiService.js
 * 
 * Stub implementation for future AI features.
 * When AI capabilities are added, they can be implemented here
 * using the proper AI APIs (OpenAI, Gemini, etc.).
 */

export const aiService = {
  /**
   * Suggests a job description based on title and requirements.
   * @param {Object} jobDetails - Partial job details
   * @returns {Promise<string>} Generated description
   */
  async generateJobDescription(jobDetails) {
    console.log('AI stub called: generateJobDescription', jobDetails);
    // TODO: Connect to real AI API
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`This is a generated placeholder description for ${jobDetails.title || 'a position'}. AI tools are coming soon.`);
      }, 1000);
    });
  },

  /**
   * Summarizes a candidate's profile into a short pitch.
   * @param {Object} profile - Candidate profile
   * @returns {Promise<string>} Summary
   */
  async summarizeCandidateProfile(profile) {
    console.log('AI stub called: summarizeCandidateProfile', profile);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`${profile.full_name || 'The candidate'} seems like a great fit with solid experience. AI tools are coming soon.`);
      }, 1000);
    });
  },

  /**
   * Suggests custom interview questions based on the job and candidate.
   * @param {Object} job - Job post details
   * @param {Object} candidate - Candidate details
   * @returns {Promise<Array<string>>} List of questions
   */
  async generateInterviewQuestions(job, candidate) {
    console.log('AI stub called: generateInterviewQuestions', { job, candidate });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          "Can you tell me about your previous experience?",
          "How do you handle difficult customers?",
          "Why do you want to work here?"
        ]);
      }, 1000);
    });
  }
};
