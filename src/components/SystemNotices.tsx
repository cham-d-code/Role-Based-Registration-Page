import { AlertCircle, Bell, Calendar, Info, X } from 'lucide-react';
import { Alert } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useState } from 'react';

interface Notice {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'urgent' | 'deadline';
  date: string;
  dismissible: boolean;
}

interface SystemNoticesProps {
  userRole: 'hod' | 'coordinator' | 'mentor' | 'staff';
}

export default function SystemNotices({ userRole }: SystemNoticesProps) {
  const [dismissedNotices, setDismissedNotices] = useState<string[]>([]);

  // FR16: Different notices based on user role
  const getNoticesForRole = (): Notice[] => {
    const commonNotices: Notice[] = [
      {
        id: 'N001',
        title: 'System Maintenance Scheduled',
        message: 'System maintenance on Oct 25, 2025, 2:00 AM - 4:00 AM.',
        type: 'info',
        date: 'Oct 20',
        dismissible: true
      }
    ];

    const roleSpecificNotices: { [key: string]: Notice[] } = {
      hod: [
        {
          id: 'N_HOD_001',
          title: '⚠ Contract Expiry Alert',
          message: '3 staff contracts expiring in 1 month.',
          type: 'urgent',
          date: 'Oct 20',
          dismissible: false
        },
        {
          id: 'N_HOD_002',
          title: 'Monthly Report Deadline',
          message: 'Report submission deadline: Oct 31, 2025.',
          type: 'deadline',
          date: 'Oct 18',
          dismissible: true
        }
      ],
      coordinator: [
        {
          id: 'N_COORD_001',
          title: '⚠ Contract Expiry Alert',
          message: 'K.M. Silva (2 months), R.P. Fernando (1 week).',
          type: 'urgent',
          date: 'Oct 20',
          dismissible: false
        },
        {
          id: 'N_COORD_002',
          title: 'Pending Registration Requests',
          message: '2 new registration requests need approval.',
          type: 'warning',
          date: 'Oct 19',
          dismissible: false
        }
      ],
      mentor: [
        {
          id: 'N_MENTOR_001',
          title: 'Mentee Meeting Reminder',
          message: 'Monthly check-ins due by Oct 25, 2025.',
          type: 'deadline',
          date: 'Oct 18',
          dismissible: true
        }
      ],
      staff: [
        {
          id: 'N_STAFF_001',
          title: 'New Modules Available',
          message: 'Marketing & Operations modules available for assignment.',
          type: 'info',
          date: 'Oct 19',
          dismissible: true
        }
      ]
    };

    return [...commonNotices, ...(roleSpecificNotices[userRole] || [])];
  };

  const notices = getNoticesForRole().filter(notice => !dismissedNotices.includes(notice.id));

  const handleDismiss = (noticeId: string) => {
    setDismissedNotices([...dismissedNotices, noticeId]);
  };

  const getNoticeStyle = (type: string) => {
    switch (type) {
      case 'urgent':
        return {
          bg: 'bg-red-50',
          border: 'border-red-400',
          icon: <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />,
          titleColor: 'text-red-700'
        };
      case 'warning':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-400',
          icon: <Bell className="h-4 w-4 text-orange-600 flex-shrink-0" />,
          titleColor: 'text-orange-700'
        };
      case 'deadline':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-400',
          icon: <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />,
          titleColor: 'text-blue-700'
        };
      default:
        return {
          bg: 'bg-[#e6f7f6]',
          border: 'border-[#4db4ac]',
          icon: <Info className="h-4 w-4 text-[#4db4ac] flex-shrink-0" />,
          titleColor: 'text-[#4db4ac]'
        };
    }
  };

  if (notices.length === 0) return null;

  return (
    <div className="space-y-3">
      {notices.map((notice) => {
        const style = getNoticeStyle(notice.type);
        
        return (
          <div 
            key={notice.id} 
            className={`${style.bg} border-l-4 ${style.border} rounded-lg p-4 relative shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                {style.icon}
              </div>
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h4 className={`${style.titleColor} flex-1`} style={{ fontSize: '14px', fontWeight: 600, lineHeight: '1.3' }}>
                    {notice.title}
                  </h4>
                  <span className="text-[#888888] flex-shrink-0" style={{ fontSize: '11px' }}>
                    {notice.date}
                  </span>
                </div>
                <p className="text-[#555555] w-full" style={{ fontSize: '13px', lineHeight: '1.5' }}>
                  {notice.message}
                </p>
              </div>
              {notice.dismissible && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(notice.id)}
                  className="absolute top-3 right-3 h-6 w-6 p-0 hover:bg-white/50 flex-shrink-0"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}