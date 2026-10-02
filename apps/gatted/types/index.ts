/**
 * Convenience type exports from the database schema.
 * These provide easy access to Row, Insert, and Update types for each table.
 */

import type { Database } from './database.types';

// Base table types
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// ============================================================
// Row Types (for reading data from the database)
// ============================================================

/** Profile row - user's personal information */
export type Profile = Tables['profiles']['Row'];

/** User role row - links users to societies with roles */
export type UserRole = Tables['user_roles']['Row'];

/** Society row - housing society/apartment complex */
export type Society = Tables['societies']['Row'];

/** Unit row - individual apartment/flat unit */
export type Unit = Tables['units']['Row'];

/** Visitor row - visitor entry records */
export type Visitor = Tables['visitors']['Row'];

/** Issue row - maintenance/complaint tickets */
export type Issue = Tables['issues']['Row'];

/** Announcement row - society-wide announcements */
export type Announcement = Tables['announcements']['Row'];

/** Parcel row - package delivery records */
export type Parcel = Tables['parcels']['Row'];

// ============================================================
// Insert Types (for creating new records)
// ============================================================

export type ProfileInsert = Tables['profiles']['Insert'];
export type UserRoleInsert = Tables['user_roles']['Insert'];
export type VisitorInsert = Tables['visitors']['Insert'];
export type IssueInsert = Tables['issues']['Insert'];
export type AnnouncementInsert = Tables['announcements']['Insert'];
export type ParcelInsert = Tables['parcels']['Insert'];

// ============================================================
// Update Types (for updating existing records)
// ============================================================

export type ProfileUpdate = Tables['profiles']['Update'];
export type UserRoleUpdate = Tables['user_roles']['Update'];
export type VisitorUpdate = Tables['visitors']['Update'];
export type IssueUpdate = Tables['issues']['Update'];
export type AnnouncementUpdate = Tables['announcements']['Update'];
export type ParcelUpdate = Tables['parcels']['Update'];

// ============================================================
// Enum Types (from database)
// ============================================================

export type UserRoleType = Database['public']['Enums']['user_role'];
export type VisitorType = Database['public']['Enums']['visitor_type'];
export type VisitorStatus = Database['public']['Enums']['visitor_status'];
export type IssueCategory = Database['public']['Enums']['issue_category'];
export type IssuePriority = Database['public']['Enums']['issue_priority'];
export type IssueStatus = Database['public']['Enums']['issue_status'];
export type AnnouncementTarget = Database['public']['Enums']['announcement_target'];

// ============================================================
// Extended Types (with relationships)
// ============================================================

/** User role with society and unit details */
export type UserRoleWithDetails = UserRole & {
    society: Society | null;
    unit: {
        id: string;
        unit_number: string;
        block: string | null;
        floor: number | null;
    } | null;
};

/** Visitor with host and unit details */
export type VisitorWithDetails = Visitor & {
    host: Profile | null;
    unit: {
        id: string;
        unit_number: string;
    } | null;
};

/** Issue with reporter and unit details */
export type IssueWithDetails = Issue & {
    reporter: Profile | null;
    unit: {
        id: string;
        unit_number: string;
    } | null;
    assignee?: Profile | null;
};

/** Announcement with creator and read status */
export type AnnouncementWithDetails = Announcement & {
    creator: Profile | null;
    reads: Array<{
        user_id: string;
        read_at: string;
    }>;
};

// ============================================================
// Auth Store Types
// ============================================================

/** Authentication state */
export interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    profile: Profile | null;
    roles: UserRoleWithDetails[];
    currentRole: UserRoleWithDetails | null;
}

// ============================================================
// Component Prop Types
// ============================================================

/** Summary stats for dashboard */
export interface VisitorSummary {
    upcoming: number;
    today: number;
    total: number;
}

export interface IssueSummary {
    open: number;
    inProgress: number;
    resolved: number;
    total: number;
}

// ============================================================
// Form Data Types
// ============================================================

/** Pre-approve visitor form data */
export interface PreApproveVisitorFormData {
    visitorName: string;
    visitorPhone: string;
    visitorType: VisitorType;
    expectedDate: Date;
    expectedTime: Date | null;
    purpose: string;
}

/** Raise issue form data */
export interface RaiseIssueFormData {
    title: string;
    description: string;
    category: IssueCategory;
    priority: IssuePriority;
    photoUri: string | null;
}

/** Walk-in visitor form data */
export interface WalkInVisitorFormData {
    visitorName: string;
    visitorPhone: string;
    unitId: string;
    purpose: string;
}

// Re-export Database type
export type { Database };
