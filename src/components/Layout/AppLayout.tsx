import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ListChecks, AlertTriangle, Download, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isReviewer = currentUser?.role === 'reviewer';
  const isSupervisor = currentUser?.role === 'supervisor';

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <aside className="w-56 bg-primary-800/90 backdrop-blur border-r border-primary-700/50 flex flex-col">
        <div className="p-4 border-b border-primary-700/50">
          <h1 className="text-lg font-bold text-primary-100">手语标注审核</h1>
          <p className="text-xs text-primary-400 mt-1">Sign Language Annotation Review</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {isReviewer && (
            <NavLink
              to="/reviewer/queue"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-primary-300 hover:bg-primary-700/50 hover:text-primary-100'
                }`
              }
            >
              <ListChecks size={18} />
              <span className="text-sm font-medium">待审队列</span>
            </NavLink>
          )}

          {isSupervisor && (
            <>
              <NavLink
                to="/supervisor/disputes"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded transition-all ${
                    isActive
                      ? 'bg-warning/90 text-white shadow-md'
                      : 'text-primary-300 hover:bg-primary-700/50 hover:text-primary-100'
                  }`
                }
              >
                <AlertTriangle size={18} />
                <span className="text-sm font-medium">争议队列</span>
              </NavLink>
              <NavLink
                to="/supervisor/export"
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded transition-all ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-primary-300 hover:bg-primary-700/50 hover:text-primary-100'
                  }`
                }
              >
                <Download size={18} />
                <span className="text-sm font-medium">数据导出</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-primary-700/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <User size={16} className="text-primary-100" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary-100 truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-primary-400">
                {isSupervisor ? '主管' : '审核员'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-primary-300 hover:bg-primary-700/50 hover:text-danger rounded transition-all"
          >
            <LogOut size={16} />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 min-h-full animate-fade-in">{children}</div>
      </main>
    </div>
  );
};
