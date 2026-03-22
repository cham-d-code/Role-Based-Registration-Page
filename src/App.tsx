import { useState } from 'react';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import PasswordReset from './components/PasswordReset';
import CoordinatorProfile from './components/CoordinatorProfile';
import HodProfile from './components/HodProfile';
import TempStaffProfile from './components/TempStaffProfile';
import MentorProfile from './components/MentorProfile';

type UserRole = 'hod' | 'coordinator' | 'mentor' | 'staff';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'signin' | 'signup' | 'passwordreset' | 'dashboard'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('hod');

  const handleLogout = () => {
    setCurrentPage('signin');
  };

  const handleSignIn = (role: UserRole) => {
    setUserRole(role);
    setCurrentPage('dashboard');
  };

  const renderDashboard = () => {
    switch(userRole) {
      case 'hod':
        return <HodProfile onLogout={handleLogout} />;
      case 'coordinator':
        return <CoordinatorProfile onLogout={handleLogout} />;
      case 'mentor':
        return <MentorProfile onLogout={handleLogout} />;
      case 'staff':
        return <TempStaffProfile onLogout={handleLogout} />;
      default:
        return <CoordinatorProfile onLogout={handleLogout} />;
    }
  };

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
      ) : (
        renderDashboard()
      )}
    </div>
  );
}