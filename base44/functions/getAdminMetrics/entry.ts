import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_token } = body;
    const adminPassword = Deno.env.get('ADMIN_PANEL_PASSWORD');

    if (!session_token || !adminPassword || session_token !== btoa(adminPassword)) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);

    const [users, orgs, jobs, apps] = await Promise.all([
      base44.asServiceRole.entities.User.list(null, 5000),
      base44.asServiceRole.entities.Organization.list(null, 2000),
      base44.asServiceRole.entities.Job.list(null, 5000),
      base44.asServiceRole.entities.Application.list(null, 5000),
    ]);

    return Response.json({
      totalUsers: users.length,
      totalCandidates: users.filter(u => u.role === 'candidate').length,
      totalEmployers: users.filter(u => ['employer_owner', 'employer_manager'].includes(u.role)).length,
      totalAdmins: users.filter(u => u.role === 'platform_admin').length,
      totalOrganizations: orgs.length,
      activeOrganizations: orgs.filter(o => o.status === 'active').length,
      pendingOrganizations: orgs.filter(o => o.status === 'pending').length,
      suspendedOrganizations: orgs.filter(o => o.status === 'suspended').length,
      verifiedOrganizations: orgs.filter(o => o.verified).length,
      totalJobs: jobs.length,
      publishedJobs: jobs.filter(j => j.status === 'published').length,
      draftJobs: jobs.filter(j => j.status === 'draft').length,
      closedJobs: jobs.filter(j => ['closed', 'filled'].includes(j.status)).length,
      totalApplications: apps.length,
      pendingApplications: apps.filter(a => a.status === 'pending').length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});