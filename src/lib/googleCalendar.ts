import { google, calendar_v3 } from 'googleapis';
import path from 'path';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  htmlLink: string;
  colorId?: string;
}

export interface SyncResult {
  events: CalendarEvent[];
  nextSyncToken: string | null;
  isIncremental: boolean;
}

interface AccountConfig {
  credentialsJson: string;
  calendarId: string;
  syncTokenKey: string;
}

const ACCOUNT_CONFIGS: Record<string, AccountConfig> = {
  personal: {
    credentialsJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '',
    calendarId: 'owendigitals@gmail.com',
    syncTokenKey: 'gcal_personal_sync_token',
  },
  work: {
    credentialsJson: process.env.GOOGLE_WORK_SERVICE_ACCOUNT_JSON || '',
    calendarId: process.env.GOOGLE_WORK_CALENDAR_ID || '',
    syncTokenKey: 'gcal_work_sync_token',
  },
};

export class GoogleCalendarClient {
  private auth: any = null;
  private calendar: calendar_v3.Calendar | null = null;
  private credentialsJson: string;
  private calendarId: string;
  private syncTokenKey: string;
  private syncToken: string | null = null;
  private resolvedCalendarId: string | null = null;

  constructor(config: AccountConfig) {
    this.credentialsJson = config.credentialsJson;
    this.calendarId = config.calendarId;
    this.syncTokenKey = config.syncTokenKey;
  }

  private async resolvePrimaryCalendarId(calendar: calendar_v3.Calendar): Promise<string> {
    if (this.resolvedCalendarId) return this.resolvedCalendarId;

    try {
      const calendarList = await calendar.calendarList.list();
      const primary = calendarList.data.items?.find(c => c.primary === true);
      if (primary?.id) {
        this.resolvedCalendarId = primary.id;
        return this.resolvedCalendarId;
      }
    } catch (e) {
      console.warn('Could not fetch calendar list to find primary:', e);
    }

    // Fallback to configured calendarId
    this.resolvedCalendarId = this.calendarId;
    return this.resolvedCalendarId;
  }

  private async getAuth(): Promise<any> {
    if (this.auth) return this.auth;

    if (!this.credentialsJson) {
      // Try local file fallback
      const keyFilePath = path.join(process.cwd(), 'service_account.json');
      this.auth = new google.auth.GoogleAuth({
        keyFile: keyFilePath,
        scopes: ['https://www.googleapis.com/auth/calendar'],
      });
    } else {
      try {
        const creds = JSON.parse(this.credentialsJson);
        this.auth = new google.auth.GoogleAuth({
          credentials: creds,
          scopes: ['https://www.googleapis.com/auth/calendar'],
        });
      } catch (e) {
        console.error('Failed to parse service account JSON:', e);
        throw e;
      }
    }

    return this.auth;
  }

  public async getCalendar(): Promise<calendar_v3.Calendar> {
    return this.getCalendarClient();
  }

  private async getCalendarClient(): Promise<calendar_v3.Calendar> {
    if (this.calendar) return this.calendar;
    const auth = await this.getAuth();
    this.calendar = google.calendar({ version: 'v3', auth });
    return this.calendar;
  }

  private loadSyncToken(): string | null {
    if (this.syncToken) return this.syncToken;
    if (typeof window !== 'undefined') {
      this.syncToken = localStorage.getItem(this.syncTokenKey);
      return this.syncToken;
    }
    return null;
  }

  private saveSyncToken(token: string): void {
    this.syncToken = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.syncTokenKey, token);
    }
  }

  public clearSyncToken(): void {
    this.syncToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.syncTokenKey);
    }
  }

  public async getUpcomingEvents(maxResults = 10, retryCount = 0): Promise<SyncResult> {
    const calendar = await this.getCalendar();
    const calendarId = await this.resolvePrimaryCalendarId(calendar);
    const timeMin = new Date().toISOString();
    const existingToken = this.loadSyncToken();

    let isIncremental = false;
    const requestConfig: calendar_v3.Params$Resource$Events$List = {
      calendarId,
      singleEvents: true,
      orderBy: 'startTime',
      timeMin,
      maxResults,
    };

    if (existingToken) {
      isIncremental = true;
      requestConfig.syncToken = existingToken;
    }

    try {
      const response = await calendar.events.list(requestConfig);

      if (response.data.nextSyncToken) {
        this.saveSyncToken(response.data.nextSyncToken);
      }

      // Filter to only events whose organizer matches the calendar ID being queried
    // AND exclude workingLocation events (Google Calendar's "work from home" marker)
    // For work account, the calendar ID is owen@twolions.co — any event with that organizer
    // comes from the primary calendar. Events from shared/secondary calendars have different organizers.
    const events: CalendarEvent[] = (response.data.items || [])
      .filter((item) => {
        // Exclude workingLocation events (these are "work from home" markers, not real events)
        if (item.eventType === 'workingLocation') return false;
        const organizerEmail = item.organizer?.email;
        // Only include events where the organizer matches the calendar we're querying
        return organizerEmail && organizerEmail.toLowerCase() === this.calendarId.toLowerCase();
      })
      .map((item) => ({
        id: item.id || '',
        title: item.summary || '(No title)',
        start: item.start?.dateTime || item.start?.date || '',
        end: item.end?.dateTime || item.end?.date || '',
        location: item.location ?? undefined,
        htmlLink: item.htmlLink || '',
        colorId: item.colorId ?? undefined,
      }));

    // For work account, also include events organized by other people but on the shared calendar
    // These are legitimate calendar events (like Design Daily Sync organized by emmanuel@twolions.co)
    if (this.calendarId === 'owen@twolions.co') {
      const sharedEvents: CalendarEvent[] = (response.data.items || [])
        .filter((item) => {
          if (item.eventType === 'workingLocation') return false;
          const org = item.organizer?.email || '';
          return org.endsWith('@twolions.co');
        })
        .map((item) => ({
          id: item.id || '',
          title: item.summary || '(No title)',
          start: item.start?.dateTime || item.start?.date || '',
          end: item.end?.dateTime || item.end?.date || '',
          location: item.location ?? undefined,
          htmlLink: item.htmlLink || '',
          colorId: item.colorId ?? undefined,
        }));
      // Merge and deduplicate
      const allEvents = [...events, ...sharedEvents];
      const uniqueEvents = allEvents.filter((e, i, arr) => arr.findIndex(a => a.id === e.id) === i);
      return {
        events: uniqueEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
        nextSyncToken: response.data.nextSyncToken || null,
        isIncremental,
      };
    }

      return {
        events,
        nextSyncToken: response.data.nextSyncToken || null,
        isIncremental,
      };
    } catch (error: any) {
      if (error.code === 410 || error.response?.status === 410) {
        if (retryCount >= 1) {
          throw new Error('Calendar sync failed: sync token rejected by Google even after clear.');
        }
        console.warn('Sync token expired, clearing and retrying with full sync');
        this.clearSyncToken();
        return this.getUpcomingEvents(maxResults, retryCount + 1);
      }
      throw error;
    }
  }

  public async createEvent(params: {
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    timeZone?: string;
  }): Promise<{ id: string; htmlLink: string }> {
    const calendar = await this.getCalendar();
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
        overrides: [{ method: 'popup' as const, minutes: 10 }],
      },
    };
    const response = await calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: event,
    });
    return {
      id: response.data.id || '',
      htmlLink: response.data.htmlLink || '',
    };
  }
}

// Registry for calendar clients
const clients: Record<string, GoogleCalendarClient> = {};

export function getCalendarClient(account: 'personal' | 'work'): GoogleCalendarClient {
  if (!clients[account]) {
    const config = ACCOUNT_CONFIGS[account];
    if (!config?.credentialsJson) {
      throw new Error(`Missing credentials for ${account} account. Set ${account === 'personal' ? 'GOOGLE_SERVICE_ACCOUNT_JSON' : 'GOOGLE_WORK_SERVICE_ACCOUNT_JSON'} env var.`);
    }
    clients[account] = new GoogleCalendarClient(config);
  }
  return clients[account];
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;

  private constructor() {}

  public static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  public async getUpcomingEventsForAccount(account: 'personal' | 'work', maxResults = 10) {
    const client = getCalendarClient(account);
    return client.getUpcomingEvents(maxResults);
  }

  public async createEventOnAccount(
    account: 'personal' | 'work',
    params: { title: string; description?: string; start: Date; end: Date; location?: string; timeZone?: string }
  ) {
    const client = getCalendarClient(account);
    return client.createEvent(params);
  }
}

export const googleCalendarService = GoogleCalendarService.getInstance();