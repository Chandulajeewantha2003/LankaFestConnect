import { apiRequest } from './api';

// Tourism Officer (AUTHORITY role) API helpers
export interface AuthorityDashboard {
  pendingReview: number;
  newPendingToday: number;
  verifiedActive: number;
  flagged: number;
  openReports: number;
  generatedAt: string;
}

export type ListingStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface AuthorityEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  city: string;
  locationName: string;
  locationAddress: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  coverImage: string | null;
  isPaid: boolean;
  ticketPrice: number;
  eventStatus: string;
  createdAt: string;
  organizer: { id: string; fullName: string } | null;
  verification: { status: ListingStatus | 'FLAGGED'; note: string; decidedAt: string | null };
}

export interface AuthorityEventList {
  status: ListingStatus;
  counts: Record<ListingStatus, number>;
  events: AuthorityEvent[];
}

export type DecisionStatus = 'VERIFIED' | 'REJECTED' | 'FLAGGED';
export type ChecklistKey = 'organizer' | 'documents' | 'media' | 'safety' | 'cultural';
export type Checklist = Record<ChecklistKey, boolean>;

export interface Verification {
  status: ListingStatus | 'FLAGGED';
  note: string;
  decidedAt: string | null;
  checklist: Checklist;
}

export interface AuthorityEventDetail {
  id: string;
  title: string;
  description: string;
  category: string;
  eventType: string;
  audience: string[];
  city: string;
  locationName: string;
  locationAddress: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  images: string[];
  isPaid: boolean;
  ticketPrice: number;
  additionalInfo: { foodAndBeverages?: boolean; wheelchairAccessible?: boolean; familyFriendly?: boolean };
  eventStatus: string;
  createdAt: string;
  organizer: { id: string; fullName: string } | null;
  verification: Verification;
}

export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ARCHIVED';
export type ReportCategory = 'INAPPROPRIATE_CONTENT' | 'SAFETY_CONCERN' | 'UNAUTHORIZED_EVENT' | 'MISLEADING_INFORMATION' | 'OTHER';
export type ReportPriority = 'NORMAL' | 'HIGH' | 'CRITICAL';
export type ReportSource = 'PUBLIC' | 'FIELD_OFFICER' | 'LOCAL_POLICE' | 'PUBLIC_TIP';

export interface ReportSummary {
  id: string;
  ref: string;
  category: ReportCategory;
  description: string;
  priority: ReportPriority;
  status: ReportStatus;
  source: ReportSource;
  reporterLabel: string;
  eventId: string | null;
  eventTitle: string;
  evidenceCount: number;
  resolutionNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDetail extends ReportSummary {
  evidence: string[];
}

export interface ReportList {
  status: ReportStatus;
  counts: Record<ReportStatus, number>;
  pendingActions: number;
  critical: { unresolved: number; today: number };
  reports: ReportSummary[];
}

export interface EvidenceFeed {
  total: number;
  items: { reportId: string; ref: string; index: number; image: string }[];
}

export interface NewReport {
  category: ReportCategory;
  priority: ReportPriority;
  source: Exclude<ReportSource, 'PUBLIC'>;
  description: string;
  eventId?: string;
  evidence?: string[];
}

export type AlertType = 'SAFETY_ALERT' | 'GENERAL_NOTICE';
export type AlertClassification = 'SAFETY' | 'ROUTE' | 'WEATHER' | 'GENERAL';
export type AlertAudience = 'ALL_USERS' | 'TOURISTS' | 'ORGANIZERS' | 'GUIDES';

export interface PublicAlert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  classification: AlertClassification;
  urgent: boolean;
  audiences: AlertAudience[];
  status: 'ACTIVE' | 'WITHDRAWN';
  createdAt: string;
  withdrawnAt: string | null;
}

export interface NewAlert {
  type: AlertType;
  title: string;
  message: string;
  classification: AlertClassification;
  urgent: boolean;
  audiences: AlertAudience[];
}

export const authorityService = {
  getDashboard: async () => {
    return apiRequest<AuthorityDashboard>('/authority/dashboard');
  },
  getEvents: async (status: ListingStatus) => {
    return apiRequest<AuthorityEventList>(`/authority/events?status=${status}`);
  },
  getEvent: async (id: string) => {
    return apiRequest<AuthorityEventDetail>(`/authority/events/${encodeURIComponent(id)}`);
  },
  decide: async (id: string, data: { status: DecisionStatus; note: string; checklist: Checklist }) => {
    return apiRequest<{ eventId: string; verification: Verification }>(`/authority/events/${encodeURIComponent(id)}/verification`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  resetDecision: async (id: string) => {
    return apiRequest<{ eventId: string; verification: Verification }>(`/authority/events/${encodeURIComponent(id)}/verification`, {
      method: 'DELETE',
    });
  },
  getReports: async (status: ReportStatus) => {
    return apiRequest<ReportList>(`/authority/reports?status=${status}`);
  },
  getReport: async (id: string) => {
    return apiRequest<ReportDetail>(`/authority/reports/${encodeURIComponent(id)}`);
  },
  getEvidence: async (limit: number) => {
    return apiRequest<EvidenceFeed>(`/authority/reports/evidence?limit=${limit}`);
  },
  createReport: async (data: NewReport) => {
    return apiRequest<ReportSummary>('/authority/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateReportStatus: async (id: string, status: ReportStatus, note?: string) => {
    return apiRequest<ReportSummary>(`/authority/reports/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(note ? { status, note } : { status }),
    });
  },
  getEventOptions: async () => {
    return apiRequest<{ id: string; title: string; city: string }[]>('/authority/event-options');
  },
  getAlerts: async () => {
    return apiRequest<PublicAlert[]>('/authority/alerts');
  },
  publishAlert: async (data: NewAlert) => {
    return apiRequest<PublicAlert>('/authority/alerts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  withdrawAlert: async (id: string) => {
    return apiRequest<PublicAlert>(`/authority/alerts/${encodeURIComponent(id)}/withdraw`, {
      method: 'PATCH',
    });
  },
};
