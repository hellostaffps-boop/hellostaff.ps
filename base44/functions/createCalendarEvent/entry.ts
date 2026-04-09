import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewData } = await req.json();
    const connectorId = Deno.env.get('GOOGLE_CALENDAR_CONNECTOR_ID');

    if (!connectorId) {
      return Response.json({ error: 'Calendar connector not configured' }, { status: 400 });
    }

    try {
      const accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(connectorId);

      const eventPayload = {
        summary: `Interview: ${interviewData.jobTitle}`,
        description: `Candidate: ${interviewData.candidateName}\nPosition: ${interviewData.jobTitle}\nOrganization: ${interviewData.organizationName}`,
        start: {
          dateTime: new Date(interviewData.dateTime).toISOString(),
          timeZone: 'Asia/Jerusalem',
        },
        end: {
          dateTime: new Date(new Date(interviewData.dateTime).getTime() + 60 * 60 * 1000).toISOString(),
          timeZone: 'Asia/Jerusalem',
        },
        attendees: [
          { email: user.email, responseStatus: 'accepted' },
          { email: interviewData.candidateEmail, responseStatus: 'needsAction' },
        ],
      };

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventPayload),
      });

      if (!response.ok) {
        const error = await response.text();
        return Response.json({ error: `Google Calendar API error: ${error}` }, { status: response.status });
      }

      const eventData = await response.json();

      return Response.json({
        success: true,
        eventId: eventData.id,
        eventLink: eventData.htmlLink,
      });
    } catch (tokenError) {
      // User not connected to Google Calendar
      return Response.json({
        success: false,
        notConnected: true,
        message: 'User not connected to Google Calendar',
      });
    }
  } catch (error) {
    console.error('Calendar event creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});