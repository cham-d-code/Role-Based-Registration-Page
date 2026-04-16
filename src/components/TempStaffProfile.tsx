import { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  FileText,
  ClipboardList,
  Calendar,
  Award,
  BellRing, 
  User as UserIcon, 
  Settings, 
  LogOut,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Edit,
  ChevronDown,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Plus,
  UserCheck,
  BookOpen,
  Send,
  Trash2,
  ListTodo,
  Loader2,
  Save
} from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Checkbox } from './ui/checkbox';
import SystemNotices from './SystemNotices';
import LeaveApplicationDialog from './LeaveApplicationDialog';
import EditProfileDialog from './EditProfileDialog';
import {
  applyLeave,
  applyToResearchOpportunity,
  getCurrentUser,
  getLatestModulePreferenceRequest,
  getMyJobDescription,
  getMyLeaveRequests,
  getMyResearchApplications,
  getMyWeeklyTasks,
  getMyNextTask,
  saveMyWeeklyTasks,
  updateWeeklyTaskStatus,
  listOpenResearchOpportunities,
  MyResearchApplicationDto,
  ResearchOpportunityDto,
  submitModulePreferences,
  updateMyProfile,
  type LeaveRequestDto,
  type ModulePreferenceRequestDto,
  type WeeklyTaskDto,
  type NextTaskDto,
} from '../services/api';
import logo from 'figma:asset/39b6269214ec5f8a015cd1f1a1adaa157fd5d025.png';

interface TempStaffProfileProps {
  onLogout?: () => void;
}

export default function TempStaffProfile({ onLogout }: TempStaffProfileProps = {}) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editSubjectsOpen, setEditSubjectsOpen] = useState(false);
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [subjectsSaving, setSubjectsSaving] = useState(false);
  const [modulePrefRequest, setModulePrefRequest] = useState<ModulePreferenceRequestDto | null>(null);
  const [loadingModulePrefs, setLoadingModulePrefs] = useState(false);
  const [selectedPrefModuleIds, setSelectedPrefModuleIds] = useState<Set<string>>(new Set());
  const [submittingModulePrefs, setSubmittingModulePrefs] = useState(false);
  const [myJdContent, setMyJdContent] = useState<any | null>(null);
  const [loadingMyJd, setLoadingMyJd] = useState(false);

  // Weekly tasks
  const [weeklyTasks, setWeeklyTasks] = useState<WeeklyTaskDto[]>([]);
  const [loadingWeeklyTasks, setLoadingWeeklyTasks] = useState(false);
  const [savingWeeklyTasks, setSavingWeeklyTasks] = useState(false);
  // Editor rows (draft before save)
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  type DayName = typeof DAYS[number];
  const [taskRows, setTaskRows] = useState<{ dayOfWeek: DayName; timeFrom: string; timeTo: string; title: string }[]>([
    { dayOfWeek: 'Monday', timeFrom: '08:00', timeTo: '09:00', title: '' },
  ]);
  // Next task for dashboard
  const [nextTask, setNextTask] = useState<NextTaskDto | null>(null);
  const [loadingNextTask, setLoadingNextTask] = useState(false);
  const nextTaskIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    avatarUrl: '',
    initials: '...'
  });

  const currentUserId: string | null = getCurrentUser()?.id ?? null;

  const availableSubjects = [
    'Core AI & Machine Learning',
    'Advanced AI Systems',
    'Data Science & Analytics',
    'Computer Vision & Image Processing',
    'Internet of Things (IoT) & Automation',
    'Communication Networks & Information Systems',
    'Software Engineering & System Architecture',
    'Operations & Logistics Management',
    'Supply Chain & Transportation',
    'Process Optimization & Industry 4.0',
    'Total Quality Management (TQM)',
    'Sustainability & Green Logistics',
    'Digital Transformation & ERP Systems',
    'Business Systems Engineering & Business Law',
    'Digital & Social Media Marketing',
    'Consumer Behavior & Financial Fitness',
    'English Language Teaching (ELT/ESL)',
    'Gender & Postcolonial Studies',
    'Psychology (Abnormal & Social)',
    'International Protection of Human Rights',
  ];

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
          setPreferredSubjects(profile.preferredSubjects ?? []);
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

  const formatReceptionTime = (t: any) => {
    const day = t?.day || '';
    // Backward-compatible: older JDs used hour/minute/ampm (single time)
    const fromH = t?.fromHour ?? t?.hour ?? '';
    const fromM = t?.fromMinute ?? t?.minute ?? '';
    const fromAp = t?.fromAmpm ?? t?.ampm ?? '';
    const toH = t?.toHour ?? '';
    const toM = t?.toMinute ?? '';
    const toAp = t?.toAmpm ?? '';

    const fromTime = fromH && fromM ? `${fromH}:${fromM}` : '';
    const toTime = toH && toM ? `${toH}:${toM}` : '';

    const fromLabel = [fromTime, fromAp].filter(Boolean).join(' ');
    const toLabel = [toTime, toAp].filter(Boolean).join(' ');
    const range = toLabel ? `${fromLabel} – ${toLabel}` : fromLabel;

    return [day, range].filter(Boolean).join(' ');
  };

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);


  const [appliedResearch, setAppliedResearch] = useState<number[]>([]);
  const [openResearch, setOpenResearch] = useState<ResearchOpportunityDto[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [appliedOpportunityIds, setAppliedOpportunityIds] = useState<string[]>([]);
  const [myApplications, setMyApplications] = useState<MyResearchApplicationDto[]>([]);

  // Helper function to get category styling
  const getCategoryStyle = (category: string) => {
    const academicCategories = ['Teaching', 'Marking', 'Research', 'Academic'];
    const administrativeCategories = ['Administrative', 'Meeting'];
    
    if (academicCategories.includes(category)) {
      return {
        className: 'bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]',
        icon: BookOpen
      };
    } else if (administrativeCategories.includes(category)) {
      return {
        className: 'bg-[#fff8e6] text-[#f59e0b] border border-[#f59e0b]',
        icon: Briefcase
      };
    } else {
      return {
        className: 'bg-[#f0f0f0] text-[#555555] border border-[#d0d0d0]',
        icon: FileText
      };
    }
  };

  const handleLeaveSubmit = async (leaveData: any) => {
    try {
      setLoadingLeaves(true);
      const next = await applyLeave({
        leaveDate: leaveData.leaveDate,
        reason: leaveData.reason,
        substituteId: leaveData.substituteId,
      });
      alert('Leave request submitted successfully!');
      // Refresh list from backend (keeps status/substitute consistent)
      const mine = await getMyLeaveRequests();
      setLeaveRequests(mine);
      return next;
    } catch (e: any) {
      alert(e?.message || 'Failed to submit leave request');
      throw e;
    } finally {
      setLoadingLeaves(false);
    }
  };

  const handleResearchApply = async (opportunityId: string) => {
    try {
      await applyToResearchOpportunity(opportunityId);
      setAppliedOpportunityIds(prev => prev.includes(opportunityId) ? prev : [...prev, opportunityId]);
      alert('Applied successfully!');
    } catch (e: any) {
      alert(`Apply failed: ${e?.message || 'Unknown error'}`);
    }
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'myJd', label: 'My JD', icon: ClipboardList },
    { id: 'weeklyTasks', label: 'My Weekly Tasks', icon: ListTodo },
    { id: 'leave', label: 'Leave Requests', icon: Calendar },
    { id: 'research', label: 'Research Opportunities', icon: FileText },
    { id: 'modulePreferences', label: 'Module Preferences', icon: BookOpen },
    { id: 'notifications', label: 'Notifications', icon: BellRing },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const quickStats = [
    { label: 'Tasks Completed Today', value: '12', color: '#4db4ac' },
    { label: 'Pending Tasks Today', value: '3', color: '#f7a541' },
    { label: 'Leave Days Remaining', value: '2', color: '#4db4ac' },
    { label: 'Days to Contract End', value: '45', color: '#555555' },
  ];

  // Load latest module preference request so we can show a sidebar badge
  useEffect(() => {
    getLatestModulePreferenceRequest()
      .then((req) => setModulePrefRequest(req))
      .catch(() => setModulePrefRequest(null));
  }, []);

  // Load weekly tasks when tab opens, and pre-populate editor
  useEffect(() => {
    if (activeMenu !== 'weeklyTasks') return;
    setLoadingWeeklyTasks(true);
    getMyWeeklyTasks()
      .then((tasks) => {
        setWeeklyTasks(tasks);
        if (tasks.length > 0) {
          setTaskRows(tasks.map(t => ({
            dayOfWeek: t.dayOfWeek as DayName,
            timeFrom: t.timeFrom,
            timeTo: t.timeTo,
            title: t.title,
          })));
        }
      })
      .catch(() => setWeeklyTasks([]))
      .finally(() => setLoadingWeeklyTasks(false));
  }, [activeMenu]);

  // Next task: load on mount and poll every minute
  useEffect(() => {
    const load = () => {
      setLoadingNextTask(true);
      getMyNextTask()
        .then(setNextTask)
        .catch(() => setNextTask(null))
        .finally(() => setLoadingNextTask(false));
    };
    load();
    nextTaskIntervalRef.current = setInterval(load, 60_000);
    return () => {
      if (nextTaskIntervalRef.current) clearInterval(nextTaskIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeMenu !== 'research') return;
    setLoadingResearch(true);
    Promise.all([listOpenResearchOpportunities(), getMyResearchApplications()])
      .then(([opps, apps]) => {
        setOpenResearch(opps);
        setMyApplications(apps);
        setAppliedOpportunityIds(apps.map(a => a.opportunityId));
      })
      .catch((e) => console.error('Failed to load research opportunities/applications', e))
      .finally(() => setLoadingResearch(false));
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'modulePreferences') return;
    setLoadingModulePrefs(true);
    getLatestModulePreferenceRequest()
      .then((req) => {
        setModulePrefRequest(req);
        setSelectedPrefModuleIds(new Set());
      })
      .catch((e) => {
        console.error('Failed to load module preference request', e);
        setModulePrefRequest(null);
      })
      .finally(() => setLoadingModulePrefs(false));
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'leave') return;
    setLoadingLeaves(true);
    getMyLeaveRequests()
      .then((items) => setLeaveRequests(items))
      .catch((e) => {
        console.error('Failed to load my leave requests', e);
        setLeaveRequests([]);
      })
      .finally(() => setLoadingLeaves(false));
  }, [activeMenu]);

  useEffect(() => {
    if (activeMenu !== 'myJd') return;
    setLoadingMyJd(true);
    getMyJobDescription()
      .then((dto) => {
        try {
          const parsed = dto?.content ? JSON.parse(dto.content) : null;
          setMyJdContent(parsed);
        } catch (e) {
          console.error('Failed to parse job description content', e);
          setMyJdContent(null);
        }
      })
      .catch((e) => {
        console.error('Failed to load my job description', e);
        setMyJdContent(null);
      })
      .finally(() => setLoadingMyJd(false));
  }, [activeMenu]);

  const upcomingReminders = [
    { task: 'Tutorial Session - Marketing 201', priority: 'urgent', date: 'Oct 20, 2025' },
    { task: 'Assignment Marking Deadline', priority: 'urgent', date: 'Oct 21, 2025' },
    { task: 'Mentor Meeting with Dr. Mahanama', priority: 'medium', date: 'Oct 23, 2025' },
    { task: 'Research Proposal Submission', priority: 'medium', date: 'Oct 28, 2025' },
    { task: 'Contract Renewal Discussion', priority: 'normal', date: 'Nov 15, 2025' },
  ];

  const recentActivities = [
    { activity: 'Marked Task as Complete', detail: 'Prepare Lecture Notes - Week 6', time: '2:30 PM', date: 'Oct 18, 2025' },
    { activity: 'Applied for Research Project', detail: 'Consumer Behavior Study', time: '11:00 AM', date: 'Oct 18, 2025' },
    { activity: 'Requested Leave', detail: 'Medical Leave on Oct 30', time: '9:15 AM', date: 'Oct 17, 2025' },
    { activity: 'Submitted Monthly Report', detail: 'September Activity Report', time: '4:00 PM', date: 'Oct 16, 2025' },
    { activity: 'Attended Department Meeting', detail: 'Monthly Review Meeting', time: '10:00 AM', date: 'Oct 15, 2025' },
  ];

  const systemNotifications = [
    {
      title: 'System Maintenance Scheduled',
      message: 'System maintenance on Oct 25, 2:00–4:00 AM.',
      date: 'Oct 20'
    },
    {
      title: 'New Research Project Posted',
      message: 'Dr. Fernando posted a new research opportunity in Supply Chain.',
      date: 'Oct 19'
    },
    {
      title: 'Salary Report Available',
      message: 'Your September salary report is now available for download.',
      date: 'Oct 18'
    },
    {
      title: 'Contract Renewal Reminder',
      message: 'Your contract expires in 45 days. Please contact HR for renewal.',
      date: 'Oct 15'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Decorative Background Shapes */}
      <div className="fixed top-0 left-0 w-96 h-96 bg-[#4db4ac] opacity-5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#4db4ac] opacity-5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#4db4ac] shadow-md z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-white" style={{ fontWeight: 700, fontSize: '20px' }}>
            Temporary Staff Coordination System
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-white hover:bg-[#3c9a93] px-3 py-2 rounded-lg transition-colors">
                <Avatar className="h-8 w-8 border-2 border-white">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback className="bg-white text-[#4db4ac]">SP</AvatarFallback>
                </Avatar>
                <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-white">
              <DropdownMenuItem className="cursor-pointer">
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex pt-16">
        {/* Left Sidebar Navigation */}
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg overflow-y-auto border-r border-[#e0e0e0]">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              const showModulePrefsBadge =
                item.id === 'modulePreferences' && !!modulePrefRequest && modulePrefRequest.submittedByMe !== true;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[#4db4ac] text-white shadow-md'
                      : 'text-[#555555] hover:bg-[#f0f0f0]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ fontSize: '14px', fontWeight: isActive ? 600 : 500 }}
                    >
                      {item.label}
                    </span>
                    {showModulePrefsBadge && (
                      <span
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 9999,
                          backgroundColor: '#dc2626', // red-600 (forced, not Tailwind-dependent)
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700,
                          lineHeight: 1,
                        }}
                        aria-label="New module preference request"
                        title="New module preference request"
                      >
                        1
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 p-6 space-y-6 pb-20">
          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Profile Card */}
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
                      Temporary Lecturer
                    </p>
                    <p className="text-[#555555] mb-3" style={{ fontSize: '14px' }}>
                      Department of Industrial Management
                    </p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <UserCheck className="h-4 w-4 text-[#4db4ac]" />
                      <span className="text-[#555555]" style={{ fontSize: '14px' }}>
                        Mentor: 
                      </span>
                      <Badge className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]" style={{ fontSize: '12px' }}>
                        Dr. T. Mahanama
                      </Badge>
                    </div>
                    
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
                      className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
                      onClick={() => setEditProfileOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Quick Stats + Next Task */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, index) => (
                  <Card 
                    key={index} 
                    className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-5 border-t-4"
                    style={{ borderTopColor: stat.color }}
                  >
                    <p className="text-[#555555] mb-2" style={{ fontSize: '13px', fontWeight: 500 }}>
                      {stat.label}
                    </p>
                    <p className="text-[#222222]" style={{ fontSize: '32px', fontWeight: 700 }}>
                      {stat.value}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Next Task Card */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-[#4db4ac]" />
                  <h3 className="text-[#555555]" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Next Task
                  </h3>
                </div>
                {loadingNextTask ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#4db4ac]" />
                ) : nextTask ? (
                  <>
                    <p className="text-[#222222]" style={{ fontSize: '48px', fontWeight: 700, lineHeight: 1 }}>
                      {nextTask.timeUntil}
                    </p>
                    <p className="text-[#555555] mt-3" style={{ fontSize: '14px', fontWeight: 500 }}>
                      {nextTask.dateTimeLabel}
                    </p>
                    <p className="text-[#4db4ac] mt-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                      {nextTask.title}
                    </p>
                    <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                      {nextTask.timeFrom} – {nextTask.timeTo}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-3 text-[#4db4ac] hover:text-[#3c9a93] p-0"
                      onClick={() => setActiveMenu('weeklyTasks')}
                    >
                      View weekly timetable →
                    </Button>
                  </>
                ) : (
                  <p className="text-[#999999]" style={{ fontSize: '14px' }}>
                    No upcoming tasks this week.{' '}
                    <button className="text-[#4db4ac] underline" onClick={() => setActiveMenu('weeklyTasks')}>
                      Set up your timetable
                    </button>
                  </p>
                )}
              </Card>

              {/* Recent Activities Section */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
                  Recent Activities
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
                          {activity.detail}
                        </p>
                        <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                          {activity.time} • {activity.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* My JD View */}
          {activeMenu === 'myJd' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  My JD
                </h3>
                <Badge className="bg-[#4db4ac] text-white">FR13</Badge>
              </div>
              <Separator className="mb-4" />

              {loadingMyJd && (
                <div className="text-center py-10 text-[#4db4ac]" style={{ fontSize: '14px' }}>
                  Loading your job description…
                </div>
              )}

              {!loadingMyJd && !myJdContent && (
                <div className="text-center py-10 text-[#999999]" style={{ fontSize: '14px' }}>
                  No job description has been assigned to you yet.
                </div>
              )}

              {!loadingMyJd && myJdContent && (
                <div className="space-y-6">
                  {/* 1) Academic year */}
                  <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      Academic Year
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {myJdContent.academicYear || '—'}
                    </p>
                  </Card>

                  {/* 2) Semester */}
                  <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      Semester
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {myJdContent.semester || '—'}
                    </p>
                  </Card>

                  {/* 3) Semester start date */}
                  <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      Semester Start Date
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {myJdContent.semesterStartDate || '—'}
                    </p>
                  </Card>

                  {/* 4) End date */}
                  <Card className="bg-[#f9f9f9] border border-[#e0e0e0] p-4">
                    <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      Semester End Date
                    </p>
                    <p className="text-[#555555]" style={{ fontSize: '13px' }}>
                      {myJdContent.semesterEndDate || '—'}
                    </p>
                  </Card>

                  {/* 5) Primary responsibilities */}
                  <div>
                    <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                      Primary Responsibilities
                    </h4>
                    <Card className="bg-white border border-[#e0e0e0] p-4">
                      <pre className="whitespace-pre-wrap text-[#222222]" style={{ fontSize: '13px', lineHeight: '1.7', fontFamily: 'inherit' }}>
                        {myJdContent.primaryResponsibilities || '—'}
                      </pre>
                    </Card>
                  </div>

                  {/* 6) DIM academic tasks */}
                  <div>
                    <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                      DIM Academic Tasks
                    </h4>
                    <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#f5f5f5] text-[#222222]">
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Course code</th>
                            <th className="px-3 py-2 text-left font-semibold min-w-[240px]">Module name</th>
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Chief tutor</th>
                            <th className="px-3 py-2 text-left font-semibold min-w-[220px]">Main duty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(myJdContent.dimAcademicTasks || []).map((t: any, idx: number) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                              <td className="px-3 py-2 font-medium text-[#222222] whitespace-nowrap">{t.courseCode || '—'}</td>
                              <td className="px-3 py-2 text-[#333333]">{t.moduleName || '—'}</td>
                              <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{t.chiefTutor || '—'}</td>
                              <td className="px-3 py-2 text-[#555555]">{t.mainDuty || '—'}</td>
                            </tr>
                          ))}
                          {(!myJdContent.dimAcademicTasks || myJdContent.dimAcademicTasks.length === 0) && (
                            <tr>
                              <td className="px-3 py-3 text-[#999999]" colSpan={4}>—</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 7) FOS academic tasks */}
                  <div>
                    <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                      FOS Academic Tasks
                    </h4>
                    <div className="overflow-x-auto rounded-md border border-[#e0e0e0] bg-white">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-[#f5f5f5] text-[#222222]">
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Course code</th>
                            <th className="px-3 py-2 text-left font-semibold min-w-[240px]">Module name</th>
                            <th className="px-3 py-2 text-left font-semibold whitespace-nowrap">Tutor</th>
                            <th className="px-3 py-2 text-left font-semibold min-w-[220px]">Main duty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(myJdContent.fosAcademicTasks || []).map((t: any, idx: number) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fafafa]'}>
                              <td className="px-3 py-2 font-medium text-[#222222] whitespace-nowrap">{t.courseCode || '—'}</td>
                              <td className="px-3 py-2 text-[#333333]">{t.moduleName || '—'}</td>
                              <td className="px-3 py-2 text-[#555555] whitespace-nowrap">{t.tutorName || '—'}</td>
                              <td className="px-3 py-2 text-[#555555]">{t.mainDuty || '—'}</td>
                            </tr>
                          ))}
                          {(!myJdContent.fosAcademicTasks || myJdContent.fosAcademicTasks.length === 0) && (
                            <tr>
                              <td className="px-3 py-3 text-[#999999]" colSpan={4}>—</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 8) Administrative tasks assigned (with coordinator + description) */}
                  <div>
                    <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                      Administrative Tasks Assigned
                    </h4>
                    <div className="space-y-2">
                      {(myJdContent.administrativeTasks || []).map((t: any, idx: number) => (
                        <Card key={idx} className="bg-white border border-[#e0e0e0] p-4">
                          <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                            {t.taskName || 'Administrative task'}
                          </p>
                          <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                            Coordinator: {t.coordinator || '—'}
                          </p>
                          <pre className="whitespace-pre-wrap text-[#333333] mt-2" style={{ fontSize: '13px', lineHeight: '1.7', fontFamily: 'inherit' }}>
                            {t.description || '—'}
                          </pre>
                        </Card>
                      ))}
                      {(!myJdContent.administrativeTasks || myJdContent.administrativeTasks.length === 0) && (
                        <p className="text-[#999999]" style={{ fontSize: '13px' }}>—</p>
                      )}
                    </div>
                  </div>

                  {/* 9) Reception task */}
                  <div>
                    <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 700 }}>
                      Reception Task
                    </h4>
                    <div className="space-y-2">
                      {(myJdContent.receptionTasks || []).map((t: any, idx: number) => (
                        <Card key={idx} className="bg-white border border-[#e0e0e0] p-4">
                          <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                            {formatReceptionTime(t) || '—'}
                          </p>
                          <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                            {t.notes || '—'}
                          </p>
                        </Card>
                      ))}
                      {(!myJdContent.receptionTasks || myJdContent.receptionTasks.length === 0) && (
                        <p className="text-[#999999]" style={{ fontSize: '13px' }}>—</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* ── My Weekly Tasks ─────────────────────────────── */}
          {activeMenu === 'weeklyTasks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>My Weekly Tasks</h2>
                <p className="text-[#777777]" style={{ fontSize: '13px' }}>
                  Reminders are sent 15 minutes before each task (Sri Lanka time).
                </p>
              </div>

              {/* Editor Card */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ListTodo className="h-5 w-5 text-[#4db4ac]" />
                  <h3 className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>Edit Timetable</h3>
                </div>
                <Separator className="mb-4" />

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left bg-[#f9f9f9]">
                        <th className="px-3 py-2 text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>Day</th>
                        <th className="px-3 py-2 text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>From</th>
                        <th className="px-3 py-2 text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>To</th>
                        <th className="px-3 py-2 text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>Task</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {taskRows.map((row, i) => (
                        <tr key={i} className="border-t border-[#f0f0f0]">
                          <td className="px-3 py-2">
                            <select
                              value={row.dayOfWeek}
                              onChange={e => setTaskRows(prev => prev.map((r, idx) => idx === i ? { ...r, dayOfWeek: e.target.value as DayName } : r))}
                              className="border border-[#e0e0e0] rounded-lg px-2 py-1.5 text-[#222222] focus:border-[#4db4ac] outline-none"
                              style={{ fontSize: '13px' }}
                            >
                              {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="time"
                              value={row.timeFrom}
                              onChange={e => setTaskRows(prev => prev.map((r, idx) => idx === i ? { ...r, timeFrom: e.target.value } : r))}
                              className="border border-[#e0e0e0] rounded-lg px-2 py-1.5 text-[#222222] focus:border-[#4db4ac] outline-none"
                              style={{ fontSize: '13px' }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="time"
                              value={row.timeTo}
                              onChange={e => setTaskRows(prev => prev.map((r, idx) => idx === i ? { ...r, timeTo: e.target.value } : r))}
                              className="border border-[#e0e0e0] rounded-lg px-2 py-1.5 text-[#222222] focus:border-[#4db4ac] outline-none"
                              style={{ fontSize: '13px' }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              placeholder="Task description"
                              value={row.title}
                              onChange={e => setTaskRows(prev => prev.map((r, idx) => idx === i ? { ...r, title: e.target.value } : r))}
                              className="border border-[#e0e0e0] rounded-lg px-2 py-1.5 text-[#222222] w-full focus:border-[#4db4ac] outline-none"
                              style={{ fontSize: '13px', minWidth: '200px' }}
                            />
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setTaskRows(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-400 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setTaskRows(prev => [...prev, { dayOfWeek: 'Monday', timeFrom: '08:00', timeTo: '09:00', title: '' }])}
                    className="border-[#4db4ac] text-[#4db4ac]"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                  </Button>
                  <Button
                    disabled={savingWeeklyTasks}
                    onClick={async () => {
                      const valid = taskRows.filter(r => r.title.trim());
                      if (valid.length === 0) { alert('Add at least one task with a title.'); return; }
                      setSavingWeeklyTasks(true);
                      try {
                        const saved = await saveMyWeeklyTasks(valid);
                        setWeeklyTasks(saved);
                        alert('Weekly timetable saved!');
                        // Refresh next task
                        getMyNextTask().then(setNextTask).catch(() => {});
                      } catch (e: any) {
                        alert(e?.message || 'Failed to save');
                      } finally {
                        setSavingWeeklyTasks(false);
                      }
                    }}
                    className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                  >
                    {savingWeeklyTasks ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Weekly Timetable
                  </Button>
                </div>
              </Card>

              {/* Saved Timetable grouped by day */}
              {loadingWeeklyTasks ? (
                <div className="flex items-center gap-2 text-[#4db4ac]">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading timetable…
                </div>
              ) : weeklyTasks.length > 0 ? (
                <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                  <h3 className="text-[#222222] mb-4" style={{ fontSize: '18px', fontWeight: 700 }}>Saved Weekly Timetable</h3>
                  <Separator className="mb-4" />
                  <div className="space-y-5">
                    {(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'] as DayName[]).map(day => {
                      const dayTasks = weeklyTasks.filter(t => t.dayOfWeek === day);
                      if (dayTasks.length === 0) return null;
                      return (
                        <div key={day}>
                          <p className="text-[#4db4ac] mb-2" style={{ fontSize: '14px', fontWeight: 700 }}>{day}</p>
                          <div className="space-y-2">
                            {dayTasks.map(task => (
                              <div key={task.id} className="flex items-center justify-between bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg px-4 py-3">
                                <div>
                                  <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 500 }}>{task.title}</p>
                                  <p className="text-[#777777]" style={{ fontSize: '12px' }}>{task.timeFrom} – {task.timeTo}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {task.status === 'completed' ? (
                                    <Badge className="bg-green-100 text-green-700 border border-green-300">Done</Badge>
                                  ) : task.status === 'in_progress' ? (
                                    <Badge className="bg-blue-100 text-blue-700 border border-blue-300">In Progress</Badge>
                                  ) : (
                                    <Badge className="bg-orange-100 text-orange-700 border border-orange-300">Pending</Badge>
                                  )}
                                  {task.status !== 'completed' && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-green-700 border-green-300"
                                      onClick={async () => {
                                        try {
                                          const updated = await updateWeeklyTaskStatus(task.id, 'completed');
                                          setWeeklyTasks(prev => prev.map(t => t.id === task.id ? updated : t));
                                          getMyNextTask().then(setNextTask).catch(() => {});
                                        } catch (e: any) {
                                          alert(e?.message || 'Failed to update');
                                        }
                                      }}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Done
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ) : (
                <p className="text-[#999999]" style={{ fontSize: '14px' }}>No tasks saved yet. Add rows above and click Save.</p>
              )}
            </div>
          )}

          {/* Leave Requests View (FR18, FR19) */}
          {activeMenu === 'leave' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                    Leave Requests
                  </h3>
                  <Badge className="bg-[#4db4ac] text-white">FR18</Badge>
                  <Badge className="bg-[#4db4ac] text-white">FR19</Badge>
                </div>
                <Button
                  onClick={() => setShowLeaveDialog(true)}
                  className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Apply for Leave
                </Button>
              </div>
              <Separator className="mb-4" />

              {loadingLeaves ? (
                <div className="flex items-center justify-center py-10 text-[#4db4ac]" style={{ fontSize: '14px' }}>
                  Loading leave requests…
                </div>
              ) : (
              <div className="space-y-4">
                {leaveRequests.map((leave) => (
                  <Card 
                    key={leave.id} 
                    className={`border-2 rounded-lg p-5 ${
                      leave.status === 'pending' 
                        ? 'border-orange-300 bg-orange-50' 
                        : leave.status === 'approved'
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                            Leave Request #{leave.id}
                          </h4>
                          <Badge 
                            className={`${
                              leave.status === 'pending' 
                                ? 'bg-orange-100 text-orange-700 border-orange-300' 
                                : leave.status === 'approved'
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-red-100 text-red-700 border-red-300'
                            } border`}
                            style={{ fontSize: '10px' }}
                          >
                            {leave.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                              Leave Date
                            </p>
                            <p className="text-[#222222]" style={{ fontSize: '14px' }}>
                              {leave.leaveDate
                                ? new Date(leave.leaveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                              Substitute Staff
                            </p>
                            <p className="text-[#222222]" style={{ fontSize: '14px' }}>
                              {leave.substituteName || '—'}
                            </p>
                          </div>
                        </div>

                        <div className="mb-2">
                          <p className="text-[#555555]" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Reason
                          </p>
                          <p className="text-[#222222]" style={{ fontSize: '14px' }}>
                            {leave.reason}
                          </p>
                        </div>

                        {leave.status === 'approved' && (
                          <div className="bg-green-100 border border-green-300 rounded-lg px-3 py-2 mt-3">
                            <p className="text-green-700" style={{ fontSize: '13px' }}>
                              ✓ Approved by {leave.approvedByName || '—'}
                              {leave.approvedAt ? ` on ${new Date(leave.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                            </p>
                          </div>
                        )}

                        {leave.status === 'rejected' && (
                          <div className="bg-red-50 border border-red-300 rounded-lg px-3 py-2 mt-3">
                            <p className="text-red-700" style={{ fontSize: '13px' }}>
                              ✕ Rejected{leave.rejectionReason ? `: ${leave.rejectionReason}` : ''}
                            </p>
                          </div>
                        )}

                        <p className="text-[#999999] mt-2" style={{ fontSize: '12px' }}>
                          Submitted: {leave.submittedAt ? new Date(leave.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}

                {leaveRequests.length === 0 && (
                  <div className="text-center py-12 text-[#999999]">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p style={{ fontSize: '14px' }}>No leave requests yet</p>
                  </div>
                )}
              </div>
              )}
            </Card>
          )}

          {/* Research Opportunities View */}
          {activeMenu === 'research' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
                Research Opportunities
              </h3>
              <Separator className="mb-4" />
              
              <div className="space-y-4">
                {loadingResearch && (
                  <Card className="bg-white border border-[#e0e0e0] rounded-lg p-4 text-center text-[#4db4ac]">
                    Loading research opportunities…
                  </Card>
                )}

                {!loadingResearch && openResearch.map((research) => (
                  <Card key={research.id} className="bg-white border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <h5 className="text-[#222222] flex-1" style={{ fontSize: '15px', fontWeight: 600 }}>
                        {research.title}
                      </h5>
                      <Badge className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]" style={{ fontSize: '11px' }}>
                        {research.createdByName || 'Senior Staff'}
                      </Badge>
                    </div>
                    <p className="text-[#555555] mb-3" style={{ fontSize: '13px' }}>
                      {research.description || ''}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                        {research.createdAt ? `Posted: ${new Date(research.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                      </p>
                      {(() => {
                        const app = myApplications.find(a => a.opportunityId === research.id);
                        if (!app) {
                          return (
                            <Button 
                              size="sm" 
                              className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
                              onClick={() => handleResearchApply(research.id)}
                            >
                              Apply
                            </Button>
                          );
                        }

                        if (app.status === 'accepted') {
                          return (
                            <Button size="sm" className="bg-green-600 text-white rounded-lg cursor-default" disabled>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accepted{research.createdByName ? ` by ${research.createdByName}` : ''}
                            </Button>
                          );
                        }

                        if (app.status === 'rejected') {
                          return (
                            <Button size="sm" variant="outline" className="border-red-500 text-red-600 rounded-lg cursor-default" disabled>
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejected{research.createdByName ? ` by ${research.createdByName}` : ''}
                            </Button>
                          );
                        }

                        return (
                          <Button size="sm" className="bg-green-600 text-white rounded-lg cursor-default" disabled>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Applied
                          </Button>
                        );
                      })()}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Module Preferences View */}
          {activeMenu === 'modulePreferences' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-[#4db4ac]" />
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Module Preferences
                </h3>
              </div>
              <Separator className="mb-6" />

              {loadingModulePrefs && (
                <Card className="bg-white border border-[#e0e0e0] rounded-lg p-4 text-center text-[#4db4ac]">
                  Loading module request…
                </Card>
              )}

              {!loadingModulePrefs && !modulePrefRequest && (
                <div className="text-center py-12 text-[#999999]">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p style={{ fontSize: '14px' }}>No module preferences request yet.</p>
                </div>
              )}

              {!loadingModulePrefs && modulePrefRequest && (
                <div className="space-y-4">
                  {modulePrefRequest.message ? (
                    <Card className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4">
                      <p className="text-[#555555]" style={{ fontSize: '13px', lineHeight: '1.6' }}>
                        {modulePrefRequest.message}
                      </p>
                    </Card>
                  ) : null}

                  <div className="space-y-2">
                    <p className="text-[#555555]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Select your preferred modules:
                    </p>

                    <div className="space-y-2">
                      {modulePrefRequest.modules.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start gap-3 p-3 rounded-lg border border-[#e0e0e0] hover:bg-[#f9f9f9] transition-colors"
                        >
                          <Checkbox
                            checked={selectedPrefModuleIds.has(m.id)}
                            onCheckedChange={(c) => {
                              setSelectedPrefModuleIds((prev) => {
                                const next = new Set(prev);
                                if (c === true) next.add(m.id);
                                else next.delete(m.id);
                                return next;
                              });
                            }}
                            className="mt-1 data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
                            disabled={modulePrefRequest.submittedByMe}
                          />

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 700 }}>
                                  {m.code} — {m.name}
                                </p>
                                <p className="text-[#777777]" style={{ fontSize: '12px' }}>
                                  Level {m.academicLevel} • Semester {m.semesterLabel} • {m.credits} credits
                                </p>
                                <p className="text-[#777777]" style={{ fontSize: '12px' }}>
                                  Chief Tutor: {m.chiefTutor && String(m.chiefTutor).trim() ? m.chiefTutor : '—'}
                                </p>
                              </div>
                              <Badge className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]" style={{ fontSize: '11px' }}>
                                {m.programKind === 'ALL' ? 'MIT/IT' : m.programKind}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    {modulePrefRequest.submittedByMe && (
                      <Badge className="bg-green-100 text-green-700 border border-green-300" style={{ fontSize: '12px' }}>
                        Preferences submitted
                      </Badge>
                    )}
                    <Button
                      className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
                      disabled={
                        submittingModulePrefs ||
                        modulePrefRequest.submittedByMe ||
                        selectedPrefModuleIds.size === 0
                      }
                      onClick={async () => {
                        if (!modulePrefRequest) return;
                        try {
                          setSubmittingModulePrefs(true);
                          await submitModulePreferences({
                            requestId: modulePrefRequest.id,
                            moduleIds: Array.from(selectedPrefModuleIds),
                          });
                          setModulePrefRequest({ ...modulePrefRequest, submittedByMe: true });
                          alert('Module preferences sent successfully!');
                        } catch (e: any) {
                          alert(`Send failed: ${e?.message || 'Unknown error'}`);
                        } finally {
                          setSubmittingModulePrefs(false);
                        }
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Module Preferences
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Notifications View (FR16) */}
          {activeMenu === 'notifications' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <BellRing className="h-6 w-6 text-[#4db4ac]" />
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Notifications
                </h3>
                <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '10px' }}>
                  FR16
                </Badge>
              </div>
              <Separator className="mb-6" />
              
              <SystemNotices userRole="staff" />
            </Card>
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
                      Temporary Staff
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
                      Work Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Tasks Completed</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>125</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Attendance Rate</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>95%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Modules Assigned</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>3</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="mb-6">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="text-[#222222]" style={{ fontWeight: 600, fontSize: '16px' }}>
                      Preferred Subjects
                    </h3>
                    <Button
                      variant="outline"
                      className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                      onClick={() => setEditSubjectsOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Subjects
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {preferredSubjects.length > 0 ? (
                      preferredSubjects.map((s, idx) => (
                        <Badge
                          key={`${s}-${idx}`}
                          className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]"
                          style={{ fontSize: '11px' }}
                        >
                          {s}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-[#999999]" style={{ fontSize: '13px' }}>
                        —
                      </span>
                    )}
                  </div>
                </div>

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

      </div>

      {/* View Job Description Dialog */}
      {/* Leave Application Dialog */}
      <LeaveApplicationDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        currentUserSubjects={preferredSubjects}
        currentUserId={currentUserId}
        onSubmit={handleLeaveSubmit}
      />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        currentProfile={profileData}
        onSave={handleProfileSave}
      />

      <Dialog open={editSubjectsOpen} onOpenChange={setEditSubjectsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
              Edit Preferred Subjects
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSubjects.map((subject) => (
                <div key={subject} className="flex items-center space-x-2">
                  <Checkbox
                    id={`pref-${subject}`}
                    checked={preferredSubjects.includes(subject)}
                    onCheckedChange={() => {
                      setPreferredSubjects((prev) =>
                        prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
                      );
                    }}
                    className="border-[#4db4ac] data-[state=checked]:bg-[#4db4ac] data-[state=checked]:border-[#4db4ac]"
                  />
                  <label
                    htmlFor={`pref-${subject}`}
                    className="text-[#555555] cursor-pointer"
                    style={{ fontSize: '14px' }}
                  >
                    {subject}
                  </label>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setEditSubjectsOpen(false)}
                disabled={subjectsSaving}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                disabled={subjectsSaving}
                onClick={async () => {
                  setSubjectsSaving(true);
                  try {
                    const api = await import('../services/api');
                    const updated = await api.updateMyPreferredSubjects(preferredSubjects);
                    setPreferredSubjects(updated.preferredSubjects ?? preferredSubjects);
                    setEditSubjectsOpen(false);
                  } finally {
                    setSubjectsSaving(false);
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