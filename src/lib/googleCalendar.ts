import { google, calendar_v3 } from 'googleapis';
import path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  location?: string;
  htmlLink: string;
  colorId?: string;
}

export interface SyncResult {
  events: CalendarEvent[];
  nextSyncToken: string | null;
  isIncremental: boolean;
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;

  private syncToken: string | null = null;
  private lastSync: Date | null = null;

  private readonly CALENDAR_ID = 'owendigitals@gmail.com';
  private readonly SYNC_TOKEN_KEY = 'gcal_sync_token';

  private constructor() {}

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  private async getCalendarClient(): Promise<calendar_v3.Calendar> {
    // Priority 1: Use Environment Variable (Production/Vercel/Local)
    if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        const auth = new google.auth.GoogleAuth({
          credentials,
          scopes: ['https://www.googleapis.com/auth/calendar'],
        });
        return google.calendar({ version: 'v3', auth });
      } catch (e) {
        console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON', e);
        throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_JSON format.');
      }
    }

    // Priority 2: Fallback to local file in project root (Cross-platform)
    try {
      const keyFilePath = path.join(process.cwd(), 'service_account.json');
      const auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
      return google.calendar({ version: 'v3', auth });
    } catch (e) {
      console.warn('Could not initialize Google Calendar with local file:', e);
      throw new Error(
        'Google Calendar credentials missing. Set GOOGLE_SERVICE_ACCOUNT_JSON env var or place service_account.json in project root.'
      );
    }
  }

  /**
   * Public method that returns the calendar client.
   * Used by the sync route to reuse auth without duplicating logic.
   */
  public async getCalendar(): Promise<calendar_v3.Calendar> {
    return this.getCalendarClient();
  }

  public saveSyncToken(token: string): void {
    this.syncToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SYNC_TOKEN_KEY, token);
    }
  }

  public getSyncToken(): string | null {
    if (this.syncToken) {
      return this.syncToken;
    }
    if (typeof window !== 'undefined') {
      this.syncToken = localStorage.getItem(this.SYNC_TOKEN_KEY);
      return this.syncToken;
    }
    return null;
  }

  public clearSyncToken(): void {
    this.syncToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.SYNC_TOKEN_KEY);
    }
  }

  public async getUpcomingEvents(maxResults = 10): Promise<SyncResult> {
    return this.getUpcomingEventsInternal(maxResults, 0);
  }

  private async getUpcomingEventsInternal(maxResults: number, retryCount: number): Promise<SyncResult> {
    const calendar = await this.getCalendarClient();
    const timeMin = new Date().toISOString();
    const existingToken = this.getSyncToken();

    let isIncremental = false;
    let requestConfig: calendar_v3.Params$Resource$Events$List = {
      calendarId: this.CALENDAR_ID,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin,
      maxResults,
    };

    // Use sync token for incremental sync if available
    if (existingToken) {
      isIncremental = true;
      requestConfig.syncToken = existingToken;
    }

    try {
      const response = await calendar.events.list(requestConfig);

      // Save the next sync token for future incremental syncs
      if (response.data.nextSyncToken) {
        this.saveSyncToken(response.data.nextSyncToken);
      }

      this.lastSync = new Date();

      const events: CalendarEvent[] = (response.data.items || []).map((item) => ({
        id: item.id || '',
        title: item.summary || '(No title)',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        location: item.location ?? undefined,
        htmlLink: item.htmlLink || '',
        colorId: item.colorId ?? undefined,
      }));

      return {
        events,
        nextSyncToken: response.data.nextSyncToken || null,
        isIncremental,
      };
    } catch (error: any) {
      // Handle Gone error (410) - sync token is expired, clear and retry with full sync
      if (error.code === 410 || error.response?.status === 410) {
        if (retryCount >= 1) {
          // Already retried once after clearing sync token - throwing to avoid infinite recursion
          console.error('Sync token expired on full sync retry. A 410 error persists after clearing token.');
          throw new Error('Calendar sync failed: sync token rejected by Google even after clear. The calendar may have been deleted or sync token corrupted server-side.');
        }
        console.warn('Sync token expired, clearing and retrying with full sync');
        this.clearSyncToken();
        return this.getUpcomingEventsInternal(maxResults, retryCount + 1);
      }
      throw error;
    }
  }

  public async forceFullSync(maxResults = 10): Promise<SyncResult> {
    this.clearSyncToken();
    return this.getUpcomingEvents(maxResults);
  }

  public async createEvent(params: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    timeZone?: string;
  }): Promise<{ id: string; htmlLink: string }> {
    const calendar = await this.getCalendarClient();
    const event = {
      summary: params.title,
      description: params.description,
      location: params.location,
      start: {
        dateTime: params.start.toISOString(),
        timeZone: params.timeZone || 'Africa/Lagos',
      },
      end: {
        dateTime: params.end.toISOString(),
        timeZone: params.timeZone || 'Africa/Lagos',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup' as const, minutes: 10 },
        ],
      },
    };
    const response = await calendar.events.insert({
      calendarId: this.CALENDAR_ID,
      requestBody: event,
    });
    return {
      id: response.data.id || '',
      htmlLink: response.data.htmlLink || '',
    };
  }
}

// Export a singleton instance for convenience
export const googleCalendarService = GoogleCalendarService.getInstance();
