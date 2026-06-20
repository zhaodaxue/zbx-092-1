import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Shield, Hand } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleLogin = (role: 'reviewer' | 'supervisor') => {
    login(role);
    if (role === 'reviewer') {
      navigate('/reviewer/queue');
    } else {
      navigate('/supervisor/disputes');
    }
  };

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => handleLogin('reviewer')}
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
              <span className="text-primary-500">→</span>
              <span>进入审核工作台</span>
            </div>
          </button>

          <button
            onClick={() => handleLogin('supervisor')}
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
            <div className="flex items-center gap-2 text-sm text-primary-300">
              <span className="text-warning">→</span>
              <span>进入管理工作台</span>
            </div>
          </button>
        </div>

        <div className="mt-12 text-center text-xs text-primary-500 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <p>模拟登录系统 · 数据存储于浏览器本地</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
