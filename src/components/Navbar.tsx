'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  ];

  return (
    <nav className="bg-[#0a2240] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-12">
          {/* Desktop menu */}
          <div className="flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href
                    ? 'text-white border-b-2 border-green-400 bg-[#0c2a4d] rounded-t-md'
                    : 'text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50 rounded-md'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Authentication section moved to the right */}
          <div className="ml-auto flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center">
                <span className="mr-2 text-sm">{user?.displayName || user?.email}</span>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded-md text-sm font-medium mr-2 transition-colors duration-200 ${
                      pathname.startsWith('/admin')
                        ? 'text-yellow-300 bg-[#0c2a4d] border-b-2 border-yellow-400'
                        : 'text-yellow-300 hover:text-yellow-100 hover:bg-[#0c2a4d] hover:bg-opacity-50'
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut()}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-[#0c2a4d] hover:bg-opacity-50 transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
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
          <div className="flex md:hidden items-center ml-2">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white focus:outline-none"
              aria-expanded="false"
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
              <div className="px-3 py-2 text-sm">{user?.displayName || user?.email}</div>
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