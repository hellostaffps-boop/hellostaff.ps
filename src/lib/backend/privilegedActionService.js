/**
 * privilegedActionService.js — Firebase Cloud Functions removed.
 * All privileged actions now return a "backend not deployed" result.
 * Replace with base44 backend functions when needed.
 */

const notDeployed = (action) => ({
  success: false,
  errorCode: "BACKEND_NOT_DEPLOYED",
  message: `Action "${action}" requires a backend function. Contact your administrator.`,
});

export const requestPromoteUserRole = async () => notDeployed("promoteUserRole");
export const requestSuspendUser = async () => notDeployed("suspendUser");
export const requestReactivateUser = async () => notDeployed("reactivateUser");
export const requestVerifyOrganization = async () => notDeployed("verifyOrganization");
export const requestAssignEmployerManager = async () => notDeployed("assignEmployerManager");
export const requestRevokeEmployerManager = async () => notDeployed("revokeEmployerManager");
export const requestForceCloseJob = async () => notDeployed("forceCloseJob");
export const requestModerateAdminReport = async () => notDeployed("moderateAdminReport");
export const requestVerifyCandidate = async () => notDeployed("verifyCandidate");