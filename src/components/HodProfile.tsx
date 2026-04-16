import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, ClipboardCheck, FileText, BellRing, UserIcon, ChevronDown, Settings, LogOut, Mail, Phone, Calendar, Eye, Clock, Archive, Edit, DollarSign, CheckCircle, XCircle, BarChart2, Loader2, Plus } from 'lucide-react';
import { approveLeave, createResearchOpportunity, deleteResearchOpportunity, getInterviewReport, getJobDescriptionForStaff, getMyMentees, getMyLeaveRequests, getMyNotifications, getMyResearchOpportunities, getPendingLeaveRequests, markNotificationRead, rejectLeave, InterviewReport, ResearchOpportunityDto, updateMyProfile, updateResearchOpportunity, UserProfile, type LeaveRequestDto, type UserNotificationDto } from '../services/api';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import AttendanceSummaryDialog from './AttendanceSummaryDialog';
import SalaryReportsDialog from './SalaryReportsDialog';
import ArchivedStaffDialog from './ArchivedStaffDialog';
import SystemNotices from './SystemNotices';
import SendNoticeDialog from './SendNoticeDialog';
import HodEndedInterviewApprovalPage from './HodEndedInterviewApprovalPage';
import HodManageInterviewsPage from './HodManageInterviewsPage';
import AttendanceAndSalariesPage from './AttendanceAndSalariesPage';
import EditProfileDialog from './EditProfileDialog';
import ResearchDetailsDialog from './ResearchDetailsDialog';
import AddResearchDialog from './AddResearchDialog';
import EditResearchDialog from './EditResearchDialog';
import StructuredJobDescriptionPage from './StructuredJobDescriptionPage';

interface HodProfileProps {
  onLogout: () => void;
}

function formatPostedDate(input?: string | null): string {
  if (!input) return '';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export default function HodProfile({ onLogout }: HodProfileProps) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [attendanceSummaryOpen, setAttendanceSummaryOpen] = useState(false);
  const [salaryReportsOpen, setSalaryReportsOpen] = useState(false);
  const [archivedStaffOpen, setArchivedStaffOpen] = useState(false);
  const [sendNoticeOpen, setSendNoticeOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'approvalPage' | 'manageInterviews' | 'attendanceSalaries'>('dashboard');
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [selectedStaffForJd, setSelectedStaffForJd] = useState<any>(null);
  const [showStaffJdPage, setShowStaffJdPage] = useState(false);
  const [selectedStaffJd, setSelectedStaffJd] = useState<any | null>(null);
  const [loadingStaffJd, setLoadingStaffJd] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    avatarUrl: '',
    initials: '...'
  });
  // Interview report state
  const [reportData, setReportData] = useState<InterviewReport | null>(null);
  const [reportInterviewId, setReportInterviewId] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportError, setReportError] = useState('');

  // Research + Mentees (backend)
  const [myResearch, setMyResearch] = useState<ResearchOpportunityDto[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [newResearchCount, setNewResearchCount] = useState(0);
  const [showAddResearchDialog, setShowAddResearchDialog] = useState(false);
  const [showEditResearchDialog, setShowEditResearchDialog] = useState(false);
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<ResearchOpportunityDto | null>(null);

  const [myMentees, setMyMentees] = useState<UserProfile[]>([]);
  const [loadingMentees, setLoadingMentees] = useState(false);

  // Leave approvals (pending)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [loadingLeaveApprovals, setLoadingLeaveApprovals] = useState(false);

  // Fetch real profile data from backend on mount
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
            initials
          });
        })
        .catch(() => {
          // Fallback to localStorage
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

  // Temporary Staff — loaded from backend
  const [temporaryStaff, setTemporaryStaff] = useState<{
    id: string;
    name: string;
    email: string;
    phone?: string;
    contractStartDate?: string;
    contractEndDate?: string;
  }[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [contractFilter, setContractFilter] = useState<'all' | 'expired' | 'remaining'>('all');

  // Registration requests data
  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);

  // Fetch staff list from backend
  useEffect(() => {
    if (activeMenu === 'staff') {
      setLoadingStaff(true);
      import('../services/api').then(api => {
        api.getApprovedStaff()
          .then(data => {
            setTemporaryStaff(data.map(u => ({
              id: u.id,
              name: u.fullName,
              email: u.email,
              phone: u.mobile,
              contractStartDate: u.contractStartDate,
              contractEndDate: u.contractEndDate,
            })));
          })
          .catch(err => console.error('Failed to fetch staff:', err))
          .finally(() => setLoadingStaff(false));
      });
    }
  }, [activeMenu]);

  // Fetch pending requests
  useEffect(() => {
    if (activeMenu === 'approve') {
      import('../services/api').then(api => {
        api.getPendingRegistrations()
          .then(data => {
            // Transform API data to match UI expected format if needed
            // The API returns PendingUserResponse: { id, email, fullName, mobile, role, createdAt }
            const formattedData = data.map(user => ({
              id: user.id,
              name: user.fullName,
              email: user.email,
              phone: user.mobile,
              role: user.role,
              submittedDate: new Date(user.createdAt).toLocaleDateString(),
              status: 'pending'
            }));
            setRegistrationRequests(formattedData);
          })
          .catch(err => console.error("Failed to fetch pending registrations:", err));
      });
    }
  }, [activeMenu]);

  // Approve/Reject registration handlers
  // Approve/Reject registration handlers
  const handleApproveRequest = async (id: string) => {
    try {
      const api = await import('../services/api');
      await api.approveUser(id);

      setRegistrationRequests(prev =>
        prev.map(req => req.id === id ? { ...req, status: 'approved' } : req)
      );
      alert('Registration request approved successfully!');

      // Refresh list
      const data = await api.getPendingRegistrations();
      const formattedData = data.map(user => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        phone: user.mobile,
        role: user.role,
        submittedDate: new Date(user.createdAt).toLocaleDateString(),
        status: 'pending'
      }));
      setRegistrationRequests(formattedData);

    } catch (error: any) {
      alert(`Approval failed: ${error.message}`);
    }
  };

  const handleRejectRequest = async (id: string) => {
    if (!confirm('Are you sure you want to reject this user?')) return;

    try {
      const api = await import('../services/api');
      await api.rejectUser(id, 'Rejected by HOD');

      setRegistrationRequests(prev =>
        prev.filter(req => req.id !== id) // Remove from list
      );
      alert('Registration request rejected.');
    } catch (error: any) {
      alert(`Rejection failed: ${error.message}`);
    }
  };

  // Interview data
  const upcomingInterviews = [
    {
      id: 'int-1',
      interviewNumber: 'Interview #3',
      date: '2025-10-25',
      status: 'upcoming' as const,
      candidateCount: 18,
      candidates: []
    }
  ];

  const endedInterviews = [
    {
      id: 'int-2',
      interviewNumber: 'Interview #2',
      date: '2025-10-15',
      status: 'ended' as const,
      candidateCount: 15,
      averageMarks: 72.5,
      passedCandidates: 8,
      candidates: [
        {
          id: 'c1',
          name: 'A.B. Perera',
          email: 'ab.perera@gmail.com',
          phone: '+94 77 123 4567',
          marks: { part1: 28, part2: 35, part3: 30, total: 93 },
          shortlisted: true
        },
        {
          id: 'c2',
          name: 'C.D. Silva',
          email: 'cd.silva@gmail.com',
          phone: '+94 76 234 5678',
          marks: { part1: 25, part2: 32, part3: 28, total: 85 },
          shortlisted: true
        },
        {
          id: 'c3',
          name: 'E.F. Fernando',
          email: 'ef.fernando@gmail.com',
          phone: '+94 75 345 6789',
          marks: { part1: 24, part2: 30, part3: 27, total: 81 },
          shortlisted: true
        },
        {
          id: 'c4',
          name: 'G.H. Jayawardena',
          email: 'gh.jay@gmail.com',
          phone: '+94 74 456 7890',
          marks: { part1: 23, part2: 29, part3: 26, total: 78 },
          shortlisted: true
        },
        {
          id: 'c5',
          name: 'I.J. Karunaratne',
          email: 'ij.karu@gmail.com',
          phone: '+94 73 567 8901',
          marks: { part1: 22, part2: 28, part3: 25, total: 75 },
          shortlisted: true
        },
        {
          id: 'c6',
          name: 'K.L. Wijesinghe',
          email: 'kl.wije@gmail.com',
          phone: '+94 72 678 9012',
          marks: { part1: 20, part2: 26, part3: 23, total: 69 },
          shortlisted: false
        },
        {
          id: 'c7',
          name: 'M.N. Bandara',
          email: 'mn.banda@gmail.com',
          phone: '+94 71 789 0123',
          marks: { part1: 19, part2: 25, part3: 22, total: 66 },
          shortlisted: false
        }
      ]
    },
    {
      id: 'int-3',
      interviewNumber: 'Interview #1',
      date: '2025-09-30',
      status: 'ended' as const,
      candidateCount: 20,
      averageMarks: 68.3,
      passedCandidates: 10,
      candidates: []
    }
  ];

  async function handleViewReport(interviewId: string) {
    if (reportInterviewId === interviewId) {
      // Toggle off
      setReportInterviewId(null);
      setReportData(null);
      return;
    }
    setReportInterviewId(interviewId);
    setReportData(null);
    setReportError('');
    setLoadingReport(true);
    try {
      const data = await getInterviewReport(interviewId);
      setReportData(data);
    } catch (e: any) {
      setReportError(e.message || 'Failed to load report.');
    } finally {
      setLoadingReport(false);
    }
  }

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

  // Leave request handlers (pending approvals)
  const handleApproveLeave = async (leaveRequestId: string) => {
    try {
      setLoadingLeaveApprovals(true);
      await approveLeave(leaveRequestId);
      const pending = await getPendingLeaveRequests();
      setLeaveRequests(pending);
      alert('Leave request approved successfully!');
    } catch (e: any) {
      alert(e?.message || 'Failed to approve leave request');
    } finally {
      setLoadingLeaveApprovals(false);
    }
  };

  const handleRejectLeave = async (leaveRequestId: string) => {
    if (!confirm('Reject this leave request?')) return;
    try {
      setLoadingLeaveApprovals(true);
      await rejectLeave(leaveRequestId);
      const pending = await getPendingLeaveRequests();
      setLeaveRequests(pending);
      alert('Leave request rejected.');
    } catch (e: any) {
      alert(e?.message || 'Failed to reject leave request');
    } finally {
      setLoadingLeaveApprovals(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'manageInterviews', label: 'Manage Interviews', icon: Calendar },
    { id: 'staff', label: 'Temporary Staff List', icon: Users },
    { id: 'mentees', label: 'My Mentees', icon: Users },
    { id: 'leave', label: 'Leave Requests', icon: FileText },
    { id: 'research', label: 'Research Opportunities', icon: FileText },
    { id: 'approve', label: 'Approve Registrations', icon: ClipboardCheck },
    { id: 'interviews', label: 'Interview Reports', icon: FileText },
    { id: 'attendance', label: 'Attendance & Salaries', icon: DollarSign },
    { id: 'notifications', label: 'Notifications', icon: BellRing },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  useEffect(() => {
    if (activeMenu !== 'research') return;
    setLoadingResearch(true);
    getMyResearchOpportunities()
      .then(setMyResearch)
      .catch((e) => console.error('Failed to load research opportunities', e))
      .finally(() => setLoadingResearch(false));
  }, [activeMenu]);

  // Red badge for new research notifications
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const notifs = await getMyNotifications(true);
        const count = notifs.filter((n: UserNotificationDto) => n.type === 'research_new').length;
        if (mounted) setNewResearchCount(count);
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

  // When opening Research tab, mark research_new notifications as read
  useEffect(() => {
    if (activeMenu !== 'research') return;
    (async () => {
      try {
        const notifs = await getMyNotifications(true);
        const unreadNew = notifs.filter((n: UserNotificationDto) => n.type === 'research_new' && n.id);
        await Promise.all(unreadNew.map((n: UserNotificationDto) => markNotificationRead(n.id)));
      } catch {
        // ignore
      } finally {
        setNewResearchCount(0);
      }
    })();
  }, [activeMenu, markNotificationRead]);

  useEffect(() => {
    if (activeMenu !== 'mentees') return;
    setLoadingMentees(true);
    getMyMentees()
      .then(setMyMentees)
      .catch((e) => console.error('Failed to load mentees', e))
      .finally(() => setLoadingMentees(false));
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'leave') return;
    setLoadingLeaveApprovals(true);
    getPendingLeaveRequests()
      .then(setLeaveRequests)
      .catch((e) => {
        console.error('Failed to load leave approvals', e);
        setLeaveRequests([]);
      })
      .finally(() => setLoadingLeaveApprovals(false));
  }, [activeMenu]);

  const statsCards = [
    { title: 'Total Temporary Staff', value: '42', color: '#4db4ac' },
    { title: 'Pending Approvals', value: '8', color: '#4db4ac' },
    { title: 'Active Mentors', value: '15', color: '#4db4ac' },
    { title: 'Contracts Expiring Soon', value: '6', color: '#4db4ac' },
  ];



  const upcomingDeadlines = [
    { task: 'Contract Renewal - A.B. Perera', priority: 'urgent', date: 'Oct 22, 2025' },
    { task: 'Salary Approval - Monthly', priority: 'urgent', date: 'Oct 25, 2025' },
    { task: 'Interview Report Submission', priority: 'medium', date: 'Oct 28, 2025' },
    { task: 'Mentor Review Meeting', priority: 'normal', date: 'Nov 02, 2025' },
    { task: 'Department Budget Review', priority: 'medium', date: 'Nov 05, 2025' },
  ];

  const recentActivities = [
    { activity: 'Approved Temporary Staff Registration', performedBy: 'Dr. D. Wickramaarachchi', date: 'Oct 18, 2025 - 2:30 PM' },
    { activity: 'Updated Mentor Assignment', performedBy: 'Dr. T. Mahanama', date: 'Oct 18, 2025 - 11:00 AM' },
    { activity: 'Approved Interview Shortlist', performedBy: 'Dr. D. Wickramaarachchi', date: 'Oct 17, 2025 - 4:15 PM' },
    { activity: 'Reviewed Salary Report', performedBy: 'Dr. D. Wickramaarachchi', date: 'Oct 17, 2025 - 10:30 AM' },
    { activity: 'Sent Contract Renewal Reminder', performedBy: 'System', date: 'Oct 16, 2025 - 9:00 AM' },
  ];

  // Show Manage Interviews Page
  if (currentPage === 'manageInterviews') {
    return (
      <HodManageInterviewsPage
        onBack={() => {
          setCurrentPage('dashboard');
          setActiveMenu('dashboard');
        }}
      />
    );
  }

  // Show Attendance and Salaries Page
  if (currentPage === 'attendanceSalaries') {
    return (
      <AttendanceAndSalariesPage
        onBack={() => {
          setCurrentPage('dashboard');
          setActiveMenu('dashboard');
        }}
      />
    );
  }

  // Show Approval Page for Ended Interviews
  if (currentPage === 'approvalPage' && selectedInterview) {
    return (
      <HodEndedInterviewApprovalPage
        interview={selectedInterview}
        onBack={() => {
          setCurrentPage('dashboard');
          setSelectedInterview(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-white" style={{ fontWeight: 600, fontSize: '18px' }}>
            Temporary Staff Coordination System
          </h1>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 text-white hover:bg-[#3c9a93] px-3 py-2 rounded-lg transition-colors">
              <Avatar className="h-8 w-8 border-2 border-white">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-white text-[#4db4ac]">DW</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex pt-16">
        {/* Left Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg overflow-y-auto border-r border-[#e0e0e0]">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'manageInterviews') {
                      setCurrentPage('manageInterviews');
                    } else if (item.id === 'attendance') {
                      setCurrentPage('attendanceSalaries');
                    } else {
                      setActiveMenu(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                    ? 'bg-[#4db4ac] text-white'
                    : 'text-[#555555] hover:bg-[#f0f0f0]'
                    }`}
                  style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}
                >
                  <Icon className="h-5 w-5" />
                  {item.id === 'research' && newResearchCount > 0 && (
                    <span
                      className="inline-flex items-center justify-center text-white"
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
                      {Math.min(newResearchCount, 99)}
                    </span>
                  )}
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 mr-80 p-6 space-y-6 pb-20">
          {/* Profile Card - Only on Dashboard */}
          {activeMenu === 'dashboard' && (
            <>
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-[#4db4ac]">
                    <AvatarImage src={profileData.avatarUrl} alt={profileData.name} />
                    <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '32px' }}>
                      {profileData.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <h2 className="text-[#222222] mb-1" style={{ fontWeight: 700, fontSize: '24px' }}>
                      {profileData.name}
                    </h2>
                    <p className="text-[#4db4ac] mb-2" style={{ fontWeight: 600, fontSize: '16px' }}>
                      Head of Department
                    </p>
                    <p className="text-[#555555] mb-4" style={{ fontSize: '14px' }}>
                      Department of Industrial Management
                    </p>

                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '14px' }}>
                        <Mail className="h-4 w-4 text-[#4db4ac]" />
                        <span>{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '14px' }}>
                        <Phone className="h-4 w-4 text-[#4db4ac]" />
                        <span>{profileData.phone}</span>
                      </div>
                    </div>

                    <Button
                      className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg px-4 py-2"
                      onClick={() => setEditProfileOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Department Statistics Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statsCards.map((stat, index) => (
                  <Card
                    key={index}
                    className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 border-t-4 overflow-hidden"
                    style={{ borderTopColor: stat.color }}
                  >
                    <div className="p-5">
                      <p className="text-[#555555] mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>
                        {stat.title}
                      </p>
                      <p className="text-[#222222]" style={{ fontSize: '32px', fontWeight: 700 }}>
                        {stat.value}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Temporary Staff List View */}
          {activeMenu === 'staff' && (
            <>
              {showStaffJdPage && selectedStaffForJd ? (
                <StructuredJobDescriptionPage
                  staffName={selectedStaffForJd?.name || 'Temporary Staff'}
                  jd={selectedStaffJd}
                  loading={loadingStaffJd}
                  onBack={() => setShowStaffJdPage(false)}
                />
              ) : (
                <>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                        Temporary Staff List
                      </h2>
                      <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                        {(() => {
                          const now = new Date();
                          const filtered = temporaryStaff.filter((s) => {
                            const end = s.contractEndDate ? new Date(s.contractEndDate) : null;
                            const expired = end ? end.getTime() < now.getTime() : false;
                            if (contractFilter === 'expired') return expired;
                            if (contractFilter === 'remaining') return !expired;
                            return true;
                          });
                          return `${filtered.length} Staff`;
                        })()}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className={`${contractFilter === 'all' ? 'border-[#4db4ac] text-[#4db4ac]' : 'border-[#e0e0e0] text-[#555555]'} rounded-lg`}
                        onClick={() => setContractFilter('all')}
                      >
                        All
                      </Button>
                      <Button
                        variant="outline"
                        className={`${contractFilter === 'expired' ? 'border-red-500 text-red-600' : 'border-[#e0e0e0] text-[#555555]'} rounded-lg`}
                        onClick={() => setContractFilter('expired')}
                      >
                        Contract Expired
                      </Button>
                      <Button
                        variant="outline"
                        className={`${contractFilter === 'remaining' ? 'border-green-500 text-green-700' : 'border-[#e0e0e0] text-[#555555]'} rounded-lg`}
                        onClick={() => setContractFilter('remaining')}
                      >
                        Contract Remaining
                      </Button>
                    </div>
                  </div>

              {loadingStaff && (
                <div className="flex items-center justify-center py-12 gap-3 text-[#4db4ac]">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span style={{ fontSize: '14px' }}>Loading staff…</span>
                </div>
              )}

              {!loadingStaff && temporaryStaff.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-[#d0d0d0] mx-auto mb-3" />
                  <p className="text-[#999999]" style={{ fontSize: '14px' }}>No approved temporary staff yet.</p>
                </div>
              )}

              <div className="space-y-4">
                {temporaryStaff
                  .filter((s) => {
                    const now = new Date();
                    const end = s.contractEndDate ? new Date(s.contractEndDate) : null;
                    const expired = end ? end.getTime() < now.getTime() : false;
                    if (contractFilter === 'expired') return expired;
                    if (contractFilter === 'remaining') return !expired;
                    return true;
                  })
                  .map((staff) => {
                  const endDate = staff.contractEndDate ? new Date(staff.contractEndDate) : null;
                  const daysUntilExpiry = endDate
                    ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null;
                  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30;

                  return (
                    <Card
                      key={staff.id}
                      className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Staff Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border-2 border-[#4db4ac]">
                              <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '18px', fontWeight: 600 }}>
                                {staff.name.split(' ').filter(Boolean).map(n => n[0]).slice(0, 2).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-[#222222] mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
                                {staff.name}
                              </h3>
                              <div className="flex flex-wrap gap-3 text-[#555555]" style={{ fontSize: '13px' }}>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-[#4db4ac]" />
                                  {staff.email}
                                </div>
                                {staff.phone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-[#4db4ac]" />
                                    {staff.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Contract Details + Actions */}
                        <div className="lg:w-72 space-y-3">

                          {/* Contract date row */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-[#f9f9f9] rounded-lg p-3">
                              <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>CONTRACT START</p>
                              <p className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                                {staff.contractStartDate
                                  ? new Date(staff.contractStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : <span className="text-[#999]">Not set</span>}
                              </p>
                            </div>
                            <div className="bg-[#f9f9f9] rounded-lg p-3">
                              <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>CONTRACT END</p>
                              <p className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                                {staff.contractEndDate
                                  ? new Date(staff.contractEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : <span className="text-[#999]">Not set</span>}
                              </p>
                            </div>
                          </div>

                          {/* Countdown */}
                          {daysUntilExpiry !== null && (
                            <div className={`rounded-lg p-3 border ${
                              daysUntilExpiry < 0
                                ? 'bg-red-50 border-red-200'
                                : isExpiringSoon
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-green-50 border-green-200'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className={`h-4 w-4 ${daysUntilExpiry < 0 ? 'text-red-500' : isExpiringSoon ? 'text-orange-500' : 'text-green-600'}`} />
                                  <p className={`font-semibold ${daysUntilExpiry < 0 ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-green-700'}`}
                                    style={{ fontSize: '12px' }}>
                                    {daysUntilExpiry < 0 ? 'Contract Expired' : 'Days Remaining'}
                                  </p>
                                </div>
                                <span className={`font-bold text-lg ${daysUntilExpiry < 0 ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-green-700'}`}>
                                  {daysUntilExpiry < 0 ? `${Math.abs(daysUntilExpiry)}d ago` : `${daysUntilExpiry}d`}
                                </span>
                              </div>
                              {daysUntilExpiry >= 0 && (
                                <div className="w-full bg-white/60 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${isExpiringSoon ? 'bg-orange-400' : 'bg-green-500'}`}
                                    style={{ width: `${Math.min(100, Math.max(2, (daysUntilExpiry / 365) * 100))}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* View JD button */}
                          <Button
                            onClick={() => {
                              setSelectedStaffForJd(staff);
                              setSelectedStaffJd(null);
                              setShowStaffJdPage(true);
                              setLoadingStaffJd(true);
                              getJobDescriptionForStaff(staff.id)
                                .then((dto) => {
                                  try {
                                    const parsed = dto?.content ? JSON.parse(dto.content) : null;
                                    setSelectedStaffJd(parsed);
                                  } catch (e) {
                                    console.error('Failed to parse staff JD content', e);
                                    setSelectedStaffJd(null);
                                  }
                                })
                                .catch((e) => {
                                  console.error('Failed to load staff JD', e);
                                  setSelectedStaffJd(null);
                                })
                                .finally(() => setLoadingStaffJd(false));
                            }}
                            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg w-full"
                            style={{ fontSize: '13px' }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Job Description
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

          {/* My Mentees */}
          {activeMenu === 'mentees' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  My Mentees
                </h3>
              </div>
              <Separator className="mb-4" />

              {loadingMentees && (
                <div className="flex items-center justify-center py-8 gap-3 text-[#4db4ac]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span style={{ fontSize: '14px' }}>Loading mentees…</span>
                </div>
              )}

              {!loadingMentees && myMentees.length === 0 && (
                <div className="text-center py-10 text-[#999999]" style={{ fontSize: '14px' }}>
                  No mentees assigned to you yet.
                </div>
              )}

              <div className="space-y-3">
                {myMentees.map((m) => (
                  <Card key={m.id} className="border border-[#e0e0e0] rounded-lg p-4 bg-white">
                    <div className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 700 }}>{m.fullName}</div>
                    <div className="text-[#555555]" style={{ fontSize: '13px' }}>{m.email}</div>
                    {m.mobile && <div className="text-[#555555]" style={{ fontSize: '13px' }}>{m.mobile}</div>}
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Leave Requests */}
          {activeMenu === 'leave' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Leave Requests
                </h3>
                <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                  Pending: {leaveRequests.length}
                </Badge>
              </div>
              <Separator className="mb-4" />

              {loadingLeaveApprovals ? (
                <div className="flex items-center justify-center py-10 text-[#4db4ac]" style={{ fontSize: '14px' }}>
                  Loading leave requests…
                </div>
              ) : (
                <div className="space-y-4">
                  {leaveRequests.length === 0 ? (
                    <div className="text-center py-12 text-[#999999]">
                      <p style={{ fontSize: '14px' }}>No pending leave requests</p>
                    </div>
                  ) : (
                    leaveRequests.map((request) => (
                      <Card key={request.id} className="bg-white border border-[#e0e0e0] rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 700 }}>
                                {request.staffName}
                              </h4>
                              <Badge className="bg-orange-100 text-orange-700 border-orange-300 border" style={{ fontSize: '10px' }}>
                                PENDING
                              </Badge>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[#555555]" style={{ fontSize: '13px' }}>{request.staffEmail || '—'}</p>
                              <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                                Substitute: {request.substituteName || '—'}
                              </p>
                              <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                                Date:{' '}
                                {request.leaveDate
                                  ? new Date(request.leaveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                  : '—'}
                              </p>
                            </div>

                            <div className="mt-2">
                              <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>Reason</p>
                              <p className="text-[#222222] bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-2" style={{ fontSize: '14px' }}>
                                {request.reason}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white px-4"
                              onClick={() => handleApproveLeave(request.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="border-red-600 text-red-600 hover:bg-red-50 px-4"
                              onClick={() => handleRejectLeave(request.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Research Opportunities */}
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

              {loadingResearch && (
                <Card className="bg-white rounded-xl border-0 p-6 text-center text-[#4db4ac]">
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Loading research opportunities…
                </Card>
              )}

              <div className="grid grid-cols-1 gap-4">
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
                        {formatPostedDate(research.createdAt) ? `Posted: ${formatPostedDate(research.createdAt)}` : ''}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white rounded-lg"
                          onClick={() => { setSelectedResearch(research); setShowResearchDialog(true); }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white rounded-lg"
                          onClick={() => { setSelectedResearch(research); setShowEditResearchDialog(true); }}
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
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Attendance & Salaries View */}
          {activeMenu === 'attendance' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Attendance & Salaries
                </h2>
              </div>

              {/* Quick Access Cards for FR20, FR21, FR22 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setAttendanceSummaryOpen(true)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-[#e6f7f6] rounded-lg">
                      <Calendar className="h-6 w-6 text-[#4db4ac]" />
                    </div>
                    <Badge className="bg-[#4db4ac] text-white">FR20</Badge>
                  </div>
                  <h3 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Attendance Summary
                  </h3>
                  <p className="text-[#555555]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    View and monitor attendance summaries and task completion of all temporary staff
                  </p>
                </Card>

                <Card
                  className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSalaryReportsOpen(true)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-[#e6f7f6] rounded-lg">
                      <DollarSign className="h-6 w-6 text-[#4db4ac]" />
                    </div>
                    <Badge className="bg-[#4db4ac] text-white">FR21</Badge>
                  </div>
                  <h3 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Salary Reports
                  </h3>
                  <p className="text-[#555555]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    Review and approve automatically generated salary reports for temporary staff
                  </p>
                </Card>

                <Card
                  className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setArchivedStaffOpen(true)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-3 bg-[#e6f7f6] rounded-lg">
                      <Archive className="h-6 w-6 text-[#4db4ac]" />
                    </div>
                    <Badge className="bg-[#4db4ac] text-white">FR22</Badge>
                  </div>
                  <h3 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                    Archived Staff Records
                  </h3>
                  <p className="text-[#555555]" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                    Access records and reports for staff with ended contracts
                  </p>
                </Card>
              </div>
            </>
          )}

          {/* Approve Registrations View */}
          {activeMenu === 'approve' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Registration Requests
                </h3>
                <Badge className="bg-[#4db4ac] text-white">FR7</Badge>
              </div>
              <Separator className="mb-4" />

              <div className="space-y-4">
                {registrationRequests.map((request) => (
                  <Card
                    key={request.id}
                    className={`border-2 rounded-lg p-5 ${request.status === 'pending'
                      ? 'border-[#4db4ac] bg-[#f9f9f9]'
                      : request.status === 'approved'
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                            {request.name}
                          </h4>
                          <Badge
                            className={`${request.status === 'pending'
                              ? 'bg-orange-100 text-orange-700 border-orange-300'
                              : request.status === 'approved'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                              } border`}
                            style={{ fontSize: '10px' }}
                          >
                            {request.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Mail className="h-4 w-4 text-[#4db4ac]" />
                            <span>{request.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Phone className="h-4 w-4 text-[#4db4ac]" />
                            <span>{request.phone}</span>
                          </div>
                        </div>



                        <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                          Submitted: {request.submittedDate}
                        </p>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveRequest(request.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectRequest(request.id)}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50 px-4"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {registrationRequests.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-12 text-[#999999]">
                    <p style={{ fontSize: '14px' }}>No pending registration requests</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Interview Reports View */}
          {activeMenu === 'interviews' && (
            <div className="space-y-6">
              {/* Upcoming Interviews Section */}
              {upcomingInterviews.map((interview) => (
                <Card key={interview.id} className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-[#4db4ac]" />
                      <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                        {interview.interviewNumber} - Upcoming Interview
                      </h3>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                        UPCOMING
                      </Badge>
                    </div>
                  </div>
                  <Separator className="mb-4" />

                  <div className="space-y-4">
                    {/* Interview Date Management */}
                    <Card className="border-2 border-[#4db4ac] rounded-lg p-4 bg-[#e6f7f6]">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-[#4db4ac]" />
                            <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                              Scheduled Date
                            </p>
                          </div>

                          <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>
                            {new Date(interview.date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <Badge className="bg-blue-100 text-blue-700 border-blue-300 border px-4 py-2">
                          Waiting for Coordinator
                        </Badge>
                      </div>
                    </Card>

                    {/* Candidate Statistics */}
                    <div className="grid grid-cols-2 gap-4">
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
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300 border" style={{ fontSize: '12px' }}>
                          UPCOMING
                        </Badge>
                      </Card>
                    </div>
                  </div>
                </Card>
              ))}

              {/* Ended Interviews Section - Requiring Approval */}
              {endedInterviews.map((interview) => (
                <Card key={interview.id} className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-6 w-6 text-[#4db4ac]" />
                      <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                        {interview.interviewNumber} - Ended Interview
                      </h3>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300 border" style={{ fontSize: '12px' }}>
                        PENDING APPROVAL
                      </Badge>
                    </div>
                  </div>
                  <Separator className="mb-4" />

                  <div className="space-y-4">
                    {/* Interview Summary Card */}
                    <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                      <div className="grid grid-cols-4 gap-4">
                        <div>
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Interview Date
                          </p>
                          <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                            {new Date(interview.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Total Candidates
                          </p>
                          <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
                            {interview.candidateCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Average Marks
                          </p>
                          <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
                            {interview.averageMarks?.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Shortlisted
                          </p>
                          <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
                            {interview.passedCandidates}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Actions row */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-[#fff8e1] border-2 border-[#ffd54f] rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[#222222] mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                              Approval Required
                            </p>
                            <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                              Review results and approve shortlisted candidates
                            </p>
                          </div>
                          <Button
                            onClick={() => { setSelectedInterview(interview); setCurrentPage('approvalPage'); }}
                            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white ml-4"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Review & Approve
                          </Button>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => handleViewReport(interview.id)}
                        className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6] self-stretch px-5"
                      >
                        <BarChart2 className="h-4 w-4 mr-2" />
                        {reportInterviewId === interview.id ? 'Hide Report' : 'View Report'}
                      </Button>
                    </div>

                    {/* Inline report panel */}
                    {reportInterviewId === interview.id && (
                      <div className="mt-2">
                        {loadingReport && (
                          <div className="flex items-center gap-2 py-6 justify-center text-[#4db4ac]">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span style={{ fontSize: '14px' }}>Loading report…</span>
                          </div>
                        )}
                        {reportError && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600" style={{ fontSize: '13px' }}>
                            {reportError}
                          </div>
                        )}
                        {reportData && (
                          <div className="space-y-4">
                            {/* Criteria legend */}
                            <div className="bg-[#e6f7f6] border border-[#4db4ac] rounded-lg p-4">
                              <p className="text-[#4db4ac] font-semibold mb-2" style={{ fontSize: '13px' }}>
                                Marking Criteria — Max {reportData.totalMaxMarks} pts
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {reportData.criteria.map((c, i) => (
                                  <span key={c.id} className="bg-white border border-[#4db4ac] text-[#222222] text-xs px-2 py-1 rounded-full">
                                    {i + 1}. {c.name} <span className="text-[#4db4ac] font-semibold">/{c.maxMarks}</span>
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Per-candidate report */}
                            {reportData.candidates.length === 0 ? (
                              <div className="text-center py-6 text-[#999]" style={{ fontSize: '14px' }}>
                                No marks submitted yet.
                              </div>
                            ) : reportData.candidates.map((cand, ci) => (
                              <Card key={cand.candidateId} className="border border-[#e0e0e0] rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="h-7 w-7 rounded-full bg-[#4db4ac] text-white flex items-center justify-center text-xs font-bold">
                                      {ci + 1}
                                    </span>
                                    <div>
                                      <p className="text-[#222222] font-semibold" style={{ fontSize: '15px' }}>{cand.candidateName}</p>
                                      <p className="text-[#555555]" style={{ fontSize: '12px' }}>{cand.candidateEmail}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[#4db4ac] font-bold" style={{ fontSize: '20px' }}>
                                      {cand.averageTotal} <span className="text-[#999] font-normal text-sm">/ {cand.maxTotal} avg</span>
                                    </p>
                                    <p className="text-[#555555]" style={{ fontSize: '12px' }}>
                                      {cand.maxTotal > 0 ? Math.round((cand.averageTotal / cand.maxTotal) * 100) : 0}% average
                                    </p>
                                  </div>
                                </div>

                                {cand.markerResults.length === 0 ? (
                                  <p className="text-[#999] text-sm">No marks submitted for this candidate.</p>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm border-collapse">
                                      <thead>
                                        <tr className="bg-[#f9f9f9]">
                                          <th className="text-left p-2 text-[#555555] font-semibold border border-[#e0e0e0]" style={{ fontSize: '12px' }}>
                                            Marker
                                          </th>
                                          {reportData.criteria.map(c => (
                                            <th key={c.id} className="p-2 text-center text-[#555555] font-semibold border border-[#e0e0e0]" style={{ fontSize: '12px', minWidth: '80px' }}>
                                              {c.name}<br /><span className="text-[#4db4ac]">/{c.maxMarks}</span>
                                            </th>
                                          ))}
                                          <th className="p-2 text-center text-[#222222] font-bold border border-[#e0e0e0] bg-[#e6f7f6]" style={{ fontSize: '12px' }}>
                                            Total<br /><span className="text-[#4db4ac]">/{reportData.totalMaxMarks}</span>
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {cand.markerResults.map(mr => (
                                          <tr key={mr.markerId} className="hover:bg-[#f9f9f9]">
                                            <td className="p-2 border border-[#e0e0e0]">
                                              <p className="font-semibold text-[#222222]" style={{ fontSize: '13px' }}>{mr.markerName}</p>
                                              <p className="text-[#999]" style={{ fontSize: '11px' }}>{mr.markerRole}</p>
                                            </td>
                                            {reportData.criteria.map(c => (
                                              <td key={c.id} className="p-2 text-center border border-[#e0e0e0] text-[#222222] font-semibold">
                                                {mr.marksByCriterion[c.id] ?? '—'}
                                              </td>
                                            ))}
                                            <td className="p-2 text-center border border-[#e0e0e0] bg-[#e6f7f6] font-bold text-[#4db4ac]">
                                              {mr.total}
                                            </td>
                                          </tr>
                                        ))}
                                        {/* Average row */}
                                        <tr className="bg-[#4db4ac] text-white">
                                          <td className="p-2 border border-[#3c9a93] font-bold" style={{ fontSize: '13px' }}>
                                            Average
                                          </td>
                                          {reportData.criteria.map(c => {
                                            const vals = cand.markerResults
                                              .map(mr => mr.marksByCriterion[c.id])
                                              .filter((v): v is number => v !== undefined);
                                            const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
                                            return (
                                              <td key={c.id} className="p-2 text-center border border-[#3c9a93] font-semibold">
                                                {avg.toFixed(1)}
                                              </td>
                                            );
                                          })}
                                          <td className="p-2 text-center border border-[#3c9a93] font-bold text-lg">
                                            {cand.averageTotal}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {cand.markerResults.some(mr => mr.comments) && (
                                  <div className="mt-3 space-y-1">
                                    <p className="text-[#555555] font-semibold" style={{ fontSize: '12px' }}>Comments:</p>
                                    {cand.markerResults.filter(mr => mr.comments).map(mr => (
                                      <div key={mr.markerId} className="bg-[#f9f9f9] rounded p-2 text-[#555555]" style={{ fontSize: '12px' }}>
                                        <span className="font-semibold text-[#222222]">{mr.markerName}:</span> {mr.comments}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {activeMenu === 'dashboard' && (
            <>
              {/* System Notices FR16 */}
              <SystemNotices userRole="hod" />

              {/* Recent Activities Section */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
                  Recent System Activities
                </h3>

                <div className="space-y-1">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-3 rounded-lg hover:bg-[#f9f9f9] transition-colors border-l-4 border-[#4db4ac]"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <div className="h-8 w-8 rounded-full bg-[#e6f7f6] flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-[#4db4ac]" />
                        </div>
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 500 }}>
                          {activity.activity}
                        </p>
                        <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                          Performed by {activity.performedBy}
                        </p>
                        <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Notifications View */}
          {activeMenu === 'notifications' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Important Notices
                </h2>
                <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                  System Notifications
                </Badge>
              </div>

              <SystemNotices userRole="hod" />
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
                      Head of Department
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
                    <h3 className="text-[#222222] mb-4" style={{ fontWeight: 600, fontSize: '16px' }}>
                      Department Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Total Staff</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>42</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Active Mentorships</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>15</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Pending Approvals</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>8</span>
                      </div>
                    </div>
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

        {/* Right Sidebar - Upcoming Deadlines */}
        <aside className="fixed right-0 top-16 bottom-0 w-80 bg-white shadow-lg overflow-y-auto p-6">
          <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
            Upcoming Deadlines
          </h3>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {upcomingDeadlines.map((deadline, index) => (
              <Card
                key={index}
                className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[#222222] flex-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {deadline.task}
                  </p>
                  <Badge
                    className={`${deadline.priority === 'urgent'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : deadline.priority === 'medium'
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                      } border`}
                    style={{ fontSize: '10px' }}
                  >
                    {deadline.priority.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                  Due: {deadline.date}
                </p>
              </Card>
            ))}
          </div>

          <Button className="w-full mt-6 bg-white border-2 border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white rounded-lg">
            <BellRing className="h-4 w-4 mr-2" />
            View All Reminders
          </Button>
        </aside>
      </div>

      {/* Dialogs */}
      <AttendanceSummaryDialog
        open={attendanceSummaryOpen}
        onOpenChange={setAttendanceSummaryOpen}
        userRole="hod"
      />
      <SalaryReportsDialog
        open={salaryReportsOpen}
        onOpenChange={setSalaryReportsOpen}
        userRole="hod"
      />
      <ArchivedStaffDialog
        open={archivedStaffOpen}
        onOpenChange={setArchivedStaffOpen}
      />
      <SendNoticeDialog
        open={sendNoticeOpen}
        onOpenChange={setSendNoticeOpen}
        onSend={() => setSendNoticeOpen(false)}
      />
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        currentProfile={profileData}
        onSave={handleProfileSave}
      />

      {selectedResearch && (
        <ResearchDetailsDialog
          open={showResearchDialog}
          onOpenChange={setShowResearchDialog}
          research={selectedResearch}
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
            const created = await createResearchOpportunity({ title: researchData.title, description: researchData.description });
            setMyResearch(prev => [created, ...prev]);
          } catch (e: any) {
            alert(`Create failed: ${e?.message || 'Unknown error'}`);
          }
        }}
      />
    </div>
  );
}