import { useState, useEffect } from 'react';
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
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Trash2,
  FileText,
  Calendar,
  Play,
  ClipboardList,
  Loader2,
} from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import SystemNotices from './SystemNotices';
import ViewJobDescriptionDialog from './ViewJobDescriptionDialog';
import UpcomingInterviewDetailsDialog from './UpcomingInterviewDetailsDialog';
import InterviewMarkingPage from './InterviewMarkingPage';
import ResearchDetailsDialog from './ResearchDetailsDialog';
import AddResearchDialog from './AddResearchDialog';
import EditResearchDialog from './EditResearchDialog';
import EditProfileDialog from './EditProfileDialog';
import { createResearchOpportunity, deleteResearchOpportunity, getInterviews, getInterviewCandidates, getActiveSession, getMarkingScheme, getMyResearchOpportunities, MarkingSchemeData, ResearchOpportunityDto, SessionState, updateResearchOpportunity } from '../services/api';

interface MentorProfileProps {
  onLogout?: () => void;
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
  const [showJdDialog, setShowJdDialog] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<Mentee | null>(null);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<'main' | 'interviewMarking'>('main');
  const [showResearchDialog, setShowResearchDialog] = useState(false);
  const [selectedResearch, setSelectedResearch] = useState<any>(null);
  const [showAddResearchDialog, setShowAddResearchDialog] = useState(false);
  const [showEditResearchDialog, setShowEditResearchDialog] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [myResearch, setMyResearch] = useState<ResearchOpportunityDto[]>([]);
  const [loadingResearch, setLoadingResearch] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    avatarUrl: '',
    initials: '...'
  });

  // Live session polling
  const [liveSession, setLiveSession] = useState<SessionState | null>(null);
  // Marking scheme fetched from backend when active in a session
  const [markingScheme, setMarkingScheme] = useState<MarkingSchemeData | null>(null);
  const [loadingScheme, setLoadingScheme] = useState(false);
  // Candidates for the live interview
  const [liveCandidates, setLiveCandidates] = useState<{ id: string; name: string; email: string; phone: string }[]>([]);

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
            initials
          });
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

  // Poll backend for live session every 5s
  useEffect(() => {
    const check = async () => {
      try { setLiveSession(await getActiveSession()); } catch { /* ignore */ }
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);

  // When we become active in a session, fetch the marking scheme + candidates
  useEffect(() => {
    if (liveSession?.myStatus === 'active' && liveSession.interviewId) {
      setLoadingScheme(true);
      Promise.all([
        getMarkingScheme(liveSession.interviewId),
        getInterviewCandidates(liveSession.interviewId),
      ])
        .then(([scheme, cands]) => {
          setMarkingScheme(scheme);
          setLiveCandidates(cands.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
          })));
        })
        .catch(e => console.error('Failed to load scheme/candidates', e))
        .finally(() => setLoadingScheme(false));
    } else if (!liveSession || liveSession.myStatus !== 'active') {
      setMarkingScheme(null);
      setLiveCandidates([]);
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

  const mentorStats = [
    { label: 'Total Mentees Assigned', value: '6', color: '#222222' },
    { label: 'Active Research Posts', value: '3', color: '#222222' },
    { label: 'Pending Reviews', value: '2', color: '#f7a541' },
  ];

  const mentees: Mentee[] = [
    {
      id: 'STAFF001',
      name: 'Mr. Saman Perera',
      email: 'saman.perera@kln.ac.lk',
      phone: '+94 77 123 4567',
      module: 'Marketing Management',
      contractExpiry: '2025-12-31',
      tasksCompleted: 12,
      lastActivity: 'Oct 18, 2025',
      jobDescription: {
        staffId: 'STAFF001',
        staffName: 'Mr. Saman Perera',
        tasks: [
          { id: '1', description: 'Conduct tutorial sessions for Marketing Management (MKT 301)', type: 'academic' },
          { id: '2', description: 'Prepare and grade assignments for Consumer Behavior course', type: 'academic' },
          { id: '3', description: 'Assist with student registration and documentation', type: 'administrative' },
          { id: '4', description: 'Support department events and workshops', type: 'administrative' }
        ],
        createdDate: 'Oct 15, 2025',
        createdBy: 'Dr. Thilini Mahanama (Coordinator)'
      }
    },
    {
      id: 'STAFF002',
      name: 'Ms. Nimesha Silva',
      email: 'nimesha.silva@kln.ac.lk',
      phone: '+94 76 234 5678',
      module: 'Consumer Behavior',
      contractExpiry: '2026-01-15',
      tasksCompleted: 8,
      lastActivity: 'Oct 17, 2025',
      jobDescription: {
        staffId: 'STAFF002',
        staffName: 'Ms. Nimesha Silva',
        tasks: [
          { id: '1', description: 'Conduct laboratory sessions for Consumer Behavior (CB 202)', type: 'academic' },
          { id: '2', description: 'Grade mid-term examination papers', type: 'academic' },
          { id: '3', description: 'Coordinate with department for course materials', type: 'administrative' }
        ],
        createdDate: 'Oct 12, 2025',
        createdBy: 'Dr. Thilini Mahanama (Coordinator)'
      }
    },
    {
      id: 'STAFF003',
      name: 'Mr. Kavinda Jayasuriya',
      email: 'kavinda.j@kln.ac.lk',
      phone: '+94 75 345 6789',
      module: 'Brand Management',
      contractExpiry: '2025-11-30',
      tasksCompleted: 15,
      lastActivity: 'Oct 19, 2025',
      jobDescription: {
        staffId: 'STAFF003',
        staffName: 'Mr. Kavinda Jayasuriya',
        tasks: [
          { id: '1', description: 'Conduct tutorial sessions for Brand Management (BM 305)', type: 'academic' },
          { id: '2', description: 'Supervise student projects and presentations', type: 'academic' },
          { id: '3', description: 'Maintain course records and attendance', type: 'administrative' }
        ],
        createdDate: 'Oct 10, 2025',
        createdBy: 'Dr. Thilini Mahanama (Coordinator)'
      }
    },
  ];

  const upcomingInterviews = [
    {
      id: 'INT001',
      interviewNumber: 'Interview #2025-04',
      date: '2025-10-25',
      candidateCount: 8,
      status: 'upcoming' as const,
      candidates: [
        { id: 'CAND001', name: 'K.M. Silva', email: 'k.silva@example.com', phone: '+94 77 123 4567' },
        { id: 'CAND002', name: 'A.B. Perera', email: 'a.perera@example.com', phone: '+94 76 234 5678' },
        { id: 'CAND003', name: 'N.D. Fernando', email: 'n.fernando@example.com', phone: '+94 75 345 6789' },
        { id: 'CAND004', name: 'S.R. Wijesinghe', email: 's.wijesinghe@example.com', phone: '+94 71 456 7890' },
        { id: 'CAND005', name: 'P.K. Jayawardena', email: 'p.jayawardena@example.com', phone: '+94 77 567 8901' },
        { id: 'CAND006', name: 'M.A. Rajapaksa', email: 'm.rajapaksa@example.com', phone: '+94 76 678 9012' },
        { id: 'CAND007', name: 'R.T. Dissanayake', email: 'r.dissanayake@example.com', phone: '+94 75 789 0123' },
        { id: 'CAND008', name: 'L.K. Gunasekara', email: 'l.gunasekara@example.com', phone: '+94 71 890 1234' },
      ]
    },
    {
      id: 'INT002',
      interviewNumber: 'Interview #2025-05',
      date: '2025-11-05',
      candidateCount: 12,
      status: 'upcoming' as const,
      candidates: [
        { id: 'CAND009', name: 'T.M. Karunaratne', email: 't.karunaratne@example.com', phone: '+94 77 901 2345' },
        { id: 'CAND010', name: 'D.S. Wickramasinghe', email: 'd.wickramasinghe@example.com', phone: '+94 76 012 3456' },
        { id: 'CAND011', name: 'H.P. Amarasinghe', email: 'h.amarasinghe@example.com', phone: '+94 75 123 4567' },
        { id: 'CAND012', name: 'C.L. Senanayake', email: 'c.senanayake@example.com', phone: '+94 71 234 5678' },
        { id: 'CAND013', name: 'V.N. Herath', email: 'v.herath@example.com', phone: '+94 77 345 6789' },
        { id: 'CAND014', name: 'G.K. Mendis', email: 'g.mendis@example.com', phone: '+94 76 456 7890' },
        { id: 'CAND015', name: 'B.A. Samaraweera', email: 'b.samaraweera@example.com', phone: '+94 75 567 8901' },
        { id: 'CAND016', name: 'I.R. Perera', email: 'i.perera@example.com', phone: '+94 71 678 9012' },
        { id: 'CAND017', name: 'J.P. Bandara', email: 'j.bandara@example.com', phone: '+94 77 789 0123' },
        { id: 'CAND018', name: 'K.S. De Silva', email: 'k.desilva@example.com', phone: '+94 76 890 1234' },
        { id: 'CAND019', name: 'O.M. Kumara', email: 'o.kumara@example.com', phone: '+94 75 901 2345' },
        { id: 'CAND020', name: 'W.D. Ranasinghe', email: 'w.ranasinghe@example.com', phone: '+94 71 012 3456' },
      ]
    },
  ];

  useEffect(() => {
    if (activeMenu !== 'research') return;
    setLoadingResearch(true);
    getMyResearchOpportunities()
      .then(setMyResearch)
      .catch((e) => console.error('Failed to load research opportunities', e))
      .finally(() => setLoadingResearch(false));
  }, [activeMenu]);

  const upcomingReminders = [
    { task: 'Evaluation Submission Due - Mr. Kavinda Jayasuriya', priority: 'HIGH', date: 'Oct 21, 2025' },
    { task: 'Mentor Meeting - Weekly Check-in', priority: 'MEDIUM', date: 'Oct 25, 2025' },
    { task: 'Research Review Deadline - Consumer Behavior Study', priority: 'HIGH', date: 'Oct 30, 2025' },
    { task: 'Department Research Presentation', priority: 'MEDIUM', date: 'Nov 2, 2025' },
    { task: 'Mentee Progress Report Submission', priority: 'LOW', date: 'Nov 5, 2025' },
  ];

  const recentActivities = [
    { activity: 'Published new research post', detail: 'Consumer Behavior Study in Digital Marketing', time: '3:15 PM', date: 'Oct 18, 2025' },
    { activity: 'Submitted evaluation for candidate', detail: 'Mr. Ravindu Bandara - Marking Assignment', time: '1:45 PM', date: 'Oct 18, 2025' },
    { activity: 'Reviewed mentee progress report', detail: 'Mr. Saman Perera - Monthly Progress', time: '10:30 AM', date: 'Oct 18, 2025' },
    { activity: 'Scheduled mentor meeting', detail: 'Weekly Check-in Session', time: '9:00 AM', date: 'Oct 17, 2025' },
  ];

  const calculateDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date('2025-10-20'); // Current date for demo
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadgeColor = (days: number) => {
    if (days < 30) return 'bg-red-100 text-red-700 border-red-300';
    if (days < 60) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const handleProfileSave = (updatedProfile: any) => {
    setProfileData({
      ...profileData,
      name: updatedProfile.name,
      email: updatedProfile.email,
      phone: updatedProfile.phone,
      avatarUrl: updatedProfile.avatarUrl || profileData.avatarUrl
    });

    if (updatedProfile.newPassword) {
      alert('Password changed successfully!');
    }

    alert('Profile updated successfully!');
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
            <DropdownMenuItem className="cursor-pointer hover:bg-[#f9f9f9] py-2" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4 text-red-500" />
              <span className="text-red-500">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

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
                  <span className="whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 mr-80 p-6 space-y-6 relative z-10">
          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <>
              {/* Profile Card */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <Avatar className="h-24 w-24 border-4 border-[#4db4ac] shadow-md">
                    <AvatarImage src={profileData.avatarUrl} alt={profileData.name} />
                    <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '28px', fontWeight: 700 }}>
                      {profileData.initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-[#222222] mb-1" style={{ fontSize: '24px', fontWeight: 700 }}>
                      {profileData.name}
                    </h2>
                    <p className="text-[#222222] mb-1" style={{ fontSize: '16px', fontWeight: 500 }}>
                      Senior Lecturer (Mentor)
                    </p>


                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="flex items-center gap-2 text-[#222222]" style={{ fontSize: '14px' }}>
                        <Mail className="h-4 w-4 text-[#4db4ac]" />
                        <span>{profileData.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[#222222]" style={{ fontSize: '14px' }}>
                        <Phone className="h-4 w-4 text-[#4db4ac]" />
                        <span>{profileData.phone}</span>
                      </div>
                    </div>

                    <Button
                      className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg px-6"
                      style={{ fontWeight: 600 }}
                      onClick={() => setEditProfileOpen(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Important Notices */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BellRing className="h-5 w-5 text-[#4db4ac]" />
                  <h3 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 700 }}>
                    Important Notices
                  </h3>
                </div>
                <SystemNotices userRole="mentor" />
              </Card>

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

              {/* Recent Activities */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
                  Recent Activities
                </h3>

                <div className="space-y-1">
                  {recentActivities.map((item, index) => (
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
                          {item.activity}
                        </p>
                        <p className="text-[#555555] mt-1" style={{ fontSize: '13px' }}>
                          {item.detail}
                        </p>
                        <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                          {item.time} • {item.date}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* My Mentees View */}
          {activeMenu === 'mentees' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  My Mentees
                </h2>
                <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                  {mentees.length} Total Mentees
                </Badge>
              </div>

              <div className="space-y-4">
                {mentees.map((mentee) => {
                  const daysUntilExpiry = calculateDaysUntilExpiry(mentee.contractExpiry);
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
                                {mentee.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h3 className="text-[#222222] mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>
                                {mentee.name}
                              </h3>

                              <div className="flex flex-wrap gap-3 text-[#555555]" style={{ fontSize: '13px' }}>
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-[#4db4ac]" />
                                  {mentee.email}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-[#4db4ac]" />
                                  {mentee.phone}
                                </div>
                              </div>
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
                            <p style={{ fontSize: '24px', fontWeight: 700 }}>
                              {Math.abs(daysUntilExpiry)} days
                            </p>
                            <p style={{ fontSize: '11px' }} className="mt-1">
                              Expires: {new Date(mentee.contractExpiry).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <Progress
                              value={Math.max(0, Math.min(100, (daysUntilExpiry / 90) * 100))}
                              className="h-2 mt-2"
                            />
                          </Card>

                          {/* Action Button */}
                          <Button
                            className="w-full bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                            onClick={() => {
                              setSelectedMentee(mentee);
                              setShowJdDialog(true);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
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

          {/* Interview Portal View */}
          {activeMenu === 'interview' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Interview Portal
                </h2>
              </div>

              {/* Live Session Status Banner */}
              {liveSession && (
                <Card className={`mb-6 rounded-xl p-4 border-0 ${liveSession.myStatus === 'active' ? 'bg-green-600' : liveSession.myStatus === 'waiting' ? 'bg-orange-500' : 'bg-red-500'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-white rounded-full p-2 flex-shrink-0">
                        {liveSession.myStatus === 'active' ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Clock className="h-5 w-5 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold text-base">
                          {liveSession.myStatus === 'active'
                            ? `You are in the live session — ${liveSession.interviewNumber}`
                            : liveSession.myStatus === 'waiting'
                            ? `Waiting for approval — ${liveSession.interviewNumber} is live`
                            : `You have been removed from ${liveSession.interviewNumber}`}
                        </p>
                        <p className="text-white/80 text-sm">
                          Started by {liveSession.startedByName}
                          {liveSession.myStatus === 'waiting' && ' · Waiting for coordinator/HOD to allow you in'}
                          {liveSession.myStatus === 'active' && ` · ${liveSession.activeParticipants.length} active participant(s)`}
                        </p>
                      </div>
                    </div>

                    {liveSession.myStatus === 'active' && (
                      <div className="flex-shrink-0">
                        {loadingScheme ? (
                          <div className="flex items-center gap-2 text-white/80 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading scheme…
                          </div>
                        ) : (
                          <Button
                            className="bg-white text-green-700 hover:bg-green-50 font-semibold"
                            onClick={() => setCurrentPage('interviewMarking')}
                          >
                            <ClipboardList className="h-4 w-4 mr-2" />
                            {markingScheme ? 'Enter Marks' : 'Enter Marks (No Scheme Set)'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show coordinator's scheme summary when active */}
                  {liveSession.myStatus === 'active' && markingScheme && (
                    <div className="mt-3 pt-3 border-t border-white/30">
                      <p className="text-white/80 text-xs mb-2 font-semibold">
                        MARKING SCHEME — created by {markingScheme.createdByName} · {markingScheme.criteria.length} criteria · max {markingScheme.totalMaxMarks} pts
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {markingScheme.criteria.map((c, i) => (
                          <span key={c.id} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                            {i + 1}. {c.name} ({c.maxMarks} pts)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Upcoming Interviews Section - Show Details Inline */}
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
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="h-5 w-5 text-[#4db4ac]" />
                            <p className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                              Interview Date
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>
                              {new Date(interview.date).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedInterview(interview);
                            setCurrentPage('interviewMarking');
                          }}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Interview
                        </Button>
                      </div>
                    </Card>

                    {/* Candidate Statistics */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                        <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                          Total Candidates
                        </p>
                        <p className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                          {interview.candidates.length}
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
                      <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
                        <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                          Days Until Interview
                        </p>
                        <p className="text-[#4db4ac]" style={{ fontSize: '24px', fontWeight: 700 }}>
                          {Math.abs(Math.ceil((new Date(interview.date).getTime() - new Date('2025-10-20').getTime()) / (1000 * 60 * 60 * 24)))}
                        </p>
                      </Card>
                    </div>

                    {/* Candidates List */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-5 w-5 text-[#4db4ac]" />
                        <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                          Candidates for This Interview
                        </h4>
                      </div>

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
                            {interview.candidates.map((candidate, index) => (
                              <TableRow key={candidate.id}>
                                <TableCell className="text-[#555555] py-2" style={{ fontSize: '13px' }}>
                                  {index + 1}
                                </TableCell>
                                <TableCell className="text-[#222222] py-2" style={{ fontSize: '13px', fontWeight: 500 }}>
                                  {candidate.id}
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
                                    onClick={() => alert(`Viewing CV for ${candidate.name}`)}
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
                    </div>
                  </div>
                </Card>
              ))}
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

          {/* Notifications View */}
          {activeMenu === 'notifications' && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[#222222]" style={{ fontSize: '24px', fontWeight: 700 }}>
                  Notifications
                </h2>
              </div>

              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BellRing className="h-5 w-5 text-[#4db4ac]" />
                  <h3 className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 700 }}>
                    Important Notices
                  </h3>
                </div>
                <SystemNotices userRole="mentor" />
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
                    <h3 className="text-[#222222] mb-4" style={{ fontWeight: 600, fontSize: '16px' }}>
                      Mentorship Statistics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Active Mentees</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>3</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Mentorship Years</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>5</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#555555]" style={{ fontSize: '14px' }}>Total Mentees Guided</span>
                        <span className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>12</span>
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

        {/* Right Sidebar - Reminders */}
        <aside className="fixed right-0 top-16 bottom-0 w-80 bg-white shadow-lg overflow-y-auto p-6 z-10">
          <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
            Reminders
          </h3>
          <Separator className="mb-4" />

          <div className="space-y-3">
            {upcomingReminders.map((reminder, index) => (
              <Card
                key={index}
                className="bg-[#f9f9f9] border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[#222222] flex-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                    {reminder.task}
                  </p>
                  <Badge
                    className={`${reminder.priority === 'HIGH'
                      ? 'bg-red-100 text-red-700 border-red-300'
                      : reminder.priority === 'MEDIUM'
                        ? 'bg-orange-100 text-orange-700 border-orange-300'
                        : 'bg-blue-100 text-blue-700 border-blue-300'
                      } border`}
                    style={{ fontSize: '10px' }}
                  >
                    {reminder.priority}
                  </Badge>
                </div>
                <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                  Due: {reminder.date}
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
      {selectedMentee && (
        <ViewJobDescriptionDialog
          open={showJdDialog}
          onOpenChange={setShowJdDialog}
          jobDescription={selectedMentee.jobDescription}
        />
      )}

      {selectedInterview && (
        <UpcomingInterviewDetailsDialog
          open={showInterviewDialog}
          onOpenChange={setShowInterviewDialog}
          interviewNumber={selectedInterview.interviewNumber}
          interviewDate={selectedInterview.date}
          candidates={selectedInterview.candidates}
          onUpdateDate={(newDate: string) => {
            // Update interview date logic
            console.log('Updating interview date to:', newDate);
          }}
          onStartInterview={() => {
            // Start interview logic
            console.log('Starting interview:', selectedInterview.interviewNumber);
          }}
        />
      )}

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
    </div>
  );
}