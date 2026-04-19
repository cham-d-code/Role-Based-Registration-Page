import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FlaskConical,
  BellRing,
  User as UserIcon,
  Settings,
  LogOut,
  Mail,
  Phone,
  Edit,
  ChevronDown,
  Clock,
  Plus,
  Eye,
  Trash2,
  FileText,
  Calendar,
  ClipboardList,
  Loader2,
  Wifi,
  UserCheck,
} from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import StructuredJobDescriptionPage from './StructuredJobDescriptionPage';
import DashboardIdentityCard from './DashboardIdentityCard';
import InterviewMarkingPage from './InterviewMarkingPage';
import ResearchDetailsDialog from './ResearchDetailsDialog';
import AddResearchDialog from './AddResearchDialog';
import EditResearchDialog from './EditResearchDialog';
import EditProfileDialog from './EditProfileDialog';
import DeleteAccountDialog from './DeleteAccountDialog';
import StaffProfileDialog from './StaffProfileDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';
import { createResearchOpportunity, deleteResearchOpportunity, getActiveSession, getInterviews, getInterviewCandidates, getJobDescriptionForStaff, getMarkingScheme, getMentorDashboardStats, getMyMentees, getMyNotifications, getMyResearchOpportunities, getUnreadNotificationCount, markAllNotificationsRead, MarkingSchemeData, MentorDashboardStats, ResearchOpportunityDto, SessionState, updateMyProfile, updateResearchOpportunity, UserNotificationDto, UserProfile, type InterviewData, type CandidateData } from '../services/api';

interface MentorProfileProps {
  onLogout?: () => void;
}

function countDistinctOpportunitiesFromResearchApplied(notifs: UserNotificationDto[]): number {
  const oppIds = new Set<string>();
  for (const n of notifs) {
    if (n.type === 'research_applied' && n.relatedOpportunityId) {
      oppIds.add(n.relatedOpportunityId);
    }
  }
  return oppIds.size;
}

interface Mentee {
  id: string;
  name: string;
  email: string;
  phone: string;
  module: string;
  contractExpiry: string;
  tasksCompleted: number;
  lastActivity: string;
  jobDescription: {
    staffId: string;
    staffName: string;
    tasks: Array<{
      id: string;
      description: string;
      type: 'academic' | 'administrative';
    }>;
    createdDate: string;
    createdBy: string;
  };
}

export default function MentorProfile({ onLogout }: MentorProfileProps = {}) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [selectedMenteeJd, setSelectedMenteeJd] = useState<any | null>(null);
  const [showMenteeJdPage, setShowMenteeJdPage] = useState(false);
  const [loadingMenteeJd, setLoadingMenteeJd] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'interviewMarking'>('main');
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<any>(null);
  const [showAddResearchDialog, setShowAddResearchDialog] = useState(false);
  const [showEditResearchDialog, setShowEditResearchDialog] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editSpecOpen, setEditSpecOpen] = useState(false);
  const [specializationText, setSpecializationText] = useState('');
  const [savingSpec, setSavingSpec] = useState(false);
  const [myResearch, setMyResearch] = useState<ResearchOpportunityDto[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(false);
  // Number of my research opportunities that have at least one pending (unaccepted) application.
  const [pendingResearchApplicationsCount, setPendingResearchApplicationsCount] = useState(0);
  const [myMentees, setMyMentees] = useState<UserProfile[]>([]);
  const [showStaffProfileDialog, setShowStaffProfileDialog] = useState(false);
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<{ id: string; name: string } | null>(null);
  const [loadingMentees, setLoadingMentees] = useState(false);
  const [mentorDashboardStats, setMentorDashboardStats] = useState<MentorDashboardStats>({
    menteesCount: 0,
    activeResearchPosts: 0,
    pendingResearchApplicants: 0,
    upcomingInterviewRounds: 0,
  });
  const [reminderNotifications, setReminderNotifications] = useState<UserNotificationDto[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [inboxNotifications, setInboxNotifications] = useState<UserNotificationDto[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    avatarUrl: '',
    initials: '...',
    specialization: '',
  });

  // Live session polling
  const [liveSession, setLiveSession] = useState<SessionState | null>(null);
  // Marking scheme fetched from backend when active in a session
  const [markingScheme, setMarkingScheme] = useState<MarkingSchemeData | null>(null);
  const [loadingScheme, setLoadingScheme] = useState(false);
  // Candidates for the live interview (admitted markers)
  const [liveCandidates, setLiveCandidates] = useState<
    { id: string; displayId?: string; name: string; email: string; phone: string; cvUrl?: string }[]
  >([]);
  const [waitingRoomCandidates, setWaitingRoomCandidates] = useState<
    { id: string; displayId?: string; name: string; email: string; phone: string; cvUrl?: string }[]
  >([]);
  const [loadingWaitingCandidates, setLoadingWaitingCandidates] = useState(false);

  const [portalInterviews, setPortalInterviews] = useState<InterviewData[]>([]);
  const [loadingPortalInterviews, setLoadingPortalInterviews] = useState(false);
  const [portalCandidates, setPortalCandidates] = useState<Record<string, CandidateData[]>>({});
  const [loadingPortalCandidatesFor, setLoadingPortalCandidatesFor] = useState<string | null>(null);
  const portalCandidatesRef = useRef<Record<string, CandidateData[]>>({});
  portalCandidatesRef.current = portalCandidates;

  // Fetch profile on mount
  useEffect(() => {
    import('../services/api').then(api => {
      api.getUserProfile()
        .then(profile => {
          const initials = profile.fullName
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0].toUpperCase())
            .slice(0, 2)
            .join('');
          setProfileData({
            name: profile.fullName,
            email: profile.email,
            phone: profile.mobile || '',
            avatarUrl: profile.profileImageUrl || '',
            initials,
            specialization: (profile as any).specialization || '',
          });
          setSpecializationText((profile as any).specialization || '');
        })
        .catch(() => {
          const local = api.getCurrentUser();
          if (local) {
            const initials = local.fullName
              .split(' ')
              .filter(Boolean)
              .map((n: string) => n[0].toUpperCase())
              .slice(0, 2)
              .join('');
            setProfileData(prev => ({ ...prev, name: local.fullName, email: local.email, initials }));
          }
        });
    });
  }, []);

  // Poll backend for live session every 5s (mentor/HOD waiting room + marking)
  useEffect(() => {
    const check = async () => {
      try {
        setLiveSession(await getActiveSession());
      } catch {
        /* ignore */
      }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // Refresh session immediately when opening Interview Portal (don’t wait for next poll)
  useEffect(() => {
    if (activeMenu !== 'interview') return;
    void (async () => {
      try {
        setLiveSession(await getActiveSession());
      } catch {
        /* ignore */
      }
    })();
  }, [activeMenu]);

  // Active: scheme + candidates for marking. Waiting: candidates only (read-only) until coordinator admits.
  useEffect(() => {
    if (!liveSession?.interviewId) {
      setMarkingScheme(null);
      setLiveCandidates([]);
      setWaitingRoomCandidates([]);
      return;
    }
    if (liveSession.myStatus === 'active') {
      setWaitingRoomCandidates([]);
      setLoadingScheme(true);
      Promise.all([
        getMarkingScheme(liveSession.interviewId),
        getInterviewCandidates(liveSession.interviewId),
      ])
        .then(([scheme, cands]) => {
          setMarkingScheme(scheme);
          setLiveCandidates(cands.map(c => ({
            id: c.id,
            displayId: c.candidateId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            cvUrl: c.cvUrl,
          })));
        })
        .catch(e => console.error('Failed to load scheme/candidates', e))
        .finally(() => setLoadingScheme(false));
    } else if (liveSession.myStatus === 'waiting') {
      setMarkingScheme(null);
      setLiveCandidates([]);
      setLoadingWaitingCandidates(true);
      getInterviewCandidates(liveSession.interviewId)
        .then((cands) =>
          setWaitingRoomCandidates(
            cands.map((c) => ({
              id: c.id,
              displayId: c.candidateId,
              name: c.name,
              email: c.email,
              phone: c.phone,
              cvUrl: c.cvUrl,
            }))
          )
        )
        .catch((e) => console.error('Failed to load candidates for waiting room', e))
        .finally(() => setLoadingWaitingCandidates(false));
    } else {
      setMarkingScheme(null);
      setLiveCandidates([]);
      setWaitingRoomCandidates([]);
    }
  }, [liveSession?.interviewId, liveSession?.myStatus]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'mentees', label: 'My Mentees', icon: Users },
    { id: 'interview', label: 'Interview Portal', icon: ClipboardCheck },
    { id: 'research', label: 'Research Opportunities', icon: FlaskConical },
    { id: 'notifications', label: 'Notifications', icon: BellRing },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  // Dashboard: backend stats + reminder-only notifications (contract / interview / monthly review)
  useEffect(() => {
    if (activeMenu !== 'dashboard') return;
    let mounted = true;
    const load = async () => {
      try {
        const [stats, reminders] = await Promise.all([
          getMentorDashboardStats(),
          getMyNotifications(false, 'reminders').catch(() => [] as UserNotificationDto[]),
        ]);
        if (!mounted) return;
        setMentorDashboardStats(stats);
        setReminderNotifications(reminders.slice(0, 20));
      } catch (e) {
        console.error('Failed to load mentor dashboard', e);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeMenu]);

  const mentorStats = [
    { label: 'Total Mentees Assigned', value: String(mentorDashboardStats.menteesCount), color: '#222222' },
    { label: 'Active Research Posts', value: String(mentorDashboardStats.activeResearchPosts), color: '#222222' },
    {
      label: 'Pending Research Applicants',
      value: String(mentorDashboardStats.pendingResearchApplicants),
      color: mentorDashboardStats.pendingResearchApplicants > 0 ? '#f7a541' : '#222222',
    },
  ];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Sidebar badge: show any unread notifications (inbox + reminders)
        const count = await getUnreadNotificationCount();
        if (mounted) setUnreadNotificationCount(count);
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (activeMenu !== 'notifications') return;
    let cancelled = false;
    (async () => {
      setLoadingNotifications(true);
      try {
        const items = await getMyNotifications(false, 'inbox');
        if (!cancelled) setInboxNotifications(items);
        // When opening Notifications tab, clear ALL unread so the sidebar badge disappears.
        await markAllNotificationsRead().catch(() => undefined);
        if (!cancelled) setUnreadNotificationCount(0);
      } catch (e) {
        console.error('Failed to load notifications', e);
        if (!cancelled) setInboxNotifications([]);
      } finally {
        if (!cancelled) setLoadingNotifications(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'mentees') return;
    setLoadingMentees(true);
    getMyMentees()
      .then(setMyMentees)
      .catch((e) => {
        console.error('Failed to load mentees', e);
        setMyMentees([]);
      })
      .finally(() => setLoadingMentees(false));
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'research') return;
    setLoadingResearch(true);
    getMyResearchOpportunities()
      .then(setMyResearch)
      .catch((e) => console.error('Failed to load research opportunities', e))
      .finally(() => setLoadingResearch(false));
  }, [activeMenu]);

  const refreshPendingResearchSidebarBadge = useCallback(async () => {
    try {
      const notifs = await getMyNotifications(true, 'inbox');
      setPendingResearchApplicationsCount(countDistinctOpportunitiesFromResearchApplied(notifs));
    } catch {
      // ignore
    }
  }, []);

  const refreshAfterResearchApplicationDecision = useCallback(async () => {
    await refreshPendingResearchSidebarBadge();
    try {
      const stats = await getMentorDashboardStats();
      setMentorDashboardStats(stats);
    } catch {
      // ignore
    }
  }, [refreshPendingResearchSidebarBadge]);

  // Red badge for pending research applications — distinct opportunities with unread research_applied inbox notifications.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const notifs = await getMyNotifications(true, 'inbox');
        if (mounted) setPendingResearchApplicationsCount(countDistinctOpportunitiesFromResearchApplied(notifs));
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const parseLocalDate = (isoDate: string) => {
    // Backend sends LocalDate like "2026-10-14". Parsing with new Date(string) can shift by timezone.
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const loadPortalCandidates = useCallback(async (interviewId: string) => {
    if (portalCandidatesRef.current[interviewId]) return;
    setLoadingPortalCandidatesFor(interviewId);
    try {
      const rows = await getInterviewCandidates(interviewId);
      setPortalCandidates((prev) => ({ ...prev, [interviewId]: rows }));
    } catch (e) {
      console.error('Failed to load interview candidates', e);
      setPortalCandidates((prev) => ({ ...prev, [interviewId]: [] }));
    } finally {
      setLoadingPortalCandidatesFor(null);
    }
  }, []);

  /** Open coordinator scheme marking (same flow as header Enter Marks / HOD Manage Interviews). */
  const handleOpenMarkingPanel = async (interview: InterviewData) => {
    if (!liveSession || String(liveSession.interviewId) !== String(interview.id) || liveSession.myStatus !== 'active') {
      return;
    }
    let scheme = markingScheme;
    if (!scheme) {
      scheme = await getMarkingScheme(interview.id).catch(() => null);
      if (scheme) setMarkingScheme(scheme);
    }
    if (!scheme) {
      alert('The coordinator has not created a marking scheme for this interview yet.');
      return;
    }
    setCurrentPage('interviewMarking');
  };

  useEffect(() => {
    if (activeMenu !== 'interview') return;
    setLoadingPortalInterviews(true);
    getInterviews()
      .then((all) => {
        const upcoming = all.filter((i) => i.status === 'upcoming');
        setPortalInterviews(upcoming);
        upcoming.forEach((i) => {
          void loadPortalCandidates(i.id);
        });
      })
      .catch((e) => {
        console.error('Failed to load interviews', e);
        setPortalInterviews([]);
      })
      .finally(() => setLoadingPortalInterviews(false));
  }, [activeMenu, loadPortalCandidates]);

  const daysUntilInterviewDate = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = parseLocalDate(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiry = parseLocalDate(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getExpiryBadgeColor = (days: number) => {
    if (days < 30) return 'bg-red-100 text-red-700 border-red-300';
    if (days < 60) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const handleProfileSave = async (updatedProfile: any) => {
    try {
      const next = await updateMyProfile({
        fullName: updatedProfile.name,
        mobile: updatedProfile.phone,
        profileImageUrl: updatedProfile.avatarUrl,
        currentPassword: updatedProfile.currentPassword,
        newPassword: updatedProfile.newPassword,
      });

      const initials = (next.fullName || '')
        .split(' ')
        .filter(Boolean)
        .map((n: string) => n[0].toUpperCase())
        .slice(0, 2)
        .join('');

      setProfileData({
        ...profileData,
        name: next.fullName,
        email: next.email,
        phone: next.mobile || '',
        avatarUrl: next.profileImageUrl || '',
        initials: initials || profileData.initials,
      });

      alert(updatedProfile.newPassword ? 'Profile & password updated successfully!' : 'Profile updated successfully!');
    } catch (e: any) {
      alert(e?.message || 'Failed to update profile');
    }
  };

  // Show interview marking page when active in a live session
  if (currentPage === 'interviewMarking' && liveSession) {
    return (
      <InterviewMarkingPage
        interview={{
          id: liveSession.interviewId,
          interviewNumber: liveSession.interviewNumber,
          date: new Date(liveSession.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        }}
        candidates={liveCandidates}
        existingScheme={markingScheme ?? undefined}
        onBack={() => setCurrentPage('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>
      {/* Decorative Background Shapes */}
      <div className="fixed top-20 right-10 w-64 h-64 bg-[#4db4ac] rounded-full opacity-5 blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 left-10 w-96 h-96 bg-[#4db4ac] rounded-full opacity-5 blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="fixed top-0 left-0 right-0 bg-[#4db4ac] text-white px-8 py-4 flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-3">
          <h1 className="tracking-wide" style={{ fontSize: '20px', fontWeight: 700 }}>
            Temporary Staff Coordination System
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity">
            <Avatar className="h-10 w-10 border-2 border-white">
              <AvatarImage src="" alt="Dr. T. Mahanama" />
              <AvatarFallback className="bg-white text-[#4db4ac]" style={{ fontWeight: 600 }}>TM</AvatarFallback>
            </Avatar>
            <ChevronDown className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg rounded-lg border-0">
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f9f9f9] py-2">
              <UserIcon className="mr-2 h-4 w-4 text-[#4db4ac]" />
              <span className="text-[#222222]">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f9f9f9] py-2">
              <Settings className="mr-2 h-4 w-4 text-[#4db4ac]" />
              <span className="text-[#222222]">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer hover:bg-[#f9f9f9] py-2 text-red-600 focus:text-red-600"
              onClick={() => setDeleteAccountDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete my account</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f9f9f9] py-2" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <DeleteAccountDialog open={deleteAccountDialogOpen} onOpenChange={setDeleteAccountDialogOpen} />

      <div className="flex pt-16">
        {/* Left Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg overflow-y-auto z-10">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#4db4ac] text-white'
                    : 'text-[#555555] hover:bg-[#f0f0f0]'
                    }`}
                  style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-left">
                    {item.label}
                  </span>
                  {item.id === 'research' && pendingResearchApplicationsCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center text-white ml-auto"
                      style={{
                        backgroundColor: '#dc2626',
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        fontSize: '11px',
                        fontWeight: 700,
                        lineHeight: 1,
                      }}
                    >
                      {Math.min(pendingResearchApplicationsCount, 99)}
                    </span>
                  )}
                  {item.id === 'notifications' && unreadNotificationCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center text-white ml-auto"
                      style={{
                        backgroundColor: '#ef4444',
                        fontSize: '11px',
                        fontWeight: 700,
                        width: 20,
                        height: 20,
                        borderRadius: 9999,
                        lineHeight: 1,
                      }}
                    >
                      {Math.min(unreadNotificationCount, 99)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-6 space-y-6 relative z-10">
          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Profile Card */}
              <DashboardIdentityCard
                name={profileData.name}
                initials={profileData.initials}
                avatarUrl={profileData.avatarUrl}
                roleTitle="Senior Lecturer (Mentor)"
                department="Department of Industrial Management"
                email={profileData.email}
                phone={profileData.phone}
              />

              {/* Mentorship Summary Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mentorStats.map((stat, index) => (
                  <Card
                    key={index}
                    className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-[#4db4ac]" />
                    <div className="text-[#222222] mb-1" style={{ fontSize: '32px', fontWeight: 700, color: stat.color }}>
                      {stat.value}
                    </div>
                    <div className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 500 }}>
                      {stat.label}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Reminders (scheduled): mentee contracts, upcoming interviews, etc. — not the Notifications tab */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '18px' }}>
                    Reminders
                  </h3>
                  {reminderNotifications.length > 0 && (
                    <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                      {reminderNotifications.length}
                    </Badge>
                  )}
                </div>
                {reminderNotifications.length === 0 ? (
                  <p className="text-[#777777] py-4" style={{ fontSize: '13px' }}>
                    No reminders right now. Contract milestones for your mentees and interview countdowns appear here.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {reminderNotifications.map((n) => (
                      <div
                        key={n.id}
                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#f9f9f9] transition-colors border-l-4 border-[#4db4ac]"
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-[#e6f7f6] flex items-center justify-center">
                            <Clock className="h-4 w-4 text-[#4db4ac]" />
                          </div>
                        </div>
                        <div className="flex-1 pb-1">
                          <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                            {n.title}
                          </p>
                          <p className="text-[#555555] whitespace-pre-line mt-1" style={{ fontSize: '13px' }}>
                            {n.message}
                          </p>
                          {n.createdAt && (
                            <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}

          {/* My Mentees View */}
          {activeMenu === 'mentees' && (
            <>
              {showMenteeJdPage && selectedMentee ? (
                <StructuredJobDescriptionPage
                  staffName={(selectedMentee as any).fullName || selectedMentee.name || 'Mentee'}
                  jd={selectedMenteeJd}
                  loading={loadingMenteeJd}
                  onBack={() => setShowMenteeJdPage(false)}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                      My Mentees
                    </h2>
                    <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                      {myMentees.length} Total Mentees
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {loadingMentees && (
                      <Card className="bg-white rounded-xl border-0 p-6 text-center text-[#4db4ac]">
                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                        Loading mentees…
                      </Card>
                    )}

                    {!loadingMentees && myMentees.length === 0 && (
                      <Card className="bg-white rounded-xl border-0 p-6 text-center text-[#999999]">
                        No mentees assigned to you yet.
                      </Card>
                    )}

                    {!loadingMentees && myMentees.map((mentee: any) => {
                  const contractExpiry = mentee.contractEndDate || '';
                  const daysUntilExpiry = contractExpiry ? calculateDaysUntilExpiry(contractExpiry) : 0;
                  const expiryColor = getExpiryBadgeColor(daysUntilExpiry);

                  return (
                    <Card
                      key={mentee.id}
                      className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Mentee Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-[#4db4ac]">
                              <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
                                {String(mentee.fullName || '').split(' ').filter(Boolean).map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-[#222222] mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
                                {mentee.fullName}
                              </h3>

                              <div className="flex flex-wrap gap-3 text-[#555555]" style={{ fontSize: '13px' }}>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-[#4db4ac]" />
                                  {mentee.email}
                                </div>
                                {mentee.mobile && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-[#4db4ac]" />
                                    {mentee.mobile}
                                  </div>
                                )}
                              </div>

                              {Array.isArray(mentee.preferredSubjects) && mentee.preferredSubjects.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-3">
                                  {mentee.preferredSubjects.slice(0, 6).map((s: string, idx: number) => (
                                    <Badge key={idx} className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]" style={{ fontSize: '11px' }}>
                                      {s}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contract Expiry & Actions */}
                        <div className="lg:w-64 space-y-3">
                          {/* Contract Expiry Countdown */}
                          <Card className={`${expiryColor} border p-4 rounded-lg`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4" />
                              <p style={{ fontSize: '12px', fontWeight: 600 }}>
                                Contract Expiry
                              </p>
                            </div>
                          {contractExpiry ? (
                            <>
                              <p style={{ fontSize: '24px', fontWeight: 700 }}>
                                {Math.abs(daysUntilExpiry)} days
                              </p>
                              <p style={{ fontSize: '11px' }} className="mt-1">
                                Expires: {parseLocalDate(contractExpiry).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              <Progress
                                value={Math.max(0, Math.min(100, (daysUntilExpiry / 90) * 100))}
                                className="h-2 mt-2"
                              />
                            </>
                          ) : (
                            <p className="text-[#999999]" style={{ fontSize: '12px' }}>—</p>
                          )}
                          </Card>

                          {/* Action Button */}
                          <Button
                            className="w-full bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                            onClick={() => {
                              setSelectedMentee(mentee as any);
                              setSelectedMenteeJd(null);
                              setShowMenteeJdPage(true);
                              setLoadingMenteeJd(true);
                              getJobDescriptionForStaff((mentee as any).id)
                                .then((dto) => {
                                  try {
                                    const parsed = dto?.content ? JSON.parse(dto.content) : null;
                                    setSelectedMenteeJd(parsed);
                                  } catch (e) {
                                    console.error('Failed to parse mentee JD content', e);
                                    setSelectedMenteeJd(null);
                                  }
                                })
                                .catch((e) => {
                                  console.error('Failed to load mentee JD', e);
                                  setSelectedMenteeJd(null);
                                })
                                .finally(() => setLoadingMenteeJd(false));
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            View Job Description
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white"
                            onClick={() => {
                              setSelectedStaffForProfile({ id: (mentee as any).id, name: (mentee as any).fullName });
                              setShowStaffProfileDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                  </div>
                </>
              )}
            </>
          )}

          {/* Interview Portal View */}
          {activeMenu === 'interview' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                    Interview Portal
                  </h2>
                  {liveSession?.myStatus === 'active' && (
                    <Badge className="bg-green-100 text-green-800 border border-green-300" style={{ fontSize: '11px' }}>
                      LIVE · {liveSession.interviewNumber}
                    </Badge>
                  )}
                  {liveSession?.myStatus === 'waiting' && (
                    <Badge className="bg-amber-100 text-amber-900 border border-amber-300" style={{ fontSize: '11px' }}>
                      Waiting room · {liveSession.interviewNumber}
                    </Badge>
                  )}
                </div>
                {liveSession?.myStatus === 'active' && (
                  <div className="flex items-center gap-2">
                    {loadingScheme ? (
                      <div className="flex items-center gap-2 text-[#555555] text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-[#4db4ac]" />
                        Loading…
                      </div>
                    ) : (
                      <Button
                        className="bg-[#222222] hover:bg-neutral-800 text-white font-semibold disabled:opacity-60"
                        disabled={!markingScheme}
                        onClick={() => markingScheme && setCurrentPage('interviewMarking')}
                      >
                        <ClipboardList className="h-4 w-4 mr-2" />
                        {markingScheme ? 'Enter Marks' : 'Waiting for marking scheme'}
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {liveSession?.myStatus === 'removed' && (
                <p className="text-red-600 text-sm mb-4">
                  You are no longer on the panel for {liveSession.interviewNumber}.
                </p>
              )}

              {loadingPortalInterviews && (
                <div className="flex items-center justify-center py-12 gap-2 text-[#4db4ac]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span style={{ fontSize: '14px' }}>Loading interviews…</span>
                </div>
              )}

              {!loadingPortalInterviews && portalInterviews.length === 0 && !liveSession && (
                <Card className="p-8 text-center border border-[#e0e0e0] rounded-xl">
                  <Calendar className="h-10 w-10 text-[#d0d0d0] mx-auto mb-2" />
                  <p className="text-[#999999]" style={{ fontSize: '14px' }}>
                    No upcoming interviews from the server yet.
                  </p>
                </Card>
              )}

              {!loadingPortalInterviews &&
                portalInterviews.map((interview) => {
                  const candidates = portalCandidates[interview.id] ?? [];
                  const loadingC = loadingPortalCandidatesFor === interview.id;
                  const days = daysUntilInterviewDate(interview.date);
                  const sessionLiveHere =
                    !!liveSession && String(liveSession.interviewId) === String(interview.id);

                  return (
                    <Card key={interview.id} className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-6 w-6 text-[#4db4ac]" />
                          <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                            {interview.interviewNumber} — {sessionLiveHere ? 'Live Interview' : 'Upcoming Interview'}
                          </h3>
                          {sessionLiveHere ? (
                            <Badge className="bg-green-600 text-white border-0 flex items-center gap-1" style={{ fontSize: '12px' }}>
                              <Wifi className="h-3 w-3" />
                              LIVE
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                              UPCOMING
                            </Badge>
                          )}
                        </div>
                        {sessionLiveHere && liveSession?.myStatus === 'active' && (
                          <Button
                            variant="outline"
                            className="border-neutral-900 bg-white text-neutral-900 hover:bg-neutral-100 font-semibold shadow-sm"
                            disabled={loadingScheme}
                            onClick={() => handleOpenMarkingPanel(interview)}
                          >
                            {loadingScheme ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Mark Candidates
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <Separator className="mb-4" />

                      <div className="space-y-4">
                        <Card className="border-2 border-[#4db4ac] rounded-lg p-4 bg-[#e6f7f6]">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-5 w-5 text-[#4db4ac]" />
                                <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                                  Interview Date
                                </p>
                              </div>
                              <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>
                                {parseLocalDate(interview.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <p className="text-[#555555] max-w-md text-right" style={{ fontSize: '12px' }}>
                              {sessionLiveHere
                                ? liveSession?.myStatus === 'active'
                                  ? 'You are admitted — use Mark Candidates (above) or Enter Marks in the page header to score using the coordinator’s scheme.'
                                  : 'Session is live — waiting room until the coordinator admits you.'
                                : 'When the coordinator starts this interview, it will show as LIVE here and in the page header.'}
                            </p>
                          </div>
                        </Card>

                        <div className="grid grid-cols-3 gap-4">
                          <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                            <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                              Total Candidates
                            </p>
                            <p className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                              {interview.candidateCount}
                            </p>
                          </Card>
                          <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                            <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                              Interview Status
                            </p>
                            {sessionLiveHere ? (
                              <div className="space-y-1">
                                <Badge className="bg-green-600 text-white border-0 flex items-center gap-1 w-fit" style={{ fontSize: '12px' }}>
                                  <Wifi className="h-3 w-3" />
                                  LIVE
                                </Badge>
                                {liveSession && (
                                  <p className="text-[#555555] text-xs">
                                    {liveSession.myStatus === 'active'
                                      ? 'Admitted — you can mark'
                                      : liveSession.myStatus === 'waiting'
                                        ? 'Waiting room'
                                        : 'Removed'}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                                UPCOMING
                              </Badge>
                            )}
                          </Card>
                          <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                            <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                              Days Until Interview
                            </p>
                            <p className={`${days < 7 ? 'text-red-500' : 'text-[#4db4ac]'}`} style={{ fontSize: '24px', fontWeight: 700 }}>
                              {days > 0 ? days : 0}
                            </p>
                          </Card>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-5 w-5 text-[#4db4ac]" />
                            <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                              Candidates for This Interview
                            </h4>
                            <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                              {candidates.length}
                            </Badge>
                          </div>

                          {loadingC ? (
                            <div className="flex items-center gap-2 py-8 justify-center text-[#4db4ac]">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span style={{ fontSize: '13px' }}>Loading candidates…</span>
                            </div>
                          ) : candidates.length === 0 ? (
                            <div className="text-center py-8 border border-[#e0e0e0] rounded-lg">
                              <Users className="h-8 w-8 text-[#d0d0d0] mx-auto mb-2" />
                              <p className="text-[#999999]" style={{ fontSize: '13px' }}>
                                No candidates for this interview yet.
                              </p>
                            </div>
                          ) : (
                            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow className="bg-[#f9f9f9]">
                                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>#</TableHead>
                                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Candidate ID</TableHead>
                                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Name</TableHead>
                                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Email</TableHead>
                                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>Phone</TableHead>
                                    <TableHead className="text-[#222222] py-2" style={{ fontWeight: 600 }}>CV</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {candidates.map((candidate, index) => (
                                    <TableRow key={candidate.id}>
                                      <TableCell className="text-[#555555] py-2" style={{ fontSize: '13px' }}>
                                        {index + 1}
                                      </TableCell>
                                      <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 500 }}>
                                        {candidate.candidateId || candidate.id || '—'}
                                      </TableCell>
                                      <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 600 }}>
                                        {candidate.name}
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                                          <Mail className="h-3 w-3 text-[#4db4ac]" />
                                          {candidate.email}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <div className="flex items-center gap-1 text-[#555555]" style={{ fontSize: '12px' }}>
                                          <Phone className="h-3 w-3 text-[#4db4ac]" />
                                          {candidate.phone}
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                                          disabled={!candidate.cvUrl}
                                          onClick={() => {
                                            if (candidate.cvUrl) window.open(candidate.cvUrl, '_blank', 'noopener,noreferrer');
                                            else alert('No CV link for this candidate.');
                                          }}
                                        >
                                          <FileText className="h-3 w-3 mr-1" />
                                          View CV
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </>
          )}

          {/* Research Opportunities View */}
          {activeMenu === 'research' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Research Opportunities
                </h2>
                <Button
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
                  style={{ fontWeight: 600 }}
                  onClick={() => setShowAddResearchDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Research
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {loadingResearch && (
                  <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 text-center text-[#4db4ac]">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading research opportunities…
                  </Card>
                )}

                {!loadingResearch && myResearch.map((research) => (
                  <Card key={research.id} className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[#222222] flex-1" style={{ fontSize: '18px', fontWeight: 600 }}>
                        {research.title}
                      </h4>
                      <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '11px' }}>
                        {research.applicantsCount ?? 0} applicants
                      </Badge>
                    </div>

                    <p className="text-[#555555] mb-4" style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {research.description || ''}
                    </p>

                    <div className="flex justify-between items-center">
                      <span className="text-[#777777]" style={{ fontSize: '12px' }}>
                        {research.createdAt ? `Posted: ${new Date(research.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white rounded-lg"
                          onClick={() => {
                            setSelectedResearch(research);
                            setShowResearchDialog(true);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white rounded-lg"
                          onClick={() => {
                            setSelectedResearch(research);
                            setShowEditResearchDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-400 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"
                          onClick={async () => {
                            if (!confirm('Delete this research opportunity?')) return;
                            try {
                              await deleteResearchOpportunity(research.id);
                              setMyResearch(prev => prev.filter(r => r.id !== research.id));
                            } catch (e: any) {
                              alert(`Delete failed: ${e?.message || 'Unknown error'}`);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Notifications View — inbox only (excludes dashboard reminders) */}
          {activeMenu === 'notifications' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Notifications
                </h2>
                <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                  {inboxNotifications.length} total
                </Badge>
              </div>

              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 mb-6">
                {loadingNotifications ? (
                  <div className="flex items-center gap-2 text-[#777777]" style={{ fontSize: '14px' }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading notifications…
                  </div>
                ) : inboxNotifications.length === 0 ? (
                  <p className="text-[#777777] py-6 text-center" style={{ fontSize: '14px' }}>
                    You have no notifications. Mentor assignments, research applications, and interview scheduling
                    updates appear here. Reminders stay on your dashboard.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {inboxNotifications.map((n) => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-4 p-3 rounded-lg border-l-4 transition-colors ${
                          n.isRead
                            ? 'border-[#e0e0e0] hover:bg-[#f9f9f9]'
                            : 'border-[#4db4ac] bg-[#f0fbfa]'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <div className="h-8 w-8 rounded-full bg-[#e6f7f6] flex items-center justify-center">
                            <BellRing className="h-4 w-4 text-[#4db4ac]" />
                          </div>
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                              {n.title}
                            </p>
                            {!n.isRead && (
                              <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '10px' }}>
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-[#555555] whitespace-pre-line mt-1" style={{ fontSize: '13px' }}>
                            {n.message}
                          </p>
                          {n.createdAt && (
                            <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                              {new Date(n.createdAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="text-[#999999] pt-3 text-center" style={{ fontSize: '12px' }}>
                      Notifications are automatically removed after 7 days.
                    </p>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* Profile View */}
          {activeMenu === 'profile' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  My Profile
                </h2>
              </div>

              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-start gap-6 mb-6">
                  <Avatar className="h-32 w-32 border-4 border-[#4db4ac]">
                    <AvatarImage src={profileData.avatarUrl} alt={profileData.name} />
                    <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '40px' }}>
                      {profileData.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h2 className="text-[#222222] mb-1" style={{ fontWeight: 700, fontSize: '28px' }}>
                      {profileData.name}
                    </h2>
                    <p className="text-[#4db4ac] mb-2" style={{ fontWeight: 600, fontSize: '18px' }}>
                      Senior Lecturer (Mentor)
                    </p>
                    <p className="text-[#555555] mb-4" style={{ fontSize: '14px' }}>
                      Department of Industrial Management
                    </p>
                  </div>
                </div>

                <Separator className="mb-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[#222222] mb-4" style={{ fontWeight: 600, fontSize: '16px' }}>
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-[#555555]" style={{ fontSize: '14px' }}>
                        <Mail className="h-5 w-5 text-[#4db4ac]" />
                        <span>{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[#555555]" style={{ fontSize: '14px' }}>
                        <Phone className="h-5 w-5 text-[#4db4ac]" />
                        <span>{profileData.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <h3 className="text-[#222222]" style={{ fontWeight: 600, fontSize: '16px' }}>
                        Specialization Areas
                      </h3>
                      <Button
                        variant="outline"
                        className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                        onClick={() => setEditSpecOpen(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>

                    {profileData.specialization ? (
                      <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                        {profileData.specialization}
                      </p>
                    ) : (
                      <p className="text-[#999999]" style={{ fontSize: '13px' }}>
                        —
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-6" />

                <Button
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg px-6 py-2"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Card>
            </>
          )}
        </main>

        {/* Right Sidebar - removed as requested */}
      </div>

      {/* Dialogs */}

      {selectedResearch && (
        <ResearchDetailsDialog
          open={showResearchDialog}
          onOpenChange={setShowResearchDialog}
          research={selectedResearch}
          onApplicationDecided={refreshAfterResearchApplicationDecision}
        />
      )}

      <EditResearchDialog
        open={showEditResearchDialog}
        onOpenChange={setShowEditResearchDialog}
        research={selectedResearch}
        onSubmit={async (updates) => {
          if (!selectedResearch?.id) return;
          try {
            const updated = await updateResearchOpportunity(selectedResearch.id, updates);
            setMyResearch(prev => prev.map(r => r.id === updated.id ? updated : r));
            setSelectedResearch(updated);
          } catch (e: any) {
            alert(`Edit failed: ${e?.message || 'Unknown error'}`);
          }
        }}
      />

      <AddResearchDialog
        open={showAddResearchDialog}
        onOpenChange={setShowAddResearchDialog}
        onSubmit={async (researchData) => {
          try {
            const created = await createResearchOpportunity({
              title: researchData.title,
              description: researchData.description,
            });
            setMyResearch(prev => [created, ...prev]);
          } catch (e: any) {
            alert(`Create failed: ${e?.message || 'Unknown error'}`);
          }
        }}
      />

      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        currentProfile={profileData}
        onSave={handleProfileSave}
      />

      {/* Staff Profile Dialog (used by My Mentees view) */}
      <StaffProfileDialog
        open={showStaffProfileDialog}
        onOpenChange={setShowStaffProfileDialog}
        staffId={selectedStaffForProfile?.id ?? null}
        fallbackName={selectedStaffForProfile?.name}
      />

      <Dialog open={editSpecOpen} onOpenChange={setEditSpecOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
              Edit Specialization Areas
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-[#555555]" style={{ fontSize: '13px' }}>
              Add your areas separated by commas.
            </div>

            <Textarea
              value={specializationText}
              onChange={(e) => setSpecializationText(e.target.value)}
              className="min-h-[120px] border-[#e0e0e0] focus:border-[#4db4ac]"
              placeholder="e.g., Data Science, Machine Learning, Business Intelligence"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSpecializationText(profileData.specialization || '');
                  setEditSpecOpen(false);
                }}
                disabled={savingSpec}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                disabled={savingSpec}
                onClick={async () => {
                  setSavingSpec(true);
                  try {
                    const api = await import('../services/api');
                    const updated = await api.updateMySpecialization(specializationText);
                    const nextSpec = (updated as any).specialization || '';
                    setProfileData((prev) => ({ ...prev, specialization: nextSpec }));
                    setSpecializationText(nextSpec);
                    setEditSpecOpen(false);
                  } finally {
                    setSavingSpec(false);
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}