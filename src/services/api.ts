// API Service for authentication

export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    mobile?: string;
    role: string;
    status: string;
    profileImageUrl?: string;
    specialization?: string;
    preferredSubjects?: string[];
    createdAt?: string;
    contractStartDate?: string;
    contractEndDate?: string;
    menteesCount?: number;
    preferredModules?: string[];
    preferredModuleDetails?: CurriculumModuleDto[];
    preferencesRequested?: boolean;
}
// API base URL for the backend.
// In production you should set `VITE_API_BASE_URL`; otherwise we fall back to the production URL.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dimtscs.me/api';

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

const DASHBOARD_ROLE_KEY = 'dashboardRole';

/** Role chosen at sign-in (may differ from DB role when HOD/coordinator use the Mentor dashboard). */
export function setDashboardRoleForSession(role: string): void {
    localStorage.setItem(DASHBOARD_ROLE_KEY, role);
}

export function getDashboardRole(): string | null {
    return localStorage.getItem(DASHBOARD_ROLE_KEY);
}

// Logout user
export function logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem(DASHBOARD_ROLE_KEY);
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
        const errText = await response.text();
        let msg = `Request failed (${response.status})`;
        if (errText.trim()) {
            try {
                const errorData = JSON.parse(errText) as { message?: string; error?: string };
                msg = errorData.message || errorData.error || msg;
            } catch {
                msg = errText.length < 300 ? errText : msg;
            }
        }
        throw new Error(msg);
    }

    // Many Spring endpoints return 200 OK with no body (e.g. submit marks) — avoid response.json() on empty body.
    const text = await response.text();
    if (!text.trim()) return undefined;
    return JSON.parse(text);
}

// ─── Research Opportunities APIs ───────────────────────────────────────────────

export type ResearchStatus = 'open' | 'closed' | 'filled';
export type ResearchApplicationStatus = 'applied' | 'accepted' | 'rejected';

export interface ResearchOpportunityDto {
    id: string;
    title: string;
    description?: string | null;
    status: ResearchStatus;
    deadline?: string | null;
    maxApplicants?: number | null;
    createdBy: string;
    createdByName?: string | null;
    createdAt?: string;
    applicantsCount?: number;
}

export interface ResearchApplicantDto {
    applicationId: string;
    userId: string;
    fullName: string;
    email: string;
    specializations: string[];
    status: ResearchApplicationStatus;
    appliedAt?: string;
}

export interface MyResearchApplicationDto {
    id: string;
    opportunityId: string;
    status: ResearchApplicationStatus;
    appliedAt?: string;
}

export async function createResearchOpportunity(body: {
    title: string;
    description?: string;
    deadline?: string;
    maxApplicants?: number;
    status?: ResearchStatus;
}): Promise<ResearchOpportunityDto> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function getMyResearchOpportunities(): Promise<ResearchOpportunityDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities/mine`);
}

export async function updateResearchOpportunity(
    opportunityId: string,
    body: Partial<{
        title: string;
        description: string;
        deadline: string;
        maxApplicants: number;
        status: ResearchStatus;
    }>
): Promise<ResearchOpportunityDto> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities/${opportunityId}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function deleteResearchOpportunity(opportunityId: string): Promise<{ success: boolean; message?: string }> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities/${opportunityId}`, { method: 'DELETE' });
}

export async function listOpenResearchOpportunities(): Promise<ResearchOpportunityDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities`);
}

export async function applyToResearchOpportunity(opportunityId: string): Promise<{ id: string; opportunityId: string; status: ResearchApplicationStatus; appliedAt?: string }> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities/${opportunityId}/apply`, { method: 'POST' });
}

export async function getMyResearchApplications(): Promise<MyResearchApplicationDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/research/applications/mine`);
}

export async function getResearchApplicants(opportunityId: string): Promise<ResearchApplicantDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/research/opportunities/${opportunityId}/applications`);
}

export async function acceptResearchApplicant(applicationId: string): Promise<ResearchApplicantDto> {
    return fetchWithAuth(`${API_BASE_URL}/research/applications/${applicationId}/accept`, { method: 'POST' });
}

export async function rejectResearchApplicant(applicationId: string): Promise<ResearchApplicantDto> {
    return fetchWithAuth(`${API_BASE_URL}/research/applications/${applicationId}/reject`, { method: 'POST' });
}

// ─── User Notifications (backend inbox) ───────────────────────────────────────

export interface UserNotificationDto {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    relatedOpportunityId?: string | null;
    relatedApplicationId?: string | null;
    createdAt?: string;
}

export async function getMyNotifications(
    unreadOnly = false,
    category?: 'inbox' | 'reminders'
): Promise<UserNotificationDto[]> {
    const q = new URLSearchParams();
    q.set('unreadOnly', unreadOnly ? 'true' : 'false');
    if (category) q.set('category', category);
    return fetchWithAuth(`${API_BASE_URL}/notifications?${q.toString()}`);
}

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    return fetchWithAuth(`${API_BASE_URL}/notifications/${notificationId}/read`, { method: 'POST' });
}

export async function getUnreadNotificationCount(options?: { inboxOnly?: boolean }): Promise<number> {
    const q = new URLSearchParams();
    if (options?.inboxOnly) q.set('inboxOnly', 'true');
    const suffix = q.toString() ? `?${q.toString()}` : '';
    const res = await fetchWithAuth(`${API_BASE_URL}/notifications/unread-count${suffix}`) as { count?: number };
    return typeof res.count === 'number' ? res.count : 0;
}

export async function markAllNotificationsRead(options?: { inboxOnly?: boolean }): Promise<{ success: boolean; updated: number }> {
    const q = new URLSearchParams();
    if (options?.inboxOnly) q.set('inboxOnly', 'true');
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return fetchWithAuth(`${API_BASE_URL}/notifications/read-all${suffix}`, { method: 'POST' });
}

// --- Dashboard APIs ---
export interface HodDashboardStats {
    totalTemporaryStaff: number;
    activeMentorships: number;
    contractsExpiringSoon: number;
    upcomingInterviewRounds: number;
}

export async function getHodDashboardStats(): Promise<HodDashboardStats> {
    return fetchWithAuth(`${API_BASE_URL}/dashboard/hod-stats`);
}

export interface CoordinatorDashboardStats {
    activeTempStaff: number;
    pendingRegistrationApproval: number;
    upcomingInterviewRounds: number;
    activeMentorships: number;
}

export async function getCoordinatorDashboardStats(): Promise<CoordinatorDashboardStats> {
    return fetchWithAuth(`${API_BASE_URL}/dashboard/coordinator-stats`);
}

export interface MentorDashboardStats {
    menteesCount: number;
    activeResearchPosts: number;
    pendingResearchApplicants: number;
    upcomingInterviewRounds: number;
}

export async function getMentorDashboardStats(): Promise<MentorDashboardStats> {
    return fetchWithAuth(`${API_BASE_URL}/dashboard/mentor-stats`);
}

export interface TempStaffDashboardStats {
    tasksAvailableToday: number;
    leaveDaysRemaining: number;
    daysToContractEnd: number | null;
}

export async function getTempStaffDashboardStats(): Promise<TempStaffDashboardStats> {
    return fetchWithAuth(`${API_BASE_URL}/dashboard/staff-stats`);
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

export async function updateMyProfile(body: {
    fullName?: string;
    mobile?: string;
    profileImageUrl?: string;
    currentPassword?: string;
    newPassword?: string;
}): Promise<UserProfile> {
    return fetchWithAuth(`${API_BASE_URL}/user/me/profile`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/** Permanently deletes the authenticated user (see backend DELETE /api/user/me). */
export async function deleteMyAccount(): Promise<void> {
    await fetchWithAuth(`${API_BASE_URL}/user/me`, { method: 'DELETE' });
}

export async function updateMyPreferredSubjects(preferredSubjects: string[]): Promise<UserProfile> {
    return fetchWithAuth(`${API_BASE_URL}/user/me/preferred-subjects`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferredSubjects }),
    });
}

export async function updateMySpecialization(specialization: string): Promise<UserProfile> {
    return fetchWithAuth(`${API_BASE_URL}/user/me/specialization`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ specialization }),
    });
}

export async function getUserProfileById(userId: string): Promise<UserProfile> {
    return fetchWithAuth(`${API_BASE_URL}/user/${userId}`);
}

// Get all approved HOD and mentor users for the interview panel
export async function getPanelMembers(): Promise<{ id: string; fullName: string; role: string }[]> {
    return fetchWithAuth(`${API_BASE_URL}/user/panel-members`);
}

export async function getApprovedMentors(): Promise<UserProfile[]> {
    return fetchWithAuth(`${API_BASE_URL}/user/mentors`);
}

export async function assignMentorToStaff(
    staffUserId: string,
    mentorId: string
): Promise<{ success: boolean; message?: string; mentorId?: string; mentorName?: string }> {
    return fetchWithAuth(`${API_BASE_URL}/user/staff/${staffUserId}/mentor`, {
        method: 'PUT',
        body: JSON.stringify({ mentorId }),
    });
}

export async function getMyMentees(): Promise<UserProfile[]> {
    return fetchWithAuth(`${API_BASE_URL}/user/mentees/mine`);
}

export async function getMyMenteesCount(): Promise<{ count: number }> {
    return fetchWithAuth(`${API_BASE_URL}/user/mentees/mine/count`);
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
    mentorId?: string;
    mentorName?: string;
    preferencesRequested?: boolean;
    modulePreferencesSubmitted?: boolean;
    preferredModules?: string[];
    preferredModuleDetails?: CurriculumModuleDto[];
}[]> {
    return fetchWithAuth(`${API_BASE_URL}/user/staff`);
}

// Update a staff member's contract period (Coordinator/HOD)
export async function updateStaffContract(
    staffUserId: string,
    contractStartDate: string,
    contractEndDate: string
): Promise<{
    id: string;
    fullName: string;
    email: string;
    mobile?: string;
    contractStartDate?: string;
    contractEndDate?: string;
}> {
    return fetchWithAuth(`${API_BASE_URL}/user/staff/${staffUserId}/contract`, {
        method: 'PUT',
        body: JSON.stringify({ contractStartDate, contractEndDate }),
    });
}

// ─── Curriculum modules (coordinator programme list) ───────────────

export interface CurriculumModuleDto {
    id: string;
    code: string;
    name: string;
    chiefTutor?: string | null;
    academicLevel: number;
    semesterLabel: string;
    credits: number;
    compulsoryOptional: string;
    programKind: string;
    mitTrack?: string | null;
}

export async function getCurriculumModules(params?: {
    semester?: string;
    programKind?: string;
}): Promise<CurriculumModuleDto[]> {
    const q = new URLSearchParams();
    if (params?.semester && params.semester !== 'all') q.set('semester', params.semester);
    if (params?.programKind && params.programKind !== 'all') q.set('programKind', params.programKind);
    const suffix = q.toString() ? `?${q.toString()}` : '';
    return fetchWithAuth(`${API_BASE_URL}/curriculum-modules${suffix}`);
}

export async function createCurriculumModule(body: {
    code: string;
    name: string;
    academicLevel: number;
    semesterLabel: string;
    credits: number;
    compulsoryOptional: string;
    chiefTutor?: string;
    programKind: string;
    mitTrack?: string | null;
}): Promise<CurriculumModuleDto> {
    return fetchWithAuth(`${API_BASE_URL}/curriculum-modules`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export async function updateCurriculumModule(
    id: string,
    body: {
        code: string;
        name: string;
        academicLevel: number;
        semesterLabel: string;
        credits: number;
        compulsoryOptional: string;
        chiefTutor?: string;
        programKind: string;
        mitTrack?: string | null;
    }
): Promise<CurriculumModuleDto> {
    return fetchWithAuth(`${API_BASE_URL}/curriculum-modules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function notifyCurriculumModules(
    moduleIds: string[],
    message?: string,
    staffId?: string
): Promise<{ success: boolean; message: string; moduleCount: number; staffNotified: number }> {
    return fetchWithAuth(`${API_BASE_URL}/curriculum-modules/notify`, {
        method: 'POST',
        body: JSON.stringify({ moduleIds, message: message ?? null, staffId: staffId ?? null }),
    });
}

// ─── Job descriptions ───────────────────────────────────────────────

export interface JobDescriptionDto {
    userId: string;
    content: string;
    createdAt?: string;
}

export async function upsertJobDescriptionForStaff(staffId: string, content: string): Promise<JobDescriptionDto> {
    return fetchWithAuth(`${API_BASE_URL}/job-descriptions/staff/${staffId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    });
}

export async function getMyJobDescription(): Promise<JobDescriptionDto> {
    return fetchWithAuth(`${API_BASE_URL}/job-descriptions/mine`);
}

export async function getJobDescriptionForStaff(staffId: string): Promise<JobDescriptionDto> {
    return fetchWithAuth(`${API_BASE_URL}/job-descriptions/staff/${staffId}`);
}

// ─── Module preferences (staff submits from requested module list) ────────────

export interface ModulePreferenceRequestDto {
    id: string;
    message?: string | null;
    createdAt?: string;
    submittedByMe: boolean;
    modules: CurriculumModuleDto[];
}

export async function getLatestModulePreferenceRequest(): Promise<ModulePreferenceRequestDto | null> {
    return fetchWithAuth(`${API_BASE_URL}/module-preferences/latest`);
}

export async function submitModulePreferences(body: {
    requestId: string;
    moduleIds: string[];
}): Promise<{ success: boolean }> {
    return fetchWithAuth(`${API_BASE_URL}/module-preferences/submit`, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

// ─── Leave Requests (apply + approvals) ───────────────────────────────────

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequestDto {
    id: string;
    staffId: string | null;
    staffName: string;
    staffEmail: string | null;

    leaveDate: string | null; // YYYY-MM-DD
    reason: string;

    substituteId: string | null;
    substituteName: string | null;

    status: LeaveRequestStatus;

    submittedAt: string | null;
    approvedById: string | null;
    approvedByName: string | null;
    approvedAt: string | null;

    rejectionReason: string | null;
}

export async function applyLeave(body: {
    leaveDate: string; // YYYY-MM-DD
    reason: string;
    substituteId: string;
}): Promise<LeaveRequestDto> {
    return fetchWithAuth(`${API_BASE_URL}/leaves/apply`, {
        method: 'POST',
        body: JSON.stringify({
            leaveDate: body.leaveDate,
            reason: body.reason,
            substituteId: body.substituteId,
        }),
    });
}

export async function getMyLeaveRequests(): Promise<LeaveRequestDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/leaves/mine`);
}

export async function getPendingLeaveRequests(): Promise<LeaveRequestDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/leaves/pending`);
}

export async function approveLeave(leaveRequestId: string): Promise<LeaveRequestDto> {
    return fetchWithAuth(`${API_BASE_URL}/leaves/${leaveRequestId}/approve`, { method: 'POST' });
}

export async function rejectLeave(leaveRequestId: string, rejectionReason?: string): Promise<LeaveRequestDto> {
    return fetchWithAuth(`${API_BASE_URL}/leaves/${leaveRequestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: rejectionReason ?? null }),
    });
}

// ─── Interview APIs ───────────────────────────────────────────────

export interface InterviewData {
    id: string;
    interviewNumber: string;
    date: string;       // ISO date e.g. "2026-04-15"
    status: string;     // "upcoming" | "ended"
    candidateCount: number;
    createdAt?: string;
    /** Set when coordinator released averaged results to HOD (ended interviews). */
    reportSentToHodAt?: string | null;
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

/** Step off the active marking panel (waiting); marks excluded from averages until active again */
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
    /** False if marker left or was removed — still listed, but not counted in averages */
    includedInAverage?: boolean;
}

export interface CandidateReport {
    candidateId: string;
    displayCandidateId?: string | null;
    candidateName: string;
    candidateEmail: string;
    markerResults: MarkerResult[];
    averageTotal: number;
    averageMarksByCriterion?: Record<string, number>;
    markersIncludedCount?: number;
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

/** Coordinator (always for ended) or HOD (after coordinator release) — averaged marking report */
export async function getInterviewReport(interviewId: string): Promise<InterviewReport> {
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/report`);
}

/** Download averaged interview report as .xlsx (same auth as getInterviewReport). Triggers a browser file download. */
export async function downloadInterviewReportExcel(interviewId: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');
    const response = await fetch(`${API_BASE_URL}/interviews/${interviewId}/report/export`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
        logout();
        window.location.href = '/';
        throw new Error('Session expired');
    }
    if (!response.ok) {
        const errText = await response.text();
        let msg = `Request failed (${response.status})`;
        if (errText.trim()) {
            try {
                const errorData = JSON.parse(errText) as { message?: string };
                msg = errorData.message || msg;
            } catch {
                if (errText.length < 300) msg = errText;
            }
        }
        throw new Error(msg);
    }
    const blob = await response.blob();
    const cd = response.headers.get('Content-Disposition');
    let filename = `interview-report-${interviewId}.xlsx`;
    if (cd) {
        const quoted = /filename="([^"]+)"/i.exec(cd);
        const plain = /filename=([^;\s]+)/i.exec(cd);
        const raw = quoted?.[1] ?? plain?.[1];
        if (raw) filename = raw.trim();
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

/** Coordinator sends averaged results to HOD after reviewing (ended interview only). */
export async function releaseInterviewReportToHod(interviewId: string): Promise<InterviewData> {
    // POST avoids some reverse proxies / static hosts that do not forward PUT to Spring (404 "No static resource").
    return fetchWithAuth(`${API_BASE_URL}/interviews/${interviewId}/report/release`, { method: 'POST' });
}

// ─── Salary Management ────────────────────────────────────────────────────────

export interface SalaryTemplateDto {
    id: string;
    periodKey: string;
    periodStart: string;
    periodEnd: string;
    dayRate: number;
    extraLeaveDayDeduction: number;
    totalWorkableDays: number;
    createdBy?: string | null;
    updatedAt?: string | null;
}

export interface SalaryReportDto {
    id: string;
    staffId: string;
    staffName?: string | null;
    staffEmail?: string | null;
    periodKey: string;
    periodStart: string;
    periodEnd: string;
    totalWorkableDays: number;
    presentDays: number;
    leaveDays: number;
    absentDays: number;
    freeLeaveDays: number;
    extraLeaveDays: number;
    dayRate: number;
    grossSalary: number;
    deductionAmount: number;
    netSalary: number;
    status: 'draft' | 'sent_to_hod' | 'approved' | 'rejected';
    sentToHodAt?: string | null;
    reviewedById?: string | null;
    reviewedByName?: string | null;
    reviewedAt?: string | null;
    reviewNote?: string | null;
}

export async function upsertSalaryTemplate(body: {
    periodKey: string;
    dayRate: number;
    extraLeaveDayDeduction: number;
    totalWorkableDays: number;
}): Promise<SalaryTemplateDto> {
    return fetchWithAuth(`${API_BASE_URL}/salary/templates`, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

export async function getSalaryTemplate(periodKey: string): Promise<SalaryTemplateDto> {
    return fetchWithAuth(`${API_BASE_URL}/salary/templates/${periodKey}`);
}

export async function generateSalaryReports(periodKey: string): Promise<SalaryReportDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/salary/reports/generate/${periodKey}`, {
        method: 'POST',
    });
}

export async function getSalaryReports(periodKey: string): Promise<SalaryReportDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/salary/reports/${periodKey}`);
}

export async function sendSalaryReportsToHod(periodKey: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/salary/reports/${periodKey}/send-to-hod`, {
        method: 'POST',
    });
}

export async function approveSalaryReport(reportId: string, note?: string): Promise<SalaryReportDto> {
    return fetchWithAuth(`${API_BASE_URL}/salary/reports/${reportId}/approve`, {
        method: 'POST',
        body: JSON.stringify({ note: note ?? '' }),
    });
}

export async function rejectSalaryReport(reportId: string, note?: string): Promise<SalaryReportDto> {
    return fetchWithAuth(`${API_BASE_URL}/salary/reports/${reportId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note: note ?? '' }),
    });
}

async function downloadBlobWithAuth(url: string, filename: string): Promise<void> {
    const token = getAuthToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401) {
        logout();
        window.location.href = '/';
        throw new Error('Session expired');
    }
    if (!response.ok) {
        const text = await response.text().catch(() => '');
        let msg = `Download failed (${response.status})`;
        if (text.trim()) {
            try {
                const j = JSON.parse(text) as { message?: string };
                if (j.message) msg = j.message;
            } catch {
                if (text.length < 240) msg = text;
            }
        }
        throw new Error(msg);
    }

    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    try {
        const a = document.createElement('a');
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } finally {
        URL.revokeObjectURL(href);
    }
}

export async function downloadSalaryReportsExcel(periodKey: string): Promise<void> {
    return downloadBlobWithAuth(
        `${API_BASE_URL}/salary/reports/${periodKey}/export`,
        `salary-report-${periodKey}.xlsx`,
    );
}

export async function downloadAttendanceReportExcel(periodKey: string): Promise<void> {
    return downloadBlobWithAuth(
        `${API_BASE_URL}/attendance/export?periodKey=${encodeURIComponent(periodKey)}`,
        `attendance-report-${periodKey}.xlsx`,
    );
}

// ─── Weekly Tasks (Temp Staff) ────────────────────────────────────────────────

export interface WeeklyTaskDto {
    id: string;
    dayOfWeek: string;   // e.g. "Monday"
    timeFrom: string;    // "HH:mm" 24-hour
    timeTo: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
}

export interface NextTaskDto {
    id: string;
    title: string;
    dayOfWeek: string;
    timeFrom: string;
    timeTo: string;
    timeUntil: string;     // e.g. "45 min"
    dateTimeLabel: string; // e.g. "Today, 3:30 PM"
    isToday: boolean;
}

export async function getMyWeeklyTasks(): Promise<WeeklyTaskDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/tasks/weekly`);
}

export async function saveMyWeeklyTasks(tasks: {
    dayOfWeek: string;
    timeFrom: string;
    timeTo: string;
    title: string;
}[]): Promise<WeeklyTaskDto[]> {
    return fetchWithAuth(`${API_BASE_URL}/tasks/weekly`, {
        method: 'POST',
        body: JSON.stringify({ tasks }),
    });
}

export async function updateWeeklyTaskStatus(
    taskId: string,
    status: 'pending' | 'in_progress' | 'completed'
): Promise<WeeklyTaskDto> {
    return fetchWithAuth(`${API_BASE_URL}/tasks/weekly/${taskId}/status?status=${status}`, {
        method: 'PUT',
    });
}

export async function getMyNextTask(): Promise<NextTaskDto | null> {
    const token = getAuthToken();
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/tasks/weekly/next`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (response.status === 401) { logout(); window.location.href = '/'; return null; }
    if (response.status === 204 || response.status === 404) return null;
    if (!response.ok) return null;
    const data = await response.json();
    return data ?? null;
}
