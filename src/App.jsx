import { useState, lazy, Suspense } from 'react';
import { Plus, Minus, Trash2, Calculator, AlertCircle, CheckCircle2, User, RotateCcw, ChevronRight, Coins, Receipt, ClipboardList, X, Crown, Shield } from 'lucide-react';

// 懒加载 Firebase 相关组件
const FirebaseApp = lazy(() => import('./FirebaseApp.jsx'));

export default function App() {
  const [currentUserName, setCurrentUserName] = useState('');
  const [loginInput, setLoginInput] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name) return;
    setCurrentUserName(name);
  };

  // 如果还没登录，显示登录界面
  if (!currentUserName) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-8 w-full max-w-md">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/30">
            <Coins className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 text-center mb-2">计算器小工具</h1>
          <p className="text-slate-500 text-sm text-center mb-8">实时同步 • 自动对账 • 最简分配</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <input
                type="text" value={loginInput} onChange={e => setLoginInput(e.target.value)}
                placeholder="输入你的代号 (如: Alex)"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg transition-all"
                autoFocus required
              />
            </div>
            <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all">
              进入大厅
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 已登录，懒加载 Firebase 应用
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 animate-pulse font-medium flex flex-col items-center">
          <Coins className="w-8 h-8 mb-4 text-slate-300 animate-bounce" />
          正在连接 Firebase 服务器...
        </div>
      </div>
    }>
      <FirebaseApp currentUserName={currentUserName} />
    </Suspense>
  );
}
