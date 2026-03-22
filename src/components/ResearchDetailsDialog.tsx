import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { FlaskConical, Mail, Phone, Calendar, Users } from 'lucide-react';

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

interface ResearchOpportunity {
  title: string;
  description: string;
  postedDate: string;
  applicants: Applicant[];
}

interface ResearchDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  research: ResearchOpportunity | null;
}

export default function ResearchDetailsDialog({ open, onOpenChange, research }: ResearchDetailsDialogProps) {
  if (!research) return null;

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'reviewed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] bg-white border-0 shadow-lg rounded-xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-[#4db4ac] flex items-center justify-center">
              <FlaskConical className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-[#222222]" style={{ fontSize: '20px', fontWeight: 700 }}>
                Research Opportunity Details
              </DialogTitle>
              <DialogDescription className="text-[#555555]" style={{ fontSize: '14px' }}>
                View details and manage applicants for this research opportunity
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] space-y-6">
          {/* Research Information */}
          <Card className="border border-[#e0e0e0] rounded-lg p-4 bg-[#f9f9f9]">
            <h3 className="text-[#222222] mb-2" style={{ fontSize: '18px', fontWeight: 700 }}>
              {research.title}
            </h3>
            <p className="text-[#555555] mb-3" style={{ fontSize: '14px', lineHeight: '1.6' }}>
              {research.description}
            </p>
            <div className="flex items-center gap-2 text-[#777777]" style={{ fontSize: '12px' }}>
              <Calendar className="h-4 w-4" />
              <span>Posted: {research.postedDate}</span>
            </div>
          </Card>

          {/* Applicants Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-[#4db4ac]" />
              <h4 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 700 }}>
                Applicants ({research.applicants.length})
              </h4>
            </div>

            {research.applicants.length === 0 ? (
              <Card className="border border-[#e0e0e0] rounded-lg p-6 text-center bg-[#f9f9f9]">
                <Users className="h-12 w-12 text-[#cccccc] mx-auto mb-3" />
                <p className="text-[#777777]" style={{ fontSize: '14px' }}>
                  No applicants yet
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {research.applicants.map((applicant) => (
                  <Card key={applicant.id} className="border border-[#e0e0e0] rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-[#4db4ac]">
                        <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '14px', fontWeight: 600 }}>
                          {applicant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="text-[#222222]" style={{ fontSize: '16px', fontWeight: 600 }}>
                            {applicant.name}
                          </h5>
                          <Badge className={`${getStatusBadgeColor(applicant.status)} border`} style={{ fontSize: '11px' }}>
                            {applicant.status.toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 mb-3">
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Mail className="h-3 w-3 text-[#4db4ac]" />
                            {applicant.email}
                          </div>
                          <div className="flex items-center gap-2 text-[#555555]" style={{ fontSize: '13px' }}>
                            <Phone className="h-3 w-3 text-[#4db4ac]" />
                            {applicant.phone}
                          </div>
                          <div className="flex items-center gap-2 text-[#777777]" style={{ fontSize: '12px' }}>
                            <Calendar className="h-3 w-3" />
                            Applied: {applicant.appliedDate}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700 text-white"
                            style={{ fontSize: '12px' }}
                          >
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                            style={{ fontSize: '12px' }}
                          >
                            Reject
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-[#4db4ac] text-[#4db4ac] hover:bg-[#4db4ac] hover:text-white"
                            style={{ fontSize: '12px' }}
                          >
                            View Profile
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-[#4db4ac] hover:bg-[#3c9a93] text-white rounded-lg"
            style={{ fontWeight: 600 }}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}