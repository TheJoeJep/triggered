

export type TriggerStatus = "active" | "paused" | "completed" | "failed";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type IntervalUnit = "seconds" | "minutes" | "hours" | "days" | "weeks" | "months" | "years";

export type Schedule = 
  | { type: "one-time" }
  | { type: "interval"; amount: number; unit: IntervalUnit };


export type ExecutionLog = {
  id: string;
  timestamp: string; // ISO 8601 string
  status: 'success' | 'failed';
  requestPayload?: Record<string, any>;
  responseBody?: string;
  responseStatus?: number;
  error?: string;
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
}

export type UserData = {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    organizations: string[];
}
