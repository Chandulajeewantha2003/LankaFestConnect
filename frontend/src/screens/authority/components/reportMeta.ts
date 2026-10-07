import { Ionicons } from '@expo/vector-icons';
import { ReportCategory, ReportPriority, ReportSource, ReportStatus } from '../../../services/authority';

type IconName = keyof typeof Ionicons.glyphMap;

// Display labels, icons and colours shared by the Tourism Officer report screens.
export const categoryMeta: Record<ReportCategory, { label: string; icon: IconName; color: string; background: string }> = {
  INAPPROPRIATE_CONTENT: { label: 'Inappropriate Content', icon: 'flag-outline', color: '#B91C1C', background: '#FEE2E2' },
  SAFETY_CONCERN: { label: 'Safety Concern', icon: 'warning-outline', color: '#B91C1C', background: '#FEE2E2' },
  UNAUTHORIZED_EVENT: { label: 'Unauthorized Event', icon: 'ban-outline', color: '#B91C1C', background: '#FEE2E2' },
  MISLEADING_INFORMATION: { label: 'Misleading Information', icon: 'information-circle-outline', color: '#B45309', background: '#FEF3C7' },
  OTHER: { label: 'Other Issue', icon: 'document-text-outline', color: '#1E3A8A', background: '#E0E7FF' },
};

export const statusMeta: Record<ReportStatus, { label: string; tab: string; color: string; background: string }> = {
  OPEN: { label: 'OPEN', tab: 'Open', color: '#B91C1C', background: '#FEE2E2' },
  IN_PROGRESS: { label: 'IN PROGRESS', tab: 'In Progress', color: '#1E3A8A', background: '#E0E7FF' },
  RESOLVED: { label: 'RESOLVED', tab: 'Resolved', color: '#166534', background: '#BBF7D0' },
  ARCHIVED: { label: 'ARCHIVED', tab: 'Archived', color: '#475569', background: '#E2E8F0' },
};

export const priorityMeta: Record<ReportPriority, { label: string; color: string; background: string }> = {
  NORMAL: { label: 'Normal', color: '#475569', background: '#E2E8F0' },
  HIGH: { label: 'High', color: '#B45309', background: '#FEF3C7' },
  CRITICAL: { label: 'Critical', color: '#B91C1C', background: '#FEE2E2' },
};

export const sourceMeta: Record<ReportSource, { label: string; icon: IconName }> = {
  PUBLIC: { label: 'Public User', icon: 'time-outline' },
  FIELD_OFFICER: { label: 'Field Officer', icon: 'shield-half-outline' },
  LOCAL_POLICE: { label: 'Local Police', icon: 'shield-half-outline' },
  PUBLIC_TIP: { label: 'Public Tip-off', icon: 'call-outline' },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatReportDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
