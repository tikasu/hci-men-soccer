'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut, isAuthenticated, isAdmin } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navItems = [
    { name: 'Teams', href: '/teams' },
    { name: 'Schedule', href: '/schedule' },
    { name: 'Standings', href: '/standings' },
    { name: 'Player Statistics', href: '/stats' },
    { name: 'Rules', href: '/rules' },
  ];

  return (
    <nav className="bg-[#0a2240] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex justify-between h-12">
          {/* Logo/Brand - visible on all screens */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image 
                src="/HCI soccer logo.png" 
                alt="HCI Soccer Logo" 
                width={40} 
                height={40} 
                className="mr-2"
              />
            </Link>
          </div>

          {/* Desktop menu - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-2 sm:px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-white border-b-2 border-green-400 bg-[#0c2a4d] rounded-t-md'
                    : 'text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50 rounded-md'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Authentication section - hidden on mobile */}
          <div className="hidden md:flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                <span className="mr-2 text-sm hidden lg:inline">{user?.displayName || user?.email}</span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium mr-2 transition-colors duration-200 ${
                      pathname.startsWith('/admin')
                        ? 'text-yellow-300 bg-[#0c2a4d] border-b-2 border-yellow-400'
                        : 'text-yellow-300 hover:text-yellow-100 hover:bg-[#0c2a4d] hover:bg-opacity-50'
                    }`}
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="px-2 sm:px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`px-2 sm:px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === '/login'
                    ? 'text-white bg-[#0c2a4d] border-b-2 border-green-400'
                    : 'text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50'
                }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white focus:outline-none"
              aria-expanded={isMenuOpen ? 'true' : 'false'}
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                pathname === item.href
                  ? 'text-white bg-[#0c2a4d] border-l-4 border-green-400'
                  : 'text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50'
              }`}
              onClick={closeMenu}
            >
              {item.name}
            </Link>
          ))}

          {isAuthenticated ? (
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="px-3 py-2 text-sm font-medium">{user?.displayName || user?.email}</div>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    pathname.startsWith('/admin')
                      ? 'text-yellow-300 bg-[#0c2a4d] border-l-4 border-yellow-400'
                      : 'text-yellow-300 hover:text-yellow-100 hover:bg-[#0c2a4d] hover:bg-opacity-50'
                  }`}
                  onClick={closeMenu}
                >
                  Admin Dashboard
                </Link>
              )}
              <button
                onClick={() => {
                  signOut();
                  closeMenu();
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                pathname === '/login'
                  ? 'text-white bg-[#0c2a4d] border-l-4 border-green-400'
                  : 'text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50'
              }`}
              onClick={closeMenu}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 