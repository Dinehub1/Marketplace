export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            announcement_reads: {
                Row: {
                    id: string
                    announcement_id: string | null
                    user_id: string | null
                    read_at: string | null
                }
                Insert: {
                    id?: string
                    announcement_id?: string | null
                    user_id?: string | null
                    read_at?: string | null
                }
                Update: {
                    id?: string
                    announcement_id?: string | null
                    user_id?: string | null
                    read_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "announcement_reads_announcement_id_fkey"
                        columns: ["announcement_id"]
                        isOneToOne: false
                        referencedRelation: "announcements"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcement_reads_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            announcements: {
                Row: {
                    id: string
                    society_id: string | null
                    created_by: string | null
                    title: string
                    message: string
                    attachments: string[] | null
                    target_type: Database["public"]["Enums"]["announcement_target"] | null
                    target_block_id: string | null
                    target_unit_id: string | null
                    priority: string | null
                    is_active: boolean | null
                    expires_at: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    society_id?: string | null
                    created_by?: string | null
                    title: string
                    message: string
                    attachments?: string[] | null
                    target_type?: Database["public"]["Enums"]["announcement_target"] | null
                    target_block_id?: string | null
                    target_unit_id?: string | null
                    priority?: string | null
                    is_active?: boolean | null
                    expires_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    society_id?: string | null
                    created_by?: string | null
                    title?: string
                    message?: string
                    attachments?: string[] | null
                    target_type?: Database["public"]["Enums"]["announcement_target"] | null
                    target_block_id?: string | null
                    target_unit_id?: string | null
                    priority?: string | null
                    is_active?: boolean | null
                    expires_at?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "announcements_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_target_block_id_fkey"
                        columns: ["target_block_id"]
                        isOneToOne: false
                        referencedRelation: "blocks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "announcements_target_unit_id_fkey"
                        columns: ["target_unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
            }
            blocks: {
                Row: {
                    id: string
                    society_id: string | null
                    name: string
                    manager_id: string | null
                    total_floors: number | null
                    total_units: number | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    society_id?: string | null
                    name: string
                    manager_id?: string | null
                    total_floors?: number | null
                    total_units?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    society_id?: string | null
                    name?: string
                    manager_id?: string | null
                    total_floors?: number | null
                    total_units?: number | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "blocks_manager_id_fkey"
                        columns: ["manager_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "blocks_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            guard_shifts: {
                Row: {
                    id: string
                    society_id: string | null
                    guard_id: string | null
                    shift_start: string
                    shift_end: string | null
                    handover_notes: string | null
                    handed_over_to: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    society_id?: string | null
                    guard_id?: string | null
                    shift_start: string
                    shift_end?: string | null
                    handover_notes?: string | null
                    handed_over_to?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    society_id?: string | null
                    guard_id?: string | null
                    shift_start?: string
                    shift_end?: string | null
                    handover_notes?: string | null
                    handed_over_to?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "guard_shifts_guard_id_fkey"
                        columns: ["guard_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "guard_shifts_handed_over_to_fkey"
                        columns: ["handed_over_to"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "guard_shifts_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            issue_updates: {
                Row: {
                    id: string
                    issue_id: string
                    user_id: string
                    comment: string | null
                    new_status: Database["public"]["Enums"]["issue_status"] | null
                    photos: string[] | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    issue_id: string
                    user_id: string
                    comment?: string | null
                    new_status?: Database["public"]["Enums"]["issue_status"] | null
                    photos?: string[] | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    issue_id?: string
                    user_id?: string
                    comment?: string | null
                    new_status?: Database["public"]["Enums"]["issue_status"] | null
                    photos?: string[] | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "issue_updates_issue_id_fkey"
                        columns: ["issue_id"]
                        isOneToOne: false
                        referencedRelation: "issues"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "issue_updates_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            issues: {
                Row: {
                    id: string
                    society_id: string | null
                    unit_id: string | null
                    reported_by: string | null
                    assigned_to: string | null
                    title: string
                    description: string | null
                    category: Database["public"]["Enums"]["issue_category"]
                    priority: Database["public"]["Enums"]["issue_priority"]
                    status: Database["public"]["Enums"]["issue_status"]
                    photos: string[] | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    society_id?: string | null
                    unit_id?: string | null
                    reported_by?: string | null
                    assigned_to?: string | null
                    title: string
                    description?: string | null
                    category: Database["public"]["Enums"]["issue_category"]
                    priority?: Database["public"]["Enums"]["issue_priority"]
                    status?: Database["public"]["Enums"]["issue_status"]
                    photos?: string[] | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    society_id?: string | null
                    unit_id?: string | null
                    reported_by?: string | null
                    assigned_to?: string | null
                    title?: string
                    description?: string | null
                    category?: Database["public"]["Enums"]["issue_category"]
                    priority?: Database["public"]["Enums"]["issue_priority"]
                    status?: Database["public"]["Enums"]["issue_status"]
                    photos?: string[] | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "issues_assigned_to_fkey"
                        columns: ["assigned_to"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "issues_reported_by_fkey"
                        columns: ["reported_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "issues_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "issues_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
            }
            notifications: {
                Row: {
                    id: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    read: boolean
                    metadata: Json | null
                    society_id: string | null
                    expires_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    title: string
                    message: string
                    type: string
                    read?: boolean
                    metadata?: Json | null
                    society_id?: string | null
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    title?: string
                    message?: string
                    type?: string
                    read?: boolean
                    metadata?: Json | null
                    society_id?: string | null
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            parcels: {
                Row: {
                    id: string
                    society_id: string
                    unit_id: string
                    resident_id: string | null
                    courier_name: string | null
                    tracking_number: string | null
                    description: string | null
                    status: string
                    received_by: string | null
                    collected_by: string | null
                    collected_at: string | null
                    photo_url: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    society_id: string
                    unit_id: string
                    resident_id?: string | null
                    courier_name?: string | null
                    tracking_number?: string | null
                    description?: string | null
                    status?: string
                    received_by?: string | null
                    collected_by?: string | null
                    collected_at?: string | null
                    photo_url?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    society_id?: string
                    unit_id?: string
                    resident_id?: string | null
                    courier_name?: string | null
                    tracking_number?: string | null
                    description?: string | null
                    status?: string
                    received_by?: string | null
                    collected_by?: string | null
                    collected_at?: string | null
                    photo_url?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "parcels_collected_by_fkey"
                        columns: ["collected_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "parcels_received_by_fkey"
                        columns: ["received_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "parcels_resident_id_fkey"
                        columns: ["resident_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "parcels_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "parcels_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
            }
            profiles: {
                Row: {
                    id: string
                    phone: string
                    full_name: string | null
                    email: string | null
                    avatar_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id: string
                    phone: string
                    full_name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    phone?: string
                    full_name?: string | null
                    email?: string | null
                    avatar_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            push_tokens: {
                Row: {
                    id: string
                    user_id: string
                    token: string
                    platform: string
                    is_active: boolean | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    token: string
                    platform: string
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    token?: string
                    platform?: string
                    is_active?: boolean | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "push_tokens_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            societies: {
                Row: {
                    id: string
                    name: string
                    address: string | null
                    city: string | null
                    state: string | null
                    zip_code: string | null
                    total_blocks: number | null
                    total_units: number | null
                    settings: Json | null
                    logo_url: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    zip_code?: string | null
                    total_blocks?: number | null
                    total_units?: number | null
                    settings?: Json | null
                    logo_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    address?: string | null
                    city?: string | null
                    state?: string | null
                    zip_code?: string | null
                    total_blocks?: number | null
                    total_units?: number | null
                    settings?: Json | null
                    logo_url?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            unit_residents: {
                Row: {
                    id: string
                    unit_id: string
                    user_id: string
                    resident_type: string | null
                    is_primary: boolean | null
                    move_in_date: string | null
                    move_out_date: string | null
                    created_at: string | null
                }
                Insert: {
                    id?: string
                    unit_id: string
                    user_id: string
                    resident_type?: string | null
                    is_primary?: boolean | null
                    move_in_date?: string | null
                    move_out_date?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    unit_id?: string
                    user_id?: string
                    resident_type?: string | null
                    is_primary?: boolean | null
                    move_in_date?: string | null
                    move_out_date?: string | null
                    created_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "unit_residents_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "unit_residents_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            units: {
                Row: {
                    id: string
                    society_id: string | null
                    block_id: string | null
                    owner_id: string | null
                    unit_number: string
                    floor: number | null
                    area_sqft: number | null
                    unit_type: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    society_id?: string | null
                    block_id?: string | null
                    owner_id?: string | null
                    unit_number: string
                    floor?: number | null
                    area_sqft?: number | null
                    unit_type?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    society_id?: string | null
                    block_id?: string | null
                    owner_id?: string | null
                    unit_number?: string
                    floor?: number | null
                    area_sqft?: number | null
                    unit_type?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "units_block_id_fkey"
                        columns: ["block_id"]
                        isOneToOne: false
                        referencedRelation: "blocks"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "units_owner_id_fkey"
                        columns: ["owner_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "units_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_roles: {
                Row: {
                    id: string
                    user_id: string
                    society_id: string
                    unit_id: string | null
                    role: Database["public"]["Enums"]["user_role"]
                    is_active: boolean | null
                    assigned_by: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    user_id: string
                    society_id: string
                    unit_id?: string | null
                    role: Database["public"]["Enums"]["user_role"]
                    is_active?: boolean | null
                    assigned_by?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    user_id?: string
                    society_id?: string
                    unit_id?: string | null
                    role?: Database["public"]["Enums"]["user_role"]
                    is_active?: boolean | null
                    assigned_by?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "user_roles_assigned_by_fkey"
                        columns: ["assigned_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_roles_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_roles_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_roles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    }
                ]
            }
            visitors: {
                Row: {
                    id: string
                    society_id: string
                    unit_id: string | null
                    host_id: string
                    visitor_name: string
                    visitor_phone: string | null
                    visitor_email: string | null
                    vehicle_number: string | null
                    visitor_type: Database["public"]["Enums"]["visitor_type"] | null
                    status: Database["public"]["Enums"]["visitor_status"]
                    expected_date: string | null
                    expected_time: string | null
                    purpose: string | null
                    otp: string | null
                    otp_expires_at: string | null
                    qr_code: string | null
                    checked_in_at: string | null
                    checked_out_at: string | null
                    checked_in_by: string | null
                    checked_out_by: string | null
                    check_in_photo_url: string | null
                    is_recurring: boolean | null
                    recurrence_pattern: string | null
                    recurring_type: string | null
                    valid_until: string | null
                    visitor_count: number | null
                    rejection_reason: string | null
                    created_at: string | null
                    updated_at: string | null
                }
                Insert: {
                    id?: string
                    society_id: string
                    unit_id?: string | null
                    host_id: string
                    visitor_name: string
                    visitor_phone?: string | null
                    visitor_email?: string | null
                    vehicle_number?: string | null
                    visitor_type?: Database["public"]["Enums"]["visitor_type"] | null
                    status?: Database["public"]["Enums"]["visitor_status"]
                    expected_date?: string | null
                    expected_time?: string | null
                    purpose?: string | null
                    otp?: string | null
                    otp_expires_at?: string | null
                    qr_code?: string | null
                    checked_in_at?: string | null
                    checked_out_at?: string | null
                    checked_in_by?: string | null
                    checked_out_by?: string | null
                    check_in_photo_url?: string | null
                    is_recurring?: boolean | null
                    recurrence_pattern?: string | null
                    recurring_type?: string | null
                    valid_until?: string | null
                    visitor_count?: number | null
                    rejection_reason?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    society_id?: string
                    unit_id?: string | null
                    host_id?: string
                    visitor_name?: string
                    visitor_phone?: string | null
                    visitor_email?: string | null
                    vehicle_number?: string | null
                    visitor_type?: Database["public"]["Enums"]["visitor_type"] | null
                    status?: Database["public"]["Enums"]["visitor_status"]
                    expected_date?: string | null
                    expected_time?: string | null
                    purpose?: string | null
                    otp?: string | null
                    otp_expires_at?: string | null
                    qr_code?: string | null
                    checked_in_at?: string | null
                    checked_out_at?: string | null
                    checked_in_by?: string | null
                    checked_out_by?: string | null
                    check_in_photo_url?: string | null
                    is_recurring?: boolean | null
                    recurrence_pattern?: string | null
                    recurring_type?: string | null
                    valid_until?: string | null
                    visitor_count?: number | null
                    rejection_reason?: string | null
                    created_at?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "visitors_checked_in_by_fkey"
                        columns: ["checked_in_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitors_checked_out_by_fkey"
                        columns: ["checked_out_by"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitors_host_id_fkey"
                        columns: ["host_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitors_society_id_fkey"
                        columns: ["society_id"]
                        isOneToOne: false
                        referencedRelation: "societies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "visitors_unit_id_fkey"
                        columns: ["unit_id"]
                        isOneToOne: false
                        referencedRelation: "units"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            checkin_visitor: {
                Args: {
                    visitor_uuid: string
                    guard_uuid: string
                    otp_code?: string
                }
                Returns: Json
            }
            checkout_visitor: {
                Args: {
                    visitor_uuid: string
                    guard_uuid: string
                }
                Returns: Json
            }
            cleanup_expired_visitors: {
                Args: Record<PropertyKey, never>
                Returns: undefined
            }
            get_user_context: {
                Args: {
                    user_uuid?: string
                }
                Returns: {
                    user_id: string
                    roles: Json
                    societies: Json
                }
            }
            is_admin: {
                Args: Record<PropertyKey, never>
                Returns: boolean
            }
        }
        Enums: {
            announcement_target: "all" | "block" | "unit" | "role"
            issue_category: "plumbing" | "electrical" | "cleaning" | "security" | "maintenance" | "parking" | "noise" | "other"
            issue_priority: "low" | "medium" | "high" | "urgent"
            issue_status: "open" | "in-progress" | "resolved" | "closed" | "rejected"
            user_role: "admin" | "manager" | "guard" | "resident" | "owner" | "tenant"
            visitor_status: "pending" | "approved" | "checked-in" | "checked-out" | "denied"
            visitor_type: "expected" | "walk-in" | "delivery" | "service" | "guest"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never
