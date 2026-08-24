import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { DuesOSLogo } from './DuesOSLogo';
import { SearchModal } from './SearchModal';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

/**
 * Global DuesOS Navbar
 * Consistent 60px dark charcoal navigation bar across all pages.
 * Includes multi-tenant workspace indicator, dynamic real-time alerts, and account switcher.
 */
export function Navbar() {
  const navigate = useNavigate();
  const { user, business, isDemo, hasUserAccount, switchToDemo, switchToUser, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [alerts, setAlerts] = useState([]);
  
  const profileMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Fetch real-time alerts and dashboard data
  useEffect(() => {
    let isMounted = true;
    api.getDashboard().then((res) => {
      if (!isMounted) return;
      if (res?.alerts && Array.isArray(res.alerts)) {
        setAlerts(res.alerts);
      } else {
        setAlerts([]);
      }
    }).catch(() => {
      if (isMounted) setAlerts([]);
    });

    return () => {
      isMounted = false;
    };
  }, [business?.id, isDemo]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const businessName = business?.name || (isDemo ? 'Sharma Engineering Pvt. Ltd.' : 'My Business');

  const navLinks = [
    { name: 'Overview', path: '/' },
    { name: 'Receivables', path: '/receivables' },
    { name: 'Customers', path: '/customers' },
    { name: 'Cash Flow', path: '/cash-flow' },
    { name: 'Action Center', path: '/action-center' },
  ];

  const initials = businessName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SE';

  const handleSwitchToDemo = async () => {
    setShowProfileMenu(false);
    await switchToDemo();
    navigate('/');
    window.location.reload();
  };

  const handleSwitchToUser = async () => {
    setShowProfileMenu(false);
    await switchToUser();
    navigate('/');
    window.location.reload();
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    logout();
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-[60px] bg-[#151D1C] border-b border-[#2D3736] px-4 md:px-8 flex items-center justify-between text-white select-none">
        {/* Left: Brand & Main Navigation */}
        <div className="flex items-center gap-6 lg:gap-8 h-full">
          <Link to="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <DuesOSLogo variant="light" size="md" />
          </Link>

          {/* Demo Account Badge Indicator */}
          {isDemo ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Demo Account
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Workspace
            </span>
          )}

          {/* Center / Nav Items */}
          <nav className="hidden md:flex items-center gap-1 h-full">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `h-full flex items-center px-3.5 text-sm font-sans font-medium transition-all relative ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{link.name}</span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-gold rounded-t-sm" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right: Search, Notifications, Profile Dropdown */}
        <div className="flex items-center gap-4">
          {/* Quick Search Bar */}
          <div 
            onClick={() => setIsSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 w-56 lg:w-64 px-3 py-1.5 bg-[#1F2928] hover:bg-[#253231] border border-[#354342] rounded text-xs text-[#9CA3AF] cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-[16px] text-gray-400">search</span>
            <span className="flex-1 text-gray-400 font-sans truncate">Search invoices, customers...</span>
            <kbd className="px-1.5 py-0.2 text-[10px] font-mono bg-[#151D1C] border border-[#354342] text-gray-400 rounded">
              ⌘K
            </kbd>
          </div>

          {/* Search Trigger for Mobile */}
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="sm:hidden p-1.5 text-gray-400 hover:text-white"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-xl">search</span>
          </button>

          {/* Notification Bell (Dynamic Alerts) */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 text-[#9CA3AF] hover:text-white transition-colors"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand-gold rounded-full ring-2 ring-[#151D1C]"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E0DED7] rounded shadow-xl py-2 text-[#1B1C19] z-50 animate-in fade-in">
                <div className="px-4 py-2 border-b border-[#E0DED7] flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Alerts & Notifications</span>
                  <span className="text-[11px] font-mono text-brand-gold font-semibold">
                    {alerts.length} New
                  </span>
                </div>

                {alerts.length > 0 ? (
                  <div className="divide-y divide-[#F5F3EE]">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id}
                        onClick={() => {
                          setShowNotifications(false);
                          if (alert.link) navigate(alert.link);
                        }}
                        className="px-4 py-3 hover:bg-[#FBF9F4] cursor-pointer transition-colors"
                      >
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                          alert.severity === 'critical' ? 'text-red-700' : 'text-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            alert.severity === 'critical' ? 'bg-red-600' : 'bg-amber-600'
                          }`}></span>
                          {alert.title}
                        </div>
                        <p className="text-xs text-gray-600 mt-1 leading-normal">{alert.message}</p>
                        <span className="text-[10px] font-mono text-gray-400 mt-1 block">{alert.source}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    <span className="material-symbols-outlined text-2xl text-emerald-600 mb-1 block">check_circle</span>
                    <p className="text-xs font-bold text-[#151D1C]">No new alerts</p>
                    <p className="text-[11px] text-gray-400">You're all caught up.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="h-5 w-[1px] bg-[#2D3736]"></div>

          {/* User Profile / Account Switcher Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 rounded hover:bg-white/5 transition-colors text-left"
            >
              <div className="w-7 h-7 rounded-full bg-[#FFB955] text-[#291800] flex items-center justify-center font-mono font-bold text-[11px] ring-1 ring-white/20">
                {initials}
              </div>
              <div className="hidden lg:flex flex-col">
                <span className="text-xs font-sans font-medium text-[#E5E7EB] truncate max-w-[140px]">
                  {businessName}
                </span>
                <span className="text-[10px] font-mono text-gray-400 leading-none">
                  {isDemo ? 'Demo Mode' : 'Active Account'}
                </span>
              </div>
              <span className="material-symbols-outlined text-sm text-gray-400">expand_more</span>
            </button>

            {/* Profile & Account Switcher Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E0DED7] rounded-lg shadow-2xl py-2 text-[#1B1C19] z-50 animate-in fade-in">
                {/* Account Details Header */}
                <div className="px-4 py-2.5 border-b border-[#E0DED7]">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-0.5">
                    {isDemo ? 'Demonstration Workspace' : 'Authenticated Workspace'}
                  </span>
                  <div className="font-bold text-xs text-[#151D1C] truncate">{businessName}</div>
                  {user?.email && (
                    <div className="text-[11px] text-gray-500 truncate font-mono">{user.email}</div>
                  )}
                  {isDemo && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300/60 rounded text-[10px] font-mono font-semibold">
                      Preloaded Demo Data
                    </span>
                  )}
                </div>

                {/* Switcher Actions */}
                <div className="py-1">
                  {isDemo ? (
                    <>
                      {hasUserAccount ? (
                        <button
                          type="button"
                          onClick={handleSwitchToUser}
                          className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#FBF9F4] flex items-center gap-2 font-medium"
                        >
                          <span className="material-symbols-outlined text-base text-brand-gold">switch_account</span>
                          <span>Switch to My Account</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#FBF9F4] flex items-center gap-2 font-medium"
                        >
                          <span className="material-symbols-outlined text-base text-brand-gold">person_add</span>
                          <span>Create Your Account</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleSwitchToDemo}
                        className="w-full px-4 py-2 text-left text-xs text-gray-700 hover:bg-[#FBF9F4] flex items-center gap-2 font-medium"
                      >
                        <span className="material-symbols-outlined text-base text-amber-600">preview</span>
                        <span>Switch to Demo Account</span>
                      </button>
                    </>
                  )}
                </div>

                {/* Logout / Exit */}
                <div className="border-t border-[#E0DED7] pt-1 mt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                  >
                    <span className="material-symbols-outlined text-base">logout</span>
                    <span>{isDemo ? 'Exit Demo Account' : 'Log Out'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Row */}
      <div className="md:hidden flex items-center justify-around bg-[#1F2928] border-b border-[#2D3736] px-2 py-1.5 overflow-x-auto text-xs">
        {navLinks.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `px-2.5 py-1 rounded font-sans transition-colors whitespace-nowrap ${
                isActive ? 'bg-brand-gold text-[#151D1C] font-semibold' : 'text-gray-300'
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

export default Navbar;
