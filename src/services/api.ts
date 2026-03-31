// API Service for authentication

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    mobile?: string;
    role: string;
    status: string;
    profileImageUrl?: string;
    createdAt?: string;
}
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface LoginData {
    email: string;
    password: string;
    role?: string;
}

export interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    mobile?: string;
    role: string;
    preferredSubjects?: string[];
    contractStartDate?: string;
    contractEndDate?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        department?: string;
    };
    resetToken?: string; // Only in development mode
}

// Login user
export async function login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success && result.token) {
        // Store token in localStorage
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
}

// Register user
export async function register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    return response.json();
}

// Forgot password
export async function forgotPassword(email: string, role?: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
    });

    return response.json();
}

// Reset password with token
export async function resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
    });

    return response.json();
}

// Logout user
export function logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
}

// Get current user from localStorage
export function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Get auth token
export function getAuthToken(): string | null {
    return localStorage.getItem('authToken');
}

// Helper for authenticated requests
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    // Get token
    const token = getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers: headers as HeadersInit,
    });

    if (response.status === 401) {
        // Token expired or invalid
        logout();
        window.location.href = '/';
        throw new Error('Session expired');
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Request failed');
    }

    return response.json();
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
    return !!getAuthToken();
}

// --- Approval Workflow APIs ---

// Get all pending registrations
export async function getPendingRegistrations(): Promise<any[]> {
    return fetchWithAuth(`${API_BASE_URL}/approvals/pending`);
}

// Get pending mentors only
export async function getPendingMentors(): Promise<any[]> {
    return fetchWithAuth(`${API_BASE_URL}/approvals/pending/mentors`);
}

// Get pending staff only
export async function getPendingStaff(): Promise<any[]> {
    return fetchWithAuth(`${API_BASE_URL}/approvals/pending/staff`);
}

// Approve a user
export async function approveUser(userId: string): Promise<any> {
    return fetchWithAuth(`${API_BASE_URL}/approvals/approve/${userId}`, {
        method: 'POST',
    });
}

// Reject a user
export async function rejectUser(userId: string, reason?: string): Promise<any> {
    return fetchWithAuth(`${API_BASE_URL}/approvals/reject/${userId}`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: reason }),
    });
}

// Get the currently authenticated user's profile from the backend
export async function getUserProfile(): Promise<UserProfile> {
    return fetchWithAuth(`${API_BASE_URL}/user/me`);
}

// Get all approved HOD and mentor users for the interview panel
export async function getPanelMembers(): Promise<{ id: string; fullName: string; role: string }[]> {
    return fetchWithAuth(`${API_BASE_URL}/user/panel-members`);
}

// Get all approved temporary staff members
export async function getApprovedStaff(): Promise<{
    id: string;
    fullName: string;
    email: string;
    mobile?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    preferredSubjects?: string[];
}[]> {
    return fetchWithAuth(`${API_BASE_URL}/user/staff`);
}

// ─── Interview APIs ───────────────────────────────────────────────

export interface InterviewData {
    id: string;
    interviewNumber: string;
    date: string;       // ISO date e.g. "2026-04-15"
    status: string;     // "upcoming" | "ended"
    candidateCount: number;
    createdAt?: string;
}

export interface CandidateData {
    id: string;
    candidateId?: string;
    name: string;
    email: string;
    phone: string;
    cvUrl?: string;
    marksPart1?: number;
    marksPart2?: number;
    marksPart3?: number;
    totalMarks?: number;
    shortlisted?: boolean;
}

// Get all interviews
export async function getInterviews(): Promise<InterviewData[]> {
    return fetchWithAuth(`${API_BASE_URL}/interviews`);
}

// Get candidates for an interview
export async function getInterviewCandidates(interviewId: string): Promise<CandidateData[]> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/candidates`);
}

// Create a new interview with Excel file upload (multipart)
export async function createInterview(
    interviewNumber: string,
    date: string,
    file: File
): Promise<InterviewData> {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const formData = new FormData();
    formData.append('interviewNumber', interviewNumber);
    formData.append('date', date);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/interviews`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });

    if (response.status === 401) { logout(); window.location.href = '/'; throw new Error('Session expired'); }
    if (!response.ok) { const err = await response.json().catch(() => ({})); throw new Error(err.message || 'Upload failed'); }
    return response.json();
}

// Update an interview's date
export async function updateInterviewDate(interviewId: string, date: string): Promise<InterviewData> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/date`, {
        method: 'PUT',
        body: JSON.stringify({ date }),
    });
}

// ─── Live Interview Session (backend-based) ───────────────────────────────────

export interface ParticipantInfo {
    userId: string;
    fullName: string;
    role: string;
    initials: string;
}

export interface SessionState {
    sessionId: string;
    interviewId: string;
    interviewNumber: string;
    startedAt: string;
    startedByName: string;
    myStatus: 'active' | 'waiting' | 'removed' | null;
    activeParticipants: ParticipantInfo[];
    waitingParticipants: ParticipantInfo[];
}

/** Start a live interview session */
export async function startInterviewSession(interviewId: string): Promise<SessionState> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/session/start`, { method: 'POST' });
}

/** End the active session */
export async function endInterviewSession(interviewId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/session`, { method: 'DELETE' });
}

/** Get session state for a specific interview */
export async function getInterviewSession(interviewId: string): Promise<SessionState> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/session`);
}

/** Get any currently active session + my status (for polling) */
export async function getActiveSession(): Promise<SessionState | null> {
    const token = getAuthToken();
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/interviews/active-session`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 204 || response.status === 404) return null;
    if (response.status === 401) { logout(); window.location.href = '/'; return null; }
    if (!response.ok) return null;
    return response.json();
}

/** Approve a waiting participant */
export async function approveParticipant(interviewId: string, userId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/session/approve/${userId}`, { method: 'PUT' });
}

/** Remove an active participant */
export async function removeParticipant(interviewId: string, userId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/session/remove/${userId}`, { method: 'PUT' });
}

/** Coordinator/HOD voluntarily leaves the session (their marks excluded from report average) */
export async function leaveSession(interviewId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/session/leave`, { method: 'PUT' });
}

// ─── Marking Scheme ───────────────────────────────────────────────────────────

export interface MarkingCriterionData {
    id: string;
    name: string;
    maxMarks: number;
    displayOrder: number;
}

export interface MarkingSchemeData {
    schemeId: string;
    interviewId: string;
    createdByName: string;
    criteria: MarkingCriterionData[];
    totalMaxMarks: number;
}

/** Coordinator saves the marking scheme for an interview */
export async function saveMarkingScheme(
    interviewId: string,
    criteria: { name: string; maxMarks: number }[]
): Promise<MarkingSchemeData> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/marking-scheme`, {
        method: 'POST',
        body: JSON.stringify({ criteria }),
    });
}

/** Get marking scheme for an interview (returns null if none set) */
export async function getMarkingScheme(interviewId: string): Promise<MarkingSchemeData | null> {
    const token = getAuthToken();
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/marking-scheme`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.status === 204 || response.status === 404) return null;
    if (!response.ok) return null;
    return response.json();
}

/** Panel member submits marks for a candidate */
export async function submitMarks(
    interviewId: string,
    candidateId: string,
    marks: { criterionId: string; marksGiven: number }[],
    comments?: string
): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/marks/${candidateId}`, {
        method: 'POST',
        body: JSON.stringify({ marks, comments: comments ?? null }),
    });
}

// ─── Interview Report ─────────────────────────────────────────────────────────

export interface MarkerResult {
    markerId: string;
    markerName: string;
    markerRole: string;
    marksByCriterion: Record<string, number>;
    total: number;
    comments?: string;
}

export interface CandidateReport {
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    markerResults: MarkerResult[];
    averageTotal: number;
    maxTotal: number;
}

export interface InterviewReport {
    interviewId: string;
    interviewNumber: string;
    sessionId: string;
    criteria: MarkingCriterionData[];
    totalMaxMarks: number;
    candidates: CandidateReport[];
}

/** HOD fetches full interview report */
export async function getInterviewReport(interviewId: string): Promise<InterviewReport> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/report`);
}
