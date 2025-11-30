import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, List, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navRef = useRef<HTMLElement>(null);

  const navItems = [
    { path: '/', label: 'Today', icon: CalendarDays },
    { path: '/list', label: 'All A+Qs', icon: List },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const height = navRef.current.offsetHeight;
        document.documentElement.style.setProperty('--bottom-nav-height', `${height}px`);
      }
    };

    // Set initial height
    updateNavHeight();

    // Update on window resize
    window.addEventListener('resize', updateNavHeight);
    
    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver(updateNavHeight);
    if (navRef.current) {
      resizeObserver.observe(navRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateNavHeight);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <nav 
      ref={navRef}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 shadow-lg safe-area-bottom-fixed"
    >
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-4 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
              }`}
            >
              <IconComponent size={20} className="mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
