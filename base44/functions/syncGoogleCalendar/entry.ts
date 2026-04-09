import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectorId = Deno.env.get('GOOGLE_CALENDAR_CONNECTOR_ID');
    if (!connectorId) {
      return Response.json({ error: 'Calendar connector not configured' }, { status: 400 });
    }

    try {
      const accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(connectorId);

      // Load sync state
      const syncStates = await base44.entities.SyncState.filter({
        user_email: user.email,
      });
      const syncRecord = syncStates.length > 0 ? syncStates[0] : null;

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=updated';

      if (syncRecord?.sync_token) {
        url += `&syncToken=${encodeURIComponent(syncRecord.sync_token)}`;
      } else {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        url += `&timeMin=${encodeURIComponent(sevenDaysAgo)}`;
      }

      let response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.status === 410) {
        // Sync token expired, do fresh sync
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&timeMin=${encodeURIComponent(sevenDaysAgo)}&orderBy=updated`;
        response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
      }

      if (!response.ok) {
        return Response.json({ error: 'Google Calendar API error' }, { status: response.status });
      }

      const allItems = [];
      let pageData = await response.json();
      let newSyncToken = null;

      while (true) {
        allItems.push(...(pageData.items || []));
        if (pageData.nextSyncToken) newSyncToken = pageData.nextSyncToken;
        if (!pageData.nextPageToken) break;

        const nextResponse = await fetch(
          url + `&pageToken=${encodeURIComponent(pageData.nextPageToken)}`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );
        if (!nextResponse.ok) break;
        pageData = await nextResponse.json();
      }

      // Filter events containing "Interview"
      const interviewEvents = allItems.filter(e => e.summary?.includes('Interview'));

      if (newSyncToken) {
        if (syncRecord) {
          await base44.entities.SyncState.update(syncRecord.id, {
            sync_token: newSyncToken,
            calendar_id: 'primary',
          });
        } else {
          await base44.entities.SyncState.create({
            sync_token: newSyncToken,
            user_email: user.email,
            calendar_id: 'primary',
          });
        }
      }

      return Response.json({
        success: true,
        events: interviewEvents.map(e => ({
          id: e.id,
          title: e.summary,
          start: e.start?.dateTime || e.start?.date,
          end: e.end?.dateTime || e.end?.date,
          description: e.description,
          link: e.htmlLink,
        })),
        count: interviewEvents.length,
      });
    } catch (tokenError) {
      return Response.json({
        success: false,
        notConnected: true,
        message: 'Not connected to Google Calendar',
      });
    }
  } catch (error) {
    console.error('Sync error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});