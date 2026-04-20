import { useState, useEffect } from 'react';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import PasswordReset from './components/PasswordReset';
import CoordinatorProfile from './components/CoordinatorProfile';
import HodProfile from './components/HodProfile';
import TempStaffProfile from './components/TempStaffProfile';
import MentorProfile from './components/MentorProfile';
import ErrorBoundary from './components/ErrorBoundary';
import CoordinatorInterviewReportPage from './components/CoordinatorInterviewReportPage';
import { getAuthToken, getCurrentUser, getDashboardRole, logout } from './services/api';

type UserRole = 'hod' | 'coordinator' | 'mentor' | 'staff';

function parseUserRole(value: string | null | undefined): UserRole | null {
  if (!value) return null;
  const r = String(value).toLowerCase();
  if (r === 'hod' || r === 'coordinator' || r === 'mentor' || r === 'staff') return r;
  return null;
}

/** Role for dashboard: sign-in role picker first, else stored user role. */
function resolveSessionRole(): UserRole | null {
  const fromSession = parseUserRole(getDashboardRole());
  if (fromSession) return fromSession;
  const u = getCurrentUser();
  return parseUserRole(u?.role);
}

function readInitialApp(): {
  page: 'signin' | 'signup' | 'passwordreset' | 'dashboard';
  role: UserRole | null;
} {
  if (!getAuthToken()) {
    return { page: 'signin', role: null };
  }
  const role = resolveSessionRole();
  if (role) {
    return { page: 'dashboard', role };
  }
  // Token without usable role/user payload — treat as logged out
  logout();
  return { page: 'signin', role: null };
}

const COORD_REPORT_HASH_PREFIX = '#coord-interview-report=';

function parseCoordinatorReportInterviewId(): string | null {
  if (typeof window === 'undefined') return null;
  const h = window.location.hash;
  if (!h.startsWith(COORD_REPORT_HASH_PREFIX)) return null;
  const raw = h.slice(COORD_REPORT_HASH_PREFIX.length).trim();
  try {
    const id = decodeURIComponent(raw);
    return id || null;
  } catch {
    return raw || null;
  }
}

export default function App() {
  const [coordReportInterviewId, setCoordReportInterviewId] = useState<string | null>(() =>
    parseCoordinatorReportInterviewId(),
  );

  useEffect(() => {
    const onHash = () => setCoordReportInterviewId(parseCoordinatorReportInterviewId());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const closeCoordinatorReportPage = () => {
    window.close();
    setTimeout(() => {
      if (!window.closed) {
        const { pathname, search } = window.location;
        window.history.replaceState(null, '', pathname + search);
        setCoordReportInterviewId(null);
      }
    }, 0);
  };

  const initialApp = readInitialApp();
  const [currentPage, setCurrentPage] = useState<'signin' | 'signup' | 'passwordreset' | 'dashboard'>(initialApp.page);
  const [userRole, setUserRole] = useState<UserRole | null>(initialApp.role);

  const handleLogout = () => {
    logout();
    setUserRole(null);
    setCurrentPage('signin');
  };

  const handleSignIn = (role: UserRole) => {
    setUserRole(role);
    setCurrentPage('dashboard');
  };

  const renderDashboard = () => {
    if (!userRole) {
      return null;
    }
    switch (userRole) {
      case 'hod':
        return <HodProfile onLogout={handleLogout} />;
      case 'coordinator':
        return <CoordinatorProfile onLogout={handleLogout} />;
      case 'mentor':
        return <MentorProfile onLogout={handleLogout} />;
      case 'staff':
        return <TempStaffProfile onLogout={handleLogout} />;
      default:
        return null;
    }
  };

  if (coordReportInterviewId) {
    return (
      <ErrorBoundary>
        <CoordinatorInterviewReportPage
          interviewId={coordReportInterviewId}
          onClose={closeCoordinatorReportPage}
        />
      </ErrorBoundary>
    );
  }

  return (
    <div>
      {currentPage === 'signin' ? (
        <SignIn 
          onSwitchToSignUp={() => setCurrentPage('signup')}
          onSignIn={handleSignIn}
          onForgotPassword={() => setCurrentPage('passwordreset')}
        />
      ) : currentPage === 'signup' ? (
        <SignUp 
          onSwitchToSignIn={() => setCurrentPage('signin')}
        />
      ) : currentPage === 'passwordreset' ? (
        <PasswordReset 
          onBackToSignIn={() => setCurrentPage('signin')}
        />
      ) : userRole ? (
        <ErrorBoundary>
          {renderDashboard()}
        </ErrorBoundary>
      ) : (
        <SignIn 
          onSwitchToSignUp={() => setCurrentPage('signup')}
          onSignIn={handleSignIn}
          onForgotPassword={() => setCurrentPage('passwordreset')}
        />
      )}
    </div>
  );
}