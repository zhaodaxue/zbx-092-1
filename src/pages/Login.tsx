import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Shield, Hand, ChevronRight, User } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import type { UserRole } from '../types';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsUser, getUsersByRole } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleLogin = (userId: string, role: UserRole) => {
    loginAsUser(userId);
    if (role === 'reviewer') {
      navigate('/reviewer/queue');
    } else {
      navigate('/supervisor/disputes');
    }
  };

  const reviewers = getUsersByRole('reviewer');
  const supervisors = getUsersByRole('supervisor');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-3xl px-6">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-2xl mb-4">
            <Hand size={32} className="text-primary-300" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">手语动作序列标注审核</h1>
          <p className="text-primary-400">Sign Language Annotation Review Platform</p>
        </div>

        {!selectedRole && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => setSelectedRole('reviewer')}
              className="group card rounded-xl p-8 text-left hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
            >
              <div className="w-14 h-14 bg-primary-600/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500/40 transition-colors">
                <UserCheck size={28} className="text-primary-200" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">审核员</h2>
              <p className="text-sm text-primary-400 mb-4">
                查看待审样本队列，审核和编辑标注区间，提交审核结论
              </p>
              <div className="flex items-center gap-2 text-sm text-primary-300">
                <ChevronRight size={16} />
                <span>共 {reviewers.length} 个审核员账号</span>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('supervisor')}
              className="group card rounded-xl p-8 text-left hover:shadow-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="w-14 h-14 bg-warning/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-warning/30 transition-colors">
                <Shield size={28} className="text-warning" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">主管</h2>
              <p className="text-sm text-primary-400 mb-4">
                处理争议样本，进行最终裁定，导出审核通过的标注数据
              </p>
              <div className="flex items-center gap-2 text-sm text-warning">
                <ChevronRight size={16} />
                <span>共 {supervisors.length} 个主管账号</span>
              </div>
            </button>
          </div>
        )}

        {selectedRole && (
          <div className="animate-fadeIn">
            <button
              onClick={() => setSelectedRole(null)}
              className="mb-4 text-primary-400 hover:text-primary-300 text-sm transition-colors"
            >
              ← 返回选择角色
            </button>
            
            <div className="card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {selectedRole === 'reviewer' ? <UserCheck size={20} className="text-primary-300" /> : <Shield size={20} className="text-warning" />}
                选择{selectedRole === 'reviewer' ? '审核员' : '主管'}账号
              </h2>
              
              <div className="space-y-3">
                {(selectedRole === 'reviewer' ? reviewers : supervisors).map((u, idx) => (
                  <button
                    key={u.id}
                    onClick={() => handleLogin(u.id, u.role)}
                    className="w-full p-4 rounded-lg bg-primary-800/40 hover:bg-primary-700/60 border border-primary-700/50 hover:border-primary-500/50 transition-all flex items-center gap-4 text-left group"
                    style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      u.role === 'reviewer' ? 'bg-primary-600/30' : 'bg-warning/20'
                    }`}>
                      <User size={18} className={u.role === 'reviewer' ? 'text-primary-300' : 'text-warning'} />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white group-hover:text-primary-100 transition-colors">
                        {u.name}
                      </div>
                      <div className="text-xs text-primary-500">
                        {u.id} · {u.role === 'reviewer' ? '审核员' : '主管'}
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-primary-500 group-hover:text-primary-300 transition-colors" />
                  </button>
                ))}
              </div>
              
              <div className="mt-6 p-3 bg-primary-800/30 rounded-lg">
                <p className="text-xs text-primary-500">
                  💡 模拟登录 · 如需测试「争议样本」流程，请先用不同审核员账号分别驳回同一样本
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center text-xs text-primary-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p>模拟登录系统 · 数据存储于浏览器本地</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
