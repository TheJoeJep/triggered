

export type TriggerStatus = "active" | "paused" | "completed" | "failed" | "archived";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "HEAD" | "OPTIONS";

export type IntervalUnit = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";

export type Schedule =
  | { type: "one-time" }
  | { type: "interval"; amount: number; unit: IntervalUnit };


export type ExecutionLog = {
  id: string;
  timestamp: string; // ISO 8601 string
  status: 'success' | 'failed' | 'reset';
  requestPayload?: Record<string, any>;
  responseBody?: string;
  responseStatus?: number;
  error?: string;
  triggerMode?: 'test' | 'production' | 'manual';
};

export type Trigger = {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  nextRun: string; // ISO 8601 string
  status: TriggerStatus;
  schedule: Schedule;
  timeout?: number; // Request timeout in milliseconds
  limit?: number; // How many times it can run. Optional.
  runCount: number; // How many times it has run.
  payload?: Record<string, any>;
  executionHistory?: ExecutionLog[];
  archiveOnComplete?: boolean;
  folderId?: string | null;
  orgId?: string;
  historyMigrated?: boolean;
};

export type Folder = {
  id: string;
  name: string;
  triggers: Trigger[];
};

export type Role = "owner" | "editor" | "viewer";

export type Member = {
  uid: string;
  email: string | null;
  role: Role;
  photoURL: string | null;
  displayName: string | null;
}

export type Organization = {
  id: string;
  name: string;
  owner: {
    uid: string;
    photoURL: string | null;
    email: string | null;
    displayName: string | null;
  };
  members: Member[];
  memberUids: string[]; // For Firestore security rules
  folders: Folder[];
  triggers: Trigger[]; // Triggers outside of any folder
  apiKey: string;
  timezone: string;
  stripeCustomerId?: string;
  subscriptionId?: string;
  planId?: 'free' | 'hobbyist' | 'pro' | 'business';
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing';
  minNextRun?: string; // ISO 8601 string, earliest nextRun of all active triggers
  usage?: {
    executionsThisMonth: number;
    billingCycleStart: string; // ISO 8601 string
    dailyExecutions?: Record<string, number>; // ISO Date String (YYYY-MM-DD) -> Count
  };
}

export type UserData = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  organizations: string[];
}
