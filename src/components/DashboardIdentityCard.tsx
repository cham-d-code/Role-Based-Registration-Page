import React from 'react';
import { Mail, Phone } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card } from './ui/card';

type Props = {
  name: string;
  initials: string;
  avatarUrl?: string;
  roleTitle: string;
  department?: string;
  email?: string;
  phone?: string;
  children?: React.ReactNode;
};

export default function DashboardIdentityCard({
  name,
  initials,
  avatarUrl,
  roleTitle,
  department,
  email,
  phone,
  children,
}: Props) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border border-[#e8f0ef] bg-white shadow-[0_4px_24px_rgba(77,180,172,0.12)]">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#4db4ac]" aria-hidden />
      <div className="p-5 sm:p-6 pl-5 sm:pl-7">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5 lg:gap-6">
          <Avatar className="h-20 w-20 shrink-0 shadow-md ring-4 ring-[#e6f7f6] ring-offset-2 ring-offset-white sm:h-24 sm:w-24 lg:h-28 lg:w-28">
            <AvatarImage src={avatarUrl || ''} alt={name} />
            <AvatarFallback className="bg-[#4db4ac] text-white" style={{ fontSize: '22px', fontWeight: 700 }}>
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-0.5 text-left">
            <h2 className="text-[#1a1a1a] leading-tight tracking-tight" style={{ fontWeight: 700, fontSize: 'clamp(20px, 2.5vw, 26px)' }}>
              {name}
            </h2>
            <p className="text-[#4db4ac]" style={{ fontWeight: 600, fontSize: '15px' }}>
              {roleTitle}
            </p>
            {department && (
              <p className="text-[#6b7280]" style={{ fontSize: '14px' }}>
                {department}
              </p>
            )}

            {children}

            {(email || phone) && (
              <div className="flex flex-col items-start gap-1.5 pt-2">
                {email && (
                  <div className="inline-flex min-w-0 max-w-full items-center justify-start gap-2 text-[#374151]">
                    <Mail className="h-4 w-4 shrink-0 text-[#4db4ac]" aria-hidden />
                    <span className="truncate" style={{ fontSize: '13px' }}>
                      {email}
                    </span>
                  </div>
                )}
                {phone && (
                  <div className="inline-flex min-w-0 max-w-full items-center justify-start gap-2 text-[#374151]">
                    <Phone className="h-4 w-4 shrink-0 text-[#4db4ac]" aria-hidden />
                    <span className="truncate" style={{ fontSize: '13px' }}>
                      {phone}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="hidden h-28 w-28 shrink-0 rounded-2xl bg-gradient-to-br from-[#e6f7f6] via-[#dff5f2] to-[#cceee9] ring-1 ring-[#bfe3de] lg:flex lg:flex-col lg:items-center lg:justify-center"
            aria-hidden
          >
            <span className="text-[#4db4ac]" style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em' }}>
              DIM
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
