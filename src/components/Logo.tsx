'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useSettings } from '@/lib/hooks/useSettings';

export default function Logo() {
  // Fetch league settings
  const { data: settings, isLoading } = useSettings();
  
  // Default league name to use while loading or if settings are not available
  const defaultLeagueName = 'Soccer League';
  
  // Get the league name from settings or use default
  const leagueName = settings?.leagueName || defaultLeagueName;
  
  return (
    <div className="bg-white py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <div className="flex items-center">
              <Image 
                src="/HCI logo.png" 
                alt="HCI Logo" 
                width={125}
                height={30}
                priority
                style={{
                  objectFit: 'contain',
                  height: 'auto'
                }}
              />
            </div>
          </Link>
          
          {/* League Name */}
          <div className="text-[#0a2240] font-semibold text-xl md:text-2xl">
            {leagueName}
          </div>
        </div>
      </div>
    </div>
  );
} 