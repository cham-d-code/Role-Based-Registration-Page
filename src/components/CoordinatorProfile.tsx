import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  FileText,
  Users,
  UserCheck,
  BellRing,
  User as UserIcon,
  Settings,
  LogOut,
  Mail,
  Phone,
  Edit,
  ChevronDown,
  ChevronRight,
  Plus,
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  ClipboardList,
  Send,
  Play,
  Download,
  CalendarCheck,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import { Card } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Separator } from './ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { jsPDF } from 'jspdf';

import MentorAssignmentDialog from './MentorAssignmentDialog';
import JobDescriptionDialog from './JobDescriptionDialog';
import JobDescriptionPage from './JobDescriptionPage';
import CurriculumModulesPanel from './CurriculumModulesPanel';
import EndedInterviewDetailsDialog from './EndedInterviewDetailsDialog';
import InterviewMarkingPage from './InterviewMarkingPage';
import EndedInterviewDetailsPage from './EndedInterviewDetailsPage';
import CoordinatorManageInterviewsPage from './CoordinatorManageInterviewsPage';
import EditProfileDialog from './EditProfileDialog';
import SystemNotices from './SystemNotices';
import StaffAttendanceDialog from './StaffAttendanceDialog';
import ResearchDetailsDialog from './ResearchDetailsDialog';
import AddResearchDialog from './AddResearchDialog';
import EditResearchDialog from './EditResearchDialog';
import logo from 'figma:asset/39b6269214ec5f8a015cd1f1a1adaa157fd5d025.png';
import {
  approveLeave,
  createResearchOpportunity,
  deleteResearchOpportunity,
  getMyNotifications,
  getMyMentees,
  getMyLeaveRequests,
  getPendingLeaveRequests,
  getMyResearchOpportunities,
  markNotificationRead,
  rejectLeave,
  ResearchOpportunityDto,
  updateMyProfile,
  updateResearchOpportunity,
  type LeaveRequestDto,
  type UserNotificationDto,
  UserProfile,
} from '../services/api';

interface CoordinatorProfileProps {
  onLogout: () => void;
}



interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  cvUrl?: string;
  marks: {
    part1: number;
    part2: number;
    part3: number;
    total: number;
  };
  shortlisted: boolean;
}

interface Interview {
  id: string;
  interviewNumber: string;
  date: string;
  status: 'upcoming' | 'ended';
  candidateCount: number;
  averageMarks?: number;
  passedCandidates?: number;
  candidates?: Candidate[];
}





interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  preferredSubjects: string[];
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  preferredSubjects: string[];
  mentor?: string;
  hasJobDescription: boolean;
  preferredModules?: string[];
  preferredModuleDetails?: any[];
  preferencesRequested?: boolean;
}

interface LeaveRequest {
  id: string;
  staffName: string;
  staffEmail: string;
  leaveType: string;
  substitute: string;
  startDate: string;
  endDate: string;
  reason: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function CoordinatorProfile({ onLogout }: CoordinatorProfileProps) {
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'interviewMarking' | 'endedInterviewDetails' | 'manageInterviews'>('dashboard');

  const [showMentorDialog, setShowMentorDialog] = useState(false);
  const [showJdDialog, setShowJdDialog] = useState(false);
  const [showJdPage, setShowJdPage] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showEndedInterviews, setShowEndedInterviews] = useState(true);
  const [expandedInterviewId, setExpandedInterviewId] = useState<string | null>(null);
  const [showInterviewDetailsDialog, setShowInterviewDetailsDialog] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [editingInterviewId, setEditingInterviewId] = useState<string | null>(null);
  const [editedDate, setEditedDate] = useState<string>('');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: '',
    phone: '',
    avatarUrl: '',
    initials: '...'
  });
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [selectedStaffForAttendance, setSelectedStaffForAttendance] = useState<StaffMember | null>(null);
  const [moduleNotifyTarget, setModuleNotifyTarget] = useState<{ id: string; name: string } | null>(null);
  const [contractFilter, setContractFilter] = useState<'all' | 'remaining' | 'expired'>('all');
  const [extendContractOpen, setExtendContractOpen] = useState(false);
  const [selectedStaffForContract, setSelectedStaffForContract] = useState<StaffMember | null>(null);
  const [newContractStartDate, setNewContractStartDate] = useState('');
  const [newContractEndDate, setNewContractEndDate] = useState('');

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

  // Interview data
  const [interviews, setInterviews] = useState<Interview[]>([
    {
      id: 'INT001',
      interviewNumber: 'Interview 1',
      date: 'Oct 25, 2025',
      status: 'upcoming',
      candidateCount: 15
    },
    {
      id: 'INT002',
      interviewNumber: 'Interview 2',
      date: 'Nov 10, 2025',
      status: 'upcoming',
      candidateCount: 20
    },
    {
      id: 'INT003',
      interviewNumber: 'Interview 3',
      date: 'Oct 10, 2025',
      status: 'ended',
      candidateCount: 18,
      averageMarks: 72.5,
      passedCandidates: 12,
      candidates: [
        { id: 'C301', name: 'A.B. Perera', email: 'ab.perera@kln.ac.lk', phone: '+94 77 111 1111', marks: { part1: 28, part2: 27, part3: 30, total: 85 }, shortlisted: true },
        { id: 'C302', name: 'K.L. Silva', email: 'kl.silva@kln.ac.lk', phone: '+94 76 222 2222', marks: { part1: 26, part2: 28, part3: 28, total: 82 }, shortlisted: true },
        { id: 'C303', name: 'N.P. Fernando', email: 'np.fernando@kln.ac.lk', phone: '+94 75 333 3333', marks: { part1: 27, part2: 25, part3: 27, total: 79 }, shortlisted: true },
        { id: 'C304', name: 'R.M. Jayawardena', email: 'rm.jay@kln.ac.lk', phone: '+94 77 444 4444', marks: { part1: 25, part2: 26, part3: 26, total: 77 }, shortlisted: true },
        { id: 'C305', name: 'S.K. Bandara', email: 'sk.bandara@kln.ac.lk', phone: '+94 76 555 5555', marks: { part1: 24, part2: 25, part3: 26, total: 75 }, shortlisted: true },
        { id: 'C306', name: 'D.T. Wijesinghe', email: 'dt.wije@kln.ac.lk', phone: '+94 75 666 6666', marks: { part1: 23, part2: 24, part3: 25, total: 72 }, shortlisted: true },
        { id: 'C307', name: 'M.N. Gunasekara', email: 'mn.guna@kln.ac.lk', phone: '+94 77 777 7777', marks: { part1: 22, part2: 24, part3: 24, total: 70 }, shortlisted: true },
        { id: 'C308', name: 'P.L. Rathnayake', email: 'pl.rath@kln.ac.lk', phone: '+94 76 888 8888', marks: { part1: 22, part2: 23, part3: 23, total: 68 }, shortlisted: true },
        { id: 'C309', name: 'T.S. Mendis', email: 'ts.mendis@kln.ac.lk', phone: '+94 75 999 9999', marks: { part1: 21, part2: 22, part3: 23, total: 66 }, shortlisted: true },
        { id: 'C310', name: 'V.K. Samaraweera', email: 'vk.sama@kln.ac.lk', phone: '+94 77 000 0000', marks: { part1: 20, part2: 22, part3: 22, total: 64 }, shortlisted: true },
        { id: 'C311', name: 'W.P. Dissanayake', email: 'wp.dissa@kln.ac.lk', phone: '+94 76 111 1112', marks: { part1: 20, part2: 21, part3: 22, total: 63 }, shortlisted: true },
        { id: 'C312', name: 'Y.R. Kodikara', email: 'yr.kodi@kln.ac.lk', phone: '+94 75 222 2223', marks: { part1: 19, part2: 21, part3: 21, total: 61 }, shortlisted: true },
        { id: 'C313', name: 'H.M. Abeysekara', email: 'hm.abey@kln.ac.lk', phone: '+94 77 333 3334', marks: { part1: 18, part2: 20, part3: 20, total: 58 }, shortlisted: false },
        { id: 'C314', name: 'G.S. Karunaratne', email: 'gs.karu@kln.ac.lk', phone: '+94 76 444 4445', marks: { part1: 17, part2: 19, part3: 19, total: 55 }, shortlisted: false },
        { id: 'C315', name: 'J.K. Herath', email: 'jk.herath@kln.ac.lk', phone: '+94 75 555 5556', marks: { part1: 16, part2: 18, part3: 18, total: 52 }, shortlisted: false },
        { id: 'C316', name: 'L.D. Senanayake', email: 'ld.sena@kln.ac.lk', phone: '+94 77 666 6667', marks: { part1: 15, part2: 17, part3: 17, total: 49 }, shortlisted: false },
        { id: 'C317', name: 'O.P. Wickramasinghe', email: 'op.wick@kln.ac.lk', phone: '+94 76 777 7778', marks: { part1: 14, part2: 16, part3: 16, total: 46 }, shortlisted: false },
        { id: 'C318', name: 'Q.T. Rajapaksa', email: 'qt.raja@kln.ac.lk', phone: '+94 75 888 8889', marks: { part1: 13, part2: 15, part3: 15, total: 43 }, shortlisted: false }
      ]
    },
    {
      id: 'INT004',
      interviewNumber: 'Interview 4',
      date: 'Sep 28, 2025',
      status: 'ended',
      candidateCount: 22,
      averageMarks: 68.3,
      passedCandidates: 16,
      candidates: [
        { id: 'C401', name: 'Z.A. Wijesuriya', email: 'za.wije@kln.ac.lk', phone: '+94 77 121 2121', marks: { part1: 29, part2: 28, part3: 29, total: 86 }, shortlisted: true },
        { id: 'C402', name: 'B.C. Amarasekara', email: 'bc.amara@kln.ac.lk', phone: '+94 76 232 3232', marks: { part1: 27, part2: 27, part3: 28, total: 82 }, shortlisted: true },
        { id: 'C403', name: 'C.D. Ekanayake', email: 'cd.eka@kln.ac.lk', phone: '+94 75 343 4343', marks: { part1: 26, part2: 26, part3: 27, total: 79 }, shortlisted: true },
        { id: 'C404', name: 'E.F. Gamage', email: 'ef.gamage@kln.ac.lk', phone: '+94 77 454 5454', marks: { part1: 25, part2: 26, part3: 26, total: 77 }, shortlisted: true },
        { id: 'C405', name: 'F.G. Hettiarachchi', email: 'fg.hetti@kln.ac.lk', phone: '+94 76 565 6565', marks: { part1: 24, part2: 25, part3: 25, total: 74 }, shortlisted: true },
        { id: 'C406', name: 'G.H. Ileperuma', email: 'gh.ile@kln.ac.lk', phone: '+94 75 676 7676', marks: { part1: 23, part2: 24, part3: 24, total: 71 }, shortlisted: true },
        { id: 'C407', name: 'H.I. Jayakody', email: 'hi.jaya@kln.ac.lk', phone: '+94 77 787 8787', marks: { part1: 22, part2: 23, part3: 23, total: 68 }, shortlisted: true },
        { id: 'C408', name: 'I.J. Kumara', email: 'ij.kumara@kln.ac.lk', phone: '+94 76 898 9898', marks: { part1: 21, part2: 22, part3: 22, total: 65 }, shortlisted: true },
        { id: 'C409', name: 'J.K. Liyanage', email: 'jk.liya@kln.ac.lk', phone: '+94 75 909 0909', marks: { part1: 20, part2: 21, part3: 21, total: 62 }, shortlisted: true },
        { id: 'C410', name: 'K.L. Munasinghe', email: 'kl.muna@kln.ac.lk', phone: '+94 77 010 1010', marks: { part1: 19, part2: 20, part3: 20, total: 59 }, shortlisted: true },
        { id: 'C411', name: 'L.M. Nanayakkara', email: 'lm.nana@kln.ac.lk', phone: '+94 76 121 2121', marks: { part1: 18, part2: 19, part3: 19, total: 56 }, shortlisted: true },
        { id: 'C412', name: 'M.N. Opatha', email: 'mn.opatha@kln.ac.lk', phone: '+94 75 232 3232', marks: { part1: 17, part2: 18, part3: 18, total: 53 }, shortlisted: true },
        { id: 'C413', name: 'N.O. Pathirana', email: 'no.pathi@kln.ac.lk', phone: '+94 77 343 4343', marks: { part1: 16, part2: 17, part3: 17, total: 50 }, shortlisted: true },
        { id: 'C414', name: 'O.P. Ratnayake', email: 'op.ratna@kln.ac.lk', phone: '+94 76 454 5454', marks: { part1: 15, part2: 16, part3: 16, total: 47 }, shortlisted: true },
        { id: 'C415', name: 'P.Q. Samarasinghe', email: 'pq.samara@kln.ac.lk', phone: '+94 75 565 6565', marks: { part1: 14, part2: 15, part3: 15, total: 44 }, shortlisted: true },
        { id: 'C416', name: 'Q.R. Tennakoon', email: 'qr.tenna@kln.ac.lk', phone: '+94 77 676 7676', marks: { part1: 13, part2: 14, part3: 14, total: 41 }, shortlisted: true },
        { id: 'C417', name: 'R.S. Udugama', email: 'rs.udu@kln.ac.lk', phone: '+94 76 787 8787', marks: { part1: 12, part2: 13, part3: 13, total: 38 }, shortlisted: false },
        { id: 'C418', name: 'S.T. Vithanage', email: 'st.vitha@kln.ac.lk', phone: '+94 75 898 9898', marks: { part1: 11, part2: 12, part3: 12, total: 35 }, shortlisted: false },
        { id: 'C419', name: 'T.U. Weerasinghe', email: 'tu.weera@kln.ac.lk', phone: '+94 77 909 0909', marks: { part1: 10, part2: 11, part3: 11, total: 32 }, shortlisted: false },
        { id: 'C420', name: 'U.V. Yapa', email: 'uv.yapa@kln.ac.lk', phone: '+94 76 010 1010', marks: { part1: 9, part2: 10, part3: 10, total: 29 }, shortlisted: false },
        { id: 'C421', name: 'V.W. Zoysa', email: 'vw.zoysa@kln.ac.lk', phone: '+94 75 121 2121', marks: { part1: 8, part2: 9, part3: 9, total: 26 }, shortlisted: false },
        { id: 'C422', name: 'W.X. Abeyratne', email: 'wx.abey@kln.ac.lk', phone: '+94 77 232 3232', marks: { part1: 7, part2: 8, part3: 8, total: 23 }, shortlisted: false }
      ]
    },
    {
      id: 'INT005',
      interviewNumber: 'Interview 5',
      date: 'Sep 15, 2025',
      status: 'ended',
      candidateCount: 20,
      averageMarks: 65.8,
      passedCandidates: 14,
      candidates: [
        { id: 'C501', name: 'X.Y. Balasuriya', email: 'xy.bala@kln.ac.lk', phone: '+94 77 343 4343', marks: { part1: 28, part2: 27, part3: 28, total: 83 }, shortlisted: true },
        { id: 'C502', name: 'Y.Z. Cooray', email: 'yz.cooray@kln.ac.lk', phone: '+94 76 454 5454', marks: { part1: 26, part2: 26, part3: 27, total: 79 }, shortlisted: true },
        { id: 'C503', name: 'A.A. Dias', email: 'aa.dias@kln.ac.lk', phone: '+94 75 565 6565', marks: { part1: 25, part2: 25, part3: 26, total: 76 }, shortlisted: true },
        { id: 'C504', name: 'B.B. Edirisinghe', email: 'bb.ediri@kln.ac.lk', phone: '+94 77 676 7676', marks: { part1: 24, part2: 24, part3: 25, total: 73 }, shortlisted: true },
        { id: 'C505', name: 'C.C. Fonseka', email: 'cc.fonseka@kln.ac.lk', phone: '+94 76 787 8787', marks: { part1: 23, part2: 23, part3: 24, total: 70 }, shortlisted: true },
        { id: 'C506', name: 'D.D. Gunawardena', email: 'dd.guna@kln.ac.lk', phone: '+94 75 898 9898', marks: { part1: 22, part2: 22, part3: 23, total: 67 }, shortlisted: true },
        { id: 'C507', name: 'E.E. Hapuarachchi', email: 'ee.hapu@kln.ac.lk', phone: '+94 77 909 0909', marks: { part1: 21, part2: 21, part3: 22, total: 64 }, shortlisted: true },
        { id: 'C508', name: 'F.F. Indika', email: 'ff.indika@kln.ac.lk', phone: '+94 76 010 1010', marks: { part1: 20, part2: 20, part3: 21, total: 61 }, shortlisted: true },
        { id: 'C509', name: 'G.G. Janaka', email: 'gg.janaka@kln.ac.lk', phone: '+94 75 121 2121', marks: { part1: 19, part2: 19, part3: 20, total: 58 }, shortlisted: true },
        { id: 'C510', name: 'H.H. Kalpana', email: 'hh.kalpana@kln.ac.lk', phone: '+94 77 232 3232', marks: { part1: 18, part2: 18, part3: 19, total: 55 }, shortlisted: true },
        { id: 'C511', name: 'I.I. Lakshan', email: 'ii.lakshan@kln.ac.lk', phone: '+94 76 343 4343', marks: { part1: 17, part2: 17, part3: 18, total: 52 }, shortlisted: true },
        { id: 'C512', name: 'J.J. Malsha', email: 'jj.malsha@kln.ac.lk', phone: '+94 75 454 5454', marks: { part1: 16, part2: 16, part3: 17, total: 49 }, shortlisted: true },
        { id: 'C513', name: 'K.K. Nimal', email: 'kk.nimal@kln.ac.lk', phone: '+94 77 565 6565', marks: { part1: 15, part2: 15, part3: 16, total: 46 }, shortlisted: true },
        { id: 'C514', name: 'L.L. Oshadha', email: 'll.osha@kln.ac.lk', phone: '+94 76 676 7676', marks: { part1: 14, part2: 14, part3: 15, total: 43 }, shortlisted: true },
        { id: 'C515', name: 'M.M. Prasad', email: 'mm.prasad@kln.ac.lk', phone: '+94 75 787 8787', marks: { part1: 13, part2: 13, part3: 14, total: 40 }, shortlisted: false },
        { id: 'C516', name: 'N.N. Qasim', email: 'nn.qasim@kln.ac.lk', phone: '+94 77 898 9898', marks: { part1: 12, part2: 12, part3: 13, total: 37 }, shortlisted: false },
        { id: 'C517', name: 'O.O. Roshan', email: 'oo.roshan@kln.ac.lk', phone: '+94 76 909 0909', marks: { part1: 11, part2: 11, part3: 12, total: 34 }, shortlisted: false },
        { id: 'C518', name: 'P.P. Sunil', email: 'pp.sunil@kln.ac.lk', phone: '+94 75 010 1010', marks: { part1: 10, part2: 10, part3: 11, total: 31 }, shortlisted: false },
        { id: 'C519', name: 'Q.Q. Tharindu', email: 'qq.thari@kln.ac.lk', phone: '+94 77 121 2121', marks: { part1: 9, part2: 9, part3: 10, total: 28 }, shortlisted: false },
        { id: 'C520', name: 'R.R. Upul', email: 'rr.upul@kln.ac.lk', phone: '+94 76 232 3232', marks: { part1: 8, part2: 8, part3: 9, total: 25 }, shortlisted: false }
      ]
    }
  ]);

  // Leave requests data (pending approvals)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestDto[]>([]);
  const [loadingLeaveApprovals, setLoadingLeaveApprovals] = useState(false);

  // Fetch pending leave requests for approvals
  useEffect(() => {
    if (activeMenu !== 'leave') return;
    setLoadingLeaveApprovals(true);
    getPendingLeaveRequests()
      .then((items) => setLeaveRequests(items))
      .catch((e) => {
        console.error('Failed to load pending leave requests', e);
        setLeaveRequests([]);
      })
      .finally(() => setLoadingLeaveApprovals(false));
  }, [activeMenu]);

  // FR7: Registration requests
  const [registrationRequests, setRegistrationRequests] = useState<any[]>([]);

  // Fetch pending requests
  useEffect(() => {
    if (activeMenu === 'registrations') {
      import('../services/api').then(api => {
        api.getPendingRegistrations()
          .then(data => {
            const formattedData = data.map(user => ({
              id: user.id,
              name: user.fullName,
              email: user.email,
              phone: user.mobile,
              preferredSubjects: [], // Backend doesn't return this yet, would need update if crucial
              submittedDate: new Date(user.createdAt).toLocaleDateString(),
              status: 'pending'
            }));
            setRegistrationRequests(formattedData);
          })
          .catch(err => console.error("Failed to fetch pending registrations:", err));
      });
    }
  }, [activeMenu]);

  // FR9, FR10, FR11, FR12: Staff members
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    if (activeMenu === 'staff' || activeMenu === 'mentors') {
      setLoadingStaff(true);
      import('../services/api').then(api => {
        api.getApprovedStaff()
          .then(data => {
            setStaffMembers(prev => {
              // Preserve any local state (hasJobDescription, preferencesRequested, mentor) from existing entries
              const existingMap = Object.fromEntries(prev.map(s => [s.id, s]));
              return data.map(u => ({
                id: u.id,
                name: u.fullName,
                email: u.email,
                phone: u.mobile,
                contractStartDate: u.contractStartDate,
                contractEndDate: u.contractEndDate,
                preferredSubjects: u.preferredSubjects ?? [],
                hasJobDescription: existingMap[u.id]?.hasJobDescription ?? false,
                preferencesRequested: u.preferencesRequested ?? existingMap[u.id]?.preferencesRequested ?? false,
                mentor: u.mentorName ?? existingMap[u.id]?.mentor,
                preferredModules: u.preferredModules ?? existingMap[u.id]?.preferredModules,
                preferredModuleDetails: (u as any).preferredModuleDetails ?? (existingMap[u.id] as any)?.preferredModuleDetails,
              }));
            });
          })
          .catch(err => console.error('Failed to fetch staff:', err))
          .finally(() => setLoadingStaff(false));
      });
    }
  }, [activeMenu]);

  // Sample interview candidates data
  const upcomingInterviewCandidates = [
    { id: 'C004', name: 'S.L. Perera', email: 's.perera@kln.ac.lk', phone: '+94 77 111 2222' },
    { id: 'C005', name: 'N.K. Fernando', email: 'n.fernando@kln.ac.lk', phone: '+94 76 222 3333' },
    { id: 'C006', name: 'P.D. Silva', email: 'p.silva@kln.ac.lk', phone: '+94 75 333 4444' },
    { id: 'C007', name: 'R.M. Jayawardena', email: 'r.jay@kln.ac.lk', phone: '+94 77 444 5555' },
    { id: 'C008', name: 'K.S. Bandara', email: 'k.bandara@kln.ac.lk', phone: '+94 76 555 6666' }
  ];

  // Handlers for interview management
  const toggleInterviewDetails = (interviewId: string) => {
    setExpandedInterviewId(expandedInterviewId === interviewId ? null : interviewId);
  };

  const handleEditDate = (interviewId: string, currentDate: string) => {
    setEditingInterviewId(interviewId);
    // Convert display date to input format (YYYY-MM-DD)
    const date = new Date(currentDate);
    const formattedDate = date.toISOString().split('T')[0];
    setEditedDate(formattedDate);
  };

  const handleSaveDate = (interviewId: string) => {
    if (!editedDate) return;

    setInterviews(prev =>
      prev.map(int => {
        if (int.id === interviewId) {
          // Convert YYYY-MM-DD to display format
          const date = new Date(editedDate);
          const formatted = date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          return { ...int, date: formatted };
        }
        return int;
      })
    );

    setEditingInterviewId(null);
    setEditedDate('');
    alert('Interview date updated successfully!');
  };

  const handleCancelEditDate = () => {
    setEditingInterviewId(null);
    setEditedDate('');
  };

  // Leave request handlers
  const handleApproveLeave = async (id: string) => {
    try {
      setLoadingLeaveApprovals(true);
      await approveLeave(id);
      setLeaveRequests(await getPendingLeaveRequests());
      alert('Leave request approved successfully!');
    } catch (e: any) {
      alert(e?.message || 'Failed to approve leave request');
    } finally {
      setLoadingLeaveApprovals(false);
    }
  };

  const handleRejectLeave = async (id: string) => {
    if (!confirm('Reject this leave request?')) return;
    try {
      setLoadingLeaveApprovals(true);
      await rejectLeave(id);
      setLeaveRequests(await getPendingLeaveRequests());
      alert('Leave request rejected.');
    } catch (e: any) {
      alert(e?.message || 'Failed to reject leave request');
    } finally {
      setLoadingLeaveApprovals(false);
    }
  };

  // FR7: Approve/Reject registration
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
        preferredSubjects: [],
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
      await api.rejectUser(id, 'Rejected by Coordinator');

      setRegistrationRequests(prev =>
        prev.filter(req => req.id !== id) // Remove from list
      );
      alert('Registration request rejected.');
    } catch (error: any) {
      alert(`Rejection failed: ${error.message}`);
    }
  };

  // FR9, FR10: Assign mentor
  const handleAssignMentor = (staffId: string, mentorId: string) => {
    import('../services/api').then(async (api) => {
      try {
        const res = await api.assignMentorToStaff(staffId, mentorId);
        setStaffMembers(prev =>
          prev.map(staff => staff.id === staffId ? { ...staff, mentor: res.mentorName || mentorId } : staff)
        );
        alert('Mentor assigned successfully!');
      } catch (e: any) {
        alert(e?.message || 'Failed to assign mentor');
      }
    });
  };

  // FR12: Save job description
  const handleSaveJobDescription = (staffId: string, tasks: any[]) => {
    setStaffMembers(prev =>
      prev.map(staff => staff.id === staffId ? { ...staff, hasJobDescription: true } : staff)
    );
    alert('Job Description created successfully!');
    setShowJdDialog(false);
    setShowJdPage(false);
  };

  // Handle asking for module preferences
  const handleAskPreferences = (staffId: string) => {
    const staff = staffMembers.find((s) => s.id === staffId);
    setModuleNotifyTarget(staff ? { id: staff.id, name: staff.name } : { id: staffId, name: 'Selected staff' });
    setActiveMenu('modules');
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'registrations', label: 'Registration Requests', icon: UserCheck },
    { id: 'interviews', label: 'Manage Interviews', icon: Calendar },

    { id: 'mentors', label: 'Assign Mentors', icon: UserCheck },
    { id: 'mentees', label: 'My Mentees', icon: Users },
    { id: 'research', label: 'Research Opportunities', icon: FileText },
    { id: 'staff', label: 'Temporary Staff List', icon: Users },
    { id: 'modules', label: 'Module Notifications', icon: BellRing },
    { id: 'leave', label: 'Leave Requests', icon: FileText },
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

  const statsCards = [
    { title: 'Active Staff Members', value: '24', color: '#4db4ac' },
    { title: 'Pending Approvals', value: '8', color: '#4db4ac' },
    { title: 'Interview Rounds', value: '3', color: '#4db4ac' },
    { title: 'Reminders Sent', value: '15', color: '#4db4ac' },
  ];

  const recentActivities = [
    { action: 'Uploaded Interview Excel Sheet', time: '2 hours ago', date: 'Oct 18, 2025' },
    { action: 'Approved Temporary Staff Registration', time: '5 hours ago', date: 'Oct 18, 2025' },
    { action: 'Updated Marking Scheme', time: '1 day ago', date: 'Oct 17, 2025' },
    { action: 'Assigned Mentor to New Staff', time: '2 days ago', date: 'Oct 16, 2025' },
    { action: 'Sent Contract Renewal Reminders', time: '3 days ago', date: 'Oct 15, 2025' },
  ];

  const upcomingDeadlines = [
    { task: 'Contract Renewal Alerts', priority: 'urgent', date: 'Oct 20, 2025' },
    { task: 'Pending Mentor Assignment Reviews', priority: 'medium', date: 'Oct 22, 2025' },
    { task: 'Interview Schedule Approval', priority: 'medium', date: 'Oct 25, 2025' },
    { task: 'Monthly Report Submission', priority: 'normal', date: 'Oct 31, 2025' },
  ];

  const getRemainingContractDaysValue = (contractEndDate?: string) => {
    if (!contractEndDate) return null;
    const end = new Date(contractEndDate);
    if (Number.isNaN(end.getTime())) return null;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfEndDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.ceil((startOfEndDay.getTime() - startOfToday.getTime()) / msPerDay);
  };

  const parseLocalDate = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
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
    if (days < 0) return 'bg-gray-100 text-gray-800 border-gray-400';
    if (days < 30) return 'bg-red-100 text-red-700 border-red-300';
    if (days < 60) return 'bg-orange-100 text-orange-700 border-orange-300';
    return 'bg-green-100 text-green-700 border-green-300';
  };

  const formatPostedDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRemainingContractDaysLabel = (contractEndDate?: string) => {
    const diffDays = getRemainingContractDaysValue(contractEndDate);
    if (diffDays === null) return '—';
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return '1 day';
    return `${diffDays} days`;
  };

  const filteredStaffMembers = staffMembers.filter((s) => {
    const remaining = getRemainingContractDaysValue(s.contractEndDate);
    const isExpired = remaining !== null && remaining < 0;
    if (contractFilter === 'expired') return isExpired;
    if (contractFilter === 'remaining') return remaining !== null && remaining >= 0;
    return true;
  });

  const openExtendContractDialog = (staff: StaffMember) => {
    setSelectedStaffForContract(staff);
    const todayIso = new Date().toISOString().slice(0, 10);

    const existingEnd = staff.contractEndDate ? new Date(staff.contractEndDate) : null;
    if (existingEnd && !Number.isNaN(existingEnd.getTime())) {
      const start = new Date(existingEnd.getFullYear(), existingEnd.getMonth(), existingEnd.getDate() + 1);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 30);
      setNewContractStartDate(start.toISOString().slice(0, 10));
      setNewContractEndDate(end.toISOString().slice(0, 10));
    } else {
      setNewContractStartDate(todayIso);
      setNewContractEndDate(todayIso);
    }

    setExtendContractOpen(true);
  };

  const handleExtendContractSave = async () => {
    if (!selectedStaffForContract) return;
    if (!newContractStartDate || !newContractEndDate) {
      alert('Please select both contract start date and end date.');
      return;
    }

    const start = new Date(newContractStartDate);
    const end = new Date(newContractEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      alert('Invalid date(s). Please select valid dates.');
      return;
    }
    if (end.getTime() < start.getTime()) {
      alert('Contract end date must be on or after the start date.');
      return;
    }

    try {
      const api = await import('../services/api');
      await api.updateStaffContract(selectedStaffForContract.id, newContractStartDate, newContractEndDate);

      setStaffMembers((prev) =>
        prev.map((s) =>
          s.id === selectedStaffForContract.id
            ? { ...s, contractStartDate: newContractStartDate, contractEndDate: newContractEndDate }
            : s
        )
      );

      setExtendContractOpen(false);
      alert(`Contract period updated for ${selectedStaffForContract.name}.`);
    } catch (e: any) {
      alert(e?.message || 'Failed to update contract dates.');
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

  const handleDownloadServiceLetter = (staff: StaffMember) => {
    const dateStr = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: '2-digit',
    });

    const coordinatorName =
      profileData?.name && profileData.name !== 'Loading...' ? profileData.name : 'Temporary Staff Coordinator';

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const left = 56;
    const right = 56;
    const maxWidth = pageWidth - left - right;

    let y = 72;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('SERVICE LETTER', left, y);

    y += 28;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(['University of Kelaniya', 'Department of Industrial Management'], left, y);

    y += 40;
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${dateStr}`, left, y);

    y += 30;
    doc.setFont('helvetica', 'bold');
    doc.text('TO WHOM IT MAY CONCERN', left, y);

    y += 24;
    doc.setFont('helvetica', 'normal');

    const paragraphs = [
      `This is to certify that ${staff.name} has been serving as a Temporary Staff Member at the Department of Industrial Management, University of Kelaniya.`,
      `Staff ID: ${staff.id}`,
      `Email: ${staff.email}`,
      `Position: Temporary Lecturer`,
      `Department: Industrial Management`,
      `During their tenure, ${staff.name} has demonstrated exceptional commitment and professionalism in their teaching responsibilities.`,
      `This letter is issued upon request for official purposes.`,
    ];

    for (const p of paragraphs) {
      const lines = doc.splitTextToSize(p, maxWidth);
      doc.text(lines, left, y);
      y += lines.length * 16 + 10;
    }

    y += 10;
    doc.text('Sincerely,', left, y);
    y += 22;
    doc.setFont('helvetica', 'bold');
    doc.text(coordinatorName, left, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.text(['Temporary Staff Coordinator', 'Department of Industrial Management', 'University of Kelaniya'], left, y);

    const safeName = (staff.name || 'Staff').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_');
    doc.save(`Service_Letter_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);

    alert(`Service letter PDF for ${staff.name} has been downloaded successfully!`);
  };

  // Show CoordinatorManageInterviewsPage
  if (currentPage === 'manageInterviews') {
    return (
      <CoordinatorManageInterviewsPage
        onBack={() => {
          setCurrentPage('dashboard');
          setActiveMenu('dashboard');
        }}
      />
    );
  }

  // Show InterviewMarkingPage
  if (currentPage === 'interviewMarking' && selectedInterview) {
    return (
      <InterviewMarkingPage
        interview={selectedInterview}
        candidates={upcomingInterviewCandidates}
        onBack={() => {
          setCurrentPage('dashboard');
          setSelectedInterview(null);
        }}
      />
    );
  }

  // Show EndedInterviewDetailsPage
  if (currentPage === 'endedInterviewDetails' && selectedInterview) {
    return (
      <EndedInterviewDetailsPage
        interview={selectedInterview}
        onBack={() => {
          setCurrentPage('dashboard');
          setSelectedInterview(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Header Bar */}
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
                <AvatarFallback className="bg-white text-[#4db4ac]">TM</AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg overflow-y-auto">
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'interviews') {
                      setCurrentPage('manageInterviews');
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
        <main className={`flex-1 ml-64 p-6 space-y-6 ${activeMenu === 'dashboard' ? 'mr-80' : ''}`}>
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
                      Temporary Staff Coordinator
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

              {/* Statistics Section */}
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

              {/* Upcoming Deadlines Section */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
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
              </Card>


            </>
          )}

          {/* FR7: Registration Requests View */}
          {activeMenu === 'registrations' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Registration Requests
                </h3>

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

          {/* Manage Interviews View */}
          {activeMenu === 'interviews' && (
            <div className="space-y-6">
              {/* Schedule New Interview Section */}
              <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Schedule New Interview
                </h3>
                <Separator className="mb-4" />

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                        Interview Name
                      </Label>
                      <Input
                        type="text"
                        placeholder="e.g., Interview #4"
                        className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                        Interview Date
                      </Label>
                      <Input
                        type="date"
                        className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-[#222222] mb-2 block" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Upload Candidates List
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept=".xlsx,.xls"
                        className="w-full bg-white border-[#d0d0d0] rounded-lg focus:border-[#4db4ac] focus:ring-[#4db4ac]"
                      />
                      <Button className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white whitespace-nowrap">
                        <Plus className="h-4 w-4 mr-2" />
                        Schedule Interview
                      </Button>
                    </div>
                    <p className="text-[#999999] mt-1" style={{ fontSize: '12px' }}>
                      Upload an Excel file (.xlsx or .xls) containing candidate information
                    </p>
                  </div>
                </div>
              </Card>



              {/* Upcoming Interviews Section - Show Details Inline */}
              {interviews.filter(int => int.status === 'upcoming').map((interview) => (
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
                            <Label className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                              Interview Date
                            </Label>
                          </div>

                          {editingInterviewId === interview.id ? (
                            <div className="flex items-center gap-3">
                              <Input
                                type="date"
                                value={editedDate}
                                onChange={(e) => setEditedDate(e.target.value)}
                                className="border-[#4db4ac] focus:border-[#4db4ac] rounded-lg max-w-[200px]"
                              />
                              <Button
                                size="sm"
                                className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                                onClick={() => handleSaveDate(interview.id)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#e0e0e0] text-[#555555] hover:bg-[#f5f5f5]"
                                onClick={handleCancelEditDate}
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <p className="text-[#222222]" style={{ fontSize: '18px', fontWeight: 600 }}>
                                {new Date(interview.date).toLocaleDateString('en-US', {
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#4db4ac] text-[#4db4ac] hover:bg-white"
                                onClick={() => handleEditDate(interview.id, interview.date)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit Date
                              </Button>
                            </div>
                          )}
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
                          {upcomingInterviewCandidates.length}
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
                          {Math.abs(Math.ceil((new Date(interview.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
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
                            {upcomingInterviewCandidates.map((candidate, index) => (
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

              {/* Ended Interviews Section - Collapsible */}
              {interviews.filter(int => int.status === 'ended').length > 0 && (
                <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
                  <Collapsible open={showEndedInterviews} onOpenChange={setShowEndedInterviews}>
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                          <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                            Ended Interviews ({interviews.filter(int => int.status === 'ended').length})
                          </h3>
                        </div>
                        {showEndedInterviews ? (
                          <ChevronDown className="h-6 w-6 text-[#555555]" />
                        ) : (
                          <ChevronRight className="h-6 w-6 text-[#555555]" />
                        )}
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <Separator className="my-4" />
                      <div className="space-y-3">
                        {interviews.filter(int => int.status === 'ended').map((interview) => (
                          <Card
                            key={interview.id}
                            className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9] hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                                    {interview.interviewNumber}
                                  </h4>
                                  <Badge className="bg-green-100 text-green-700 border-green-300 border" style={{ fontSize: '10px' }}>
                                    COMPLETED
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mt-3">
                                  <div>
                                    <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                                      Date Conducted
                                    </p>
                                    <p className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                                      {interview.date}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                                      Total Candidates
                                    </p>
                                    <p className="text-[#222222]" style={{ fontSize: '13px', fontWeight: 600 }}>
                                      {interview.candidateCount}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[#555555] mb-1" style={{ fontSize: '11px', fontWeight: 600 }}>
                                      Average Marks
                                    </p>
                                    <p className="text-[#4db4ac]" style={{ fontSize: '13px', fontWeight: 700 }}>
                                      {interview.averageMarks}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <Button
                                variant="outline"
                                className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                                onClick={() => {
                                  setSelectedInterview(interview);
                                  setCurrentPage('endedInterviewDetails');
                                }}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View More
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              )}
            </div>
          )}

          {/* FR9, FR10: Assign Mentors View */}
          {activeMenu === 'mentors' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Assign Mentors to Temporary Staff
                </h3>

              </div>
              <Separator className="mb-4" />

              <div className="space-y-4">
                {staffMembers.map((staff) => (
                  <Card
                    key={staff.id}
                    className="border border-[#e0e0e0] rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {staff.name}
                        </h4>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Mail className="h-4 w-4 text-[#4db4ac]" />
                            <span>{staff.email}</span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Preferred Subjects:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {staff.preferredSubjects.length > 0 ? (
                              staff.preferredSubjects.map((subject, idx) => (
                                <Badge
                                  key={idx}
                                  className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]"
                                  style={{ fontSize: '11px' }}
                                >
                                  {subject}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[#999999]" style={{ fontSize: '12px' }}>
                                —
                              </span>
                            )}
                          </div>
                        </div>

                        {staff.mentor && (
                          <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg px-3 py-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <p className="text-green-700" style={{ fontSize: '13px', fontWeight: 600 }}>
                              Mentor Assigned: {staff.mentor}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => {
                          setSelectedStaff(staff);
                          setShowMentorDialog(true);
                        }}
                        className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {staff.mentor ? 'Change Mentor' : 'Assign Mentor'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Staff List with JD Creation (FR12) */}
          {activeMenu === 'staff' && (
            showJdPage && selectedStaff ? (
              <JobDescriptionPage
                staffMember={{
                  id: selectedStaff.id,
                  name: selectedStaff.name,
                  preferredSubjects: selectedStaff.preferredSubjects,
                  preferredModules: (selectedStaff as any).preferredModules,
                  preferredModuleDetails: (selectedStaff as any).preferredModuleDetails,
                }}
                onBack={() => setShowJdPage(false)}
                onSave={handleSaveJobDescription}
              />
            ) : (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Temporary Staff List & Job Descriptions
                </h3>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="ml-auto inline-flex items-center justify-center whitespace-nowrap rounded-md border border-[#4db4ac] bg-white px-4 py-2 text-sm font-medium text-[#4db4ac] transition-colors hover:bg-[#e6f7f6]"
                      type="button"
                    >
                      Filter: {contractFilter === 'all' ? 'All' : contractFilter === 'expired' ? 'Expired' : 'Remaining'}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => setContractFilter('all')}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContractFilter('remaining')}>Contract days remaining</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setContractFilter('expired')}>Expired</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Separator className="mb-4" />

              {loadingStaff && (
                <div className="flex items-center justify-center py-8 gap-3 text-[#4db4ac]">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span style={{ fontSize: '14px' }}>Loading staff...</span>
                </div>
              )}

              {!loadingStaff && staffMembers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="h-10 w-10 text-[#d0d0d0] mx-auto mb-2" />
                  <p className="text-[#999999]" style={{ fontSize: '14px' }}>No approved temporary staff yet.</p>
                </div>
              )}

              <div className="space-y-4">
                {filteredStaffMembers.map((staff) => (
                  <Card
                    key={staff.id}
                    className="border border-[#e0e0e0] rounded-lg p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-[#222222] mb-2" style={{ fontSize: '16px', fontWeight: 600 }}>
                          {staff.name}
                        </h4>

                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Mail className="h-4 w-4 text-[#4db4ac]" />
                            <span>{staff.email}</span>
                          </div>
                          {staff.phone && (
                            <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                              <Phone className="h-4 w-4 text-[#4db4ac]" />
                              <span>{staff.phone}</span>
                            </div>
                          )}
                          {(staff.contractStartDate || staff.contractEndDate) && (
                            <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                              <Calendar className="h-4 w-4 text-[#4db4ac]" />
                              <span>
                                Contract: {staff.contractStartDate ?? '—'} → {staff.contractEndDate ?? '—'}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Clock className="h-4 w-4 text-[#4db4ac]" />
                            <span>
                              Remaining contract days: {getRemainingContractDaysLabel(staff.contractEndDate)}
                            </span>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Preferred Subjects:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {staff.preferredSubjects.length > 0 ? (
                              staff.preferredSubjects.map((subject, idx) => (
                                <Badge
                                  key={idx}
                                  className="bg-[#e6f7f6] text-[#4db4ac] border border-[#4db4ac]"
                                  style={{ fontSize: '11px' }}
                                >
                                  {subject}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-[#999999]" style={{ fontSize: '12px' }}>
                                —
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setShowJdPage(true);
                          }}
                          className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                        >
                          <ClipboardList className="h-4 w-4 mr-2" />
                          {staff.hasJobDescription ? 'Edit JD' : 'Create JD'}
                        </Button>
                        <Button
                          onClick={() => openExtendContractDialog(staff)}
                          variant="outline"
                          className="border-purple-600 text-purple-700 hover:bg-purple-50"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          Extend Contract
                        </Button>
                        <Button
                          onClick={() => handleAskPreferences(staff.id)}
                          variant="outline"
                          className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#e6f7f6]"
                          disabled={staff.preferencesRequested}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          {staff.preferencesRequested ? 'Requested' : 'Ask Preferences'}
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedStaffForAttendance(staff);
                            setShowAttendanceDialog(true);
                          }}
                          variant="outline"
                          className="border-blue-500 text-blue-600 hover:bg-blue-50"
                        >
                          <CalendarCheck className="h-4 w-4 mr-2" />
                          View Attendance
                        </Button>
                        <Button
                          onClick={() => handleDownloadServiceLetter(staff)}
                          variant="outline"
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Service Letter
                        </Button>
                      </div>
                    </div>

                    {/* Status Messages Row */}
                    <div className="mt-3 space-y-2">
                      {staff.hasJobDescription && (
                        <div className="flex items-center gap-2 bg-green-50 border border-green-300 rounded-lg px-3 py-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-green-700" style={{ fontSize: '13px', fontWeight: 600 }}>
                            Job Description Created
                          </p>
                        </div>
                      )}

                      {!staff.hasJobDescription && (
                        <div className="flex items-center gap-2 bg-orange-50 border border-orange-300 rounded-lg px-3 py-2">
                          <ClipboardList className="h-4 w-4 text-orange-600" />
                          <p className="text-orange-700" style={{ fontSize: '13px', fontWeight: 600 }}>
                            Job Description Pending
                          </p>
                        </div>
                      )}

                      {staff.preferencesRequested && (
                        <div className="flex items-center gap-2 bg-blue-50 border border-blue-300 rounded-lg px-3 py-2">
                          <BellRing className="h-4 w-4 text-blue-600" />
                          <p className="text-blue-700" style={{ fontSize: '13px', fontWeight: 600 }}>
                            Module Preferences Requested
                          </p>
                        </div>
                      )}

                    </div>
                  </Card>
                ))}
              </div>
            </Card>
            )
          )}

          {/* FR11: Module Notifications View */}
          {activeMenu === 'modules' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Module Notifications
                </h3>
              </div>
              <p className="text-[#555555] mb-4" style={{ fontSize: '14px' }}>
                Department programme modules by level. Filter, select modules, and notify approved temporary staff.
              </p>
              <Separator className="mb-4" />
              <CurriculumModulesPanel
                targetStaffId={moduleNotifyTarget?.id || null}
                targetStaffName={moduleNotifyTarget?.name || null}
                onClearTarget={() => setModuleNotifyTarget(null)}
                onSent={() => {
                  if (moduleNotifyTarget?.id) {
                    setStaffMembers((prev) =>
                      prev.map((s) => (s.id === moduleNotifyTarget.id ? { ...s, preferencesRequested: true } : s))
                    );
                  }
                }}
              />
            </Card>
          )}

          {/* My Mentees */}
          {activeMenu === 'mentees' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  My Mentees
                </h3>
                <Badge className="bg-[#4db4ac] text-white" style={{ fontSize: '12px' }}>
                  {myMentees.length} Total Mentees
                </Badge>
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

              <div className="space-y-4">
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

                        <div className="lg:w-64 space-y-3">
                          <Card className={`${expiryColor} border p-4 rounded-lg`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4" />
                              <p style={{ fontSize: '12px', fontWeight: 600 }}>
                                Contract Expiry
                              </p>
                            </div>
                            {contractExpiry ? (
                              daysUntilExpiry < 0 ? (
                                <>
                                  <p style={{ fontSize: '24px', fontWeight: 700 }}>
                                    Expired
                                  </p>
                                  <p style={{ fontSize: '11px' }} className="mt-1 opacity-90">
                                    Ended: {parseLocalDate(contractExpiry).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p style={{ fontSize: '24px', fontWeight: 700 }}>
                                    {daysUntilExpiry} days
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
                              )
                            ) : (
                              <p className="text-[#999999]" style={{ fontSize: '12px' }}>—</p>
                            )}
                          </Card>

                          <Button
                            className="w-full bg-[#4db4ac] hover:bg-[#3c9a93] text-white"
                            onClick={() => alert('Job Description view can be wired next.')}
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
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Leave Requests View */}
          {activeMenu === 'leave' && (
            <Card className="bg-white rounded-xl shadow-[0px_4px_12px_rgba(0,0,0,0.1)] border-0 p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-[#222222]" style={{ fontWeight: 700, fontSize: '20px' }}>
                  Leave Request Approvals
                </h3>

              </div>
              <Separator className="mb-4" />

              {loadingLeaveApprovals ? (
                <div className="flex items-center justify-center py-10 text-[#4db4ac]" style={{ fontSize: '14px' }}>
                  Loading leave requests…
                </div>
              ) : (
              <div className="space-y-4">
                {leaveRequests.map((request) => (
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
                            {request.staffName}
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
                            <span>{request.staffEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <UserCheck className="h-4 w-4 text-[#4db4ac]" />
                            <span>Substitute: {request.substituteName || '—'}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 mb-3">
                          <div className="bg-white rounded-lg p-3 border border-[#e0e0e0]">
                            <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                              Leave Date
                            </p>
                            <p className="text-[#222222]" style={{ fontSize: '14px', fontWeight: 600 }}>
                              {request.leaveDate
                                ? new Date(request.leaveDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                : '—'}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-[#555555] mb-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                            Reason:
                          </p>
                          <p className="text-[#222222] bg-white rounded-lg p-3 border border-[#e0e0e0]" style={{ fontSize: '14px' }}>
                            {request.reason}
                          </p>
                        </div>

                        <p className="text-[#999999]" style={{ fontSize: '12px' }}>
                          Submitted:{' '}
                          {request.submittedAt
                            ? new Date(request.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </p>
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproveLeave(request.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleRejectLeave(request.id)}
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

                {leaveRequests.length === 0 && (
                  <div className="text-center py-12 text-[#999999]">
                    <p style={{ fontSize: '14px' }}>No pending leave requests</p>
                  </div>
                )}
              </div>
              )}
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
                      Temporary Staff Coordinator
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
                      System Notices
                    </h3>
                    <SystemNotices userRole="coordinator" />
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

        {/* Right Sidebar - only on Dashboard */}
        {activeMenu === 'dashboard' && (
          <aside className="fixed right-0 top-16 bottom-0 w-80 bg-white shadow-lg overflow-y-auto p-6">
            <h3 className="text-[#222222] mb-4" style={{ fontWeight: 700, fontSize: '18px' }}>
              Reminders
            </h3>
            <Separator className="mb-4" />

            <p className="text-[#777777]" style={{ fontSize: '13px' }}>
              Use the dashboard panels to track upcoming deadlines.
            </p>
          </aside>
        )}
      </div>



      {/* Mentor Assignment Dialog */}
      <MentorAssignmentDialog
        open={showMentorDialog}
        onOpenChange={setShowMentorDialog}
        staffMember={selectedStaff}
        onAssign={handleAssignMentor}
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

      {/* Job Description Dialog */}
      <JobDescriptionDialog
        open={showJdDialog}
        onOpenChange={setShowJdDialog}
        staffMember={selectedStaff}
        onSave={handleSaveJobDescription}
      />

      {/* Ended Interview Details Dialog */}
      <EndedInterviewDetailsDialog
        open={showInterviewDetailsDialog}
        onOpenChange={setShowInterviewDetailsDialog}
        interview={selectedInterview}
      />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        currentProfile={profileData}
        onSave={handleProfileSave}
      />

      {/* Staff Attendance Dialog */}
      <StaffAttendanceDialog
        open={showAttendanceDialog}
        onOpenChange={setShowAttendanceDialog}
        staffName={selectedStaffForAttendance?.name || ''}
        staffId={selectedStaffForAttendance?.id || ''}
      />

      <Dialog open={extendContractOpen} onOpenChange={setExtendContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend contract period</DialogTitle>
            <DialogDescription>
              Update contract start and end dates for {selectedStaffForContract?.name ?? 'this staff member'}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New contract start date</Label>
              <Input
                type="date"
                value={newContractStartDate}
                onChange={(e) => setNewContractStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>New contract end date</Label>
              <Input
                type="date"
                value={newContractEndDate}
                onChange={(e) => setNewContractEndDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendContractOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white" onClick={handleExtendContractSave}>
              Save contract dates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}