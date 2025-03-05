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
          <Link href="/home" className="flex items-center">
            <div className="flex items-center">
              <Image 
                src="/HCI soccer logo.png" 
                alt="HCI Soccer Logo" 
                width={100}
                height={24}
                className="w-[80px] sm:w-[100px] md:w-[125px]"
                priority
                style={{
                  objectFit: 'contain',
                  height: 'auto'
                }}
              />
            </div>
          </Link>
          
          {/* League Name */}
          <div className="text-[#0a2240] font-bold text-lg sm:text-xl md:text-2xl">
            {leagueName}
          </div>
        </div>
      </div>
    </div>
  );
} 