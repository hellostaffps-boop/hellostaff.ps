/**
 * privilegedActions.js — Stubs for admin-only privileged actions.
 * These require backend functions to execute safely.
 * Firebase Cloud Functions dependency has been removed.
 */

const privilegedError = (actionName) => {
  const err = new Error(
    `PRIVILEGED_ACTION_REQUIRED: "${actionName}" cannot be executed from the client. ` +
    `Requires a privileged backend function. Contact your backend engineer.`
  );
  err.code = "PRIVILEGED_ACTION_REQUIRED";
  err.action = actionName;
  return err;
};

const stub = (name) => async () => { throw privilegedError(name); };

export const promoteUserRole = stub("promoteUserRole");
export const suspendUser = stub("suspendUser");
export const reactivateUser = stub("reactivateUser");
export const verifyOrganization = stub("verifyOrganization");
export const assignEmployerManager = stub("assignEmployerManager");
export const removeOrganizationMember = stub("removeOrganizationMember");
export const transferOrganizationOwnership = stub("transferOrganizationOwnership");
export const forceCloseJob = stub("forceCloseJob");
export const resolveAdminReport = stub("resolveAdminReport");
export const setGlobalSetting = stub("setGlobalSetting");
export const verifyCandidate = stub("verifyCandidate");
export const privilegedActionPlaceholder = async (actionName) => { throw privilegedError(actionName); };

export const isPrivilegedActionError = (err) =>
  err?.code === "PRIVILEGED_ACTION_REQUIRED" ||
  err?.code === "BACKEND_NOT_DEPLOYED" ||
  err?.code === "PERMISSION_DENIED";