import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Calculator, AlertCircle, CheckCircle2, User, RotateCcw, ChevronRight, Coins, Receipt, ClipboardList, X, Crown, Shield } from 'lucide-react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBZGOfHMf61eEviiCUNJ1bO8UxAsutEh34",
  authDomain: "calculator-56af3.firebaseapp.com",
  projectId: "calculator-56af3",
  storageBucket: "calculator-56af3.firebasestorage.app",
  messagingSenderId: "441624060002",
  appId: "1:441624060002:web:f7ff683ee1834b580d713b",
  measurementId: "G-ZGXDB82P86"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export default function App() {
  const [currentUserName, setCurrentUserName] = useState('');
  const [loginInput, setLoginInput] = useState('');
  const [gameState, setGameState] = useState(null);
  const [results, setResults] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  
  const [authUser, setAuthUser] = useState(undefined);
  const [authError, setAuthError] = useState(null);

  const ROOM_ID = 'public_room_1';

  const appendLog = (state, user, action, detail) => {
    const newLog = { 
      id: Date.now() + Math.random(), 
      time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), 
      user, action, detail 
    };
    return [...(state.logs || []), newLog].slice(-100);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Firebase 认证失败:", error);
        if (error.code === 'auth/configuration-not-found') {
          setAuthError('请前往 Firebase 控制台 -> Authentication (身份验证) -> Sign-in method 中，启用 "匿名" 登录。');
        } else if (error.code === 'auth/unauthorized-domain') {
          setAuthError('当前 GitHub Pages 域名未被授权。请在 Firebase 后台的 Authentication -> Settings -> Authorized domains 中添加 github.io 域名。');
        } else {
          setAuthError(error.message);
        }
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;

    const docRef = doc(db, 'poker_rooms', ROOM_ID);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().state) {
        setGameState(docSnap.data().state);
        setResults(null); 
      } else {
        const initialState = { 
          config: { chipsPerBuyIn: 2000, moneyPerBuyIn: 200 }, 
          players: [], admin: '', logs: [] 
        };
        setDoc(docRef, { state: initialState });
        setGameState(initialState);
      }
    }, (error) => {
      console.error("加载云端数据失败:", error);
    });

    return () => unsubscribe();
  }, [authUser]);

  const updateGameState = async (updates) => {
    if (!authUser) return;
    const newState = { ...gameState, ...updates };
    setGameState(newState);
    setResults(null);
    
    const docRef = doc(db, 'poker_rooms', ROOM_ID);
    await setDoc(docRef, { state: newState }, { merge: true });
  };

  const resetGame = () => {
    if (window.confirm("确定要清空所有人的数据，重新开局吗？此操作仅管理员可执行。")) {
      const resetPlayers = gameState.players.map(p => ({
        ...p, initialBuyIns: 1, rebuys: 0, rebuyHistory: [], finalChips: ''
      }));
      const newLogs = appendLog(gameState, currentUserName, '重新开局', '已清空所有人数据');
      updateGameState({ players: resetPlayers, logs: newLogs });
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const name = loginInput.trim();
    if (!name) return;
    setCurrentUserName(name);
    
    const isNewUser = !gameState.players.find(p => p.name.toLowerCase() === name.toLowerCase());
    let newPlayers = gameState.players;
    let newLogs = gameState.logs || [];
    let newAdmin = gameState.admin;

    if (!newAdmin) newAdmin = name;

    if (isNewUser) {
      const newId = newPlayers.length > 0 ? Math.max(...newPlayers.map(p => p.id)) + 1 : 1;
      newPlayers = [...newPlayers, { id: newId, name: name, initialBuyIns: 1, rebuys: 0, rebuyHistory: [], finalChips: '' }];
      newLogs = appendLog(gameState, name, '加入大厅', '');
    }

    updateGameState({ players: newPlayers, admin: newAdmin, logs: newLogs });
  };

  if (authError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-red-50 rounded-3xl shadow-xl shadow-red-900/5 border border-red-100 p-8 w-full max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-red-700 mb-2">Firebase 权限配置缺失</h1>
          <p className="text-red-600 text-sm mb-6">{authError}</p>
        </div>
      </div>
    );
  }

  if (authUser === undefined || !gameState) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 animate-pulse font-medium flex flex-col items-center">
          <Coins className="w-8 h-8 mb-4 text-slate-300 animate-bounce" />
          正在连接 Firebase 服务器...
        </div>
      </div>
    );
  }

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

  const { config, players, admin, logs } = gameState;
  const isAdmin = currentUserName === admin;
  const allChipsEntered = players.length > 0 && players.every(p => p.finalChips !== '' && p.finalChips !== null);

  let btnText = "生成分配账单";
  let btnDisabled = false;

  if (players.length < 2) {
    btnText = "至少需要2名参与者";
    btnDisabled = true;
  } else if (!allChipsEntered) {
    btnText = "未填完所有人余码";
    btnDisabled = true;
  } else if (!isAdmin) {
    btnText = `仅管理员 (${admin || '未设置'}) 可生成`;
    btnDisabled = true;
  }

  const handlePlayerCountChange = (newCount) => {
    const currentCount = players.length;
    let newPlayers = [...players];
    if (newCount > currentCount) {
      for (let i = currentCount + 1; i <= newCount; i++) {
        const newId = newPlayers.length > 0 ? Math.max(...newPlayers.map(p => p.id)) + 1 : 1;
        newPlayers.push({ id: newId, name: `玩家 ${String.fromCharCode(64 + i)}`, initialBuyIns: 1, rebuys: 0, rebuyHistory: [], finalChips: '' });
      }
    } else {
      newPlayers = newPlayers.slice(0, newCount);
    }
    const newLogs = appendLog(gameState, currentUserName, '修改人数', `从 ${currentCount}人 改为 ${newCount}人`);
    updateGameState({ players: newPlayers, logs: newLogs });
  };

  const removePlayer = (id) => {
    const target = players.find(p => p.id === id);
    if (!target) return;
    let newAdmin = admin;
    if (target.name === admin && players.length > 1) {
       const nextAdmin = players.find(p => p.id !== id);
       if (nextAdmin) newAdmin = nextAdmin.name;
    } else if (target.name === admin && players.length <= 1) {
       newAdmin = '';
    }
    const newLogs = appendLog(gameState, currentUserName, '移除参与者', `移除了 ${target.name}`);
    updateGameState({ players: players.filter(p => p.id !== id), logs: newLogs, admin: newAdmin });
  };

  const updatePlayer = (id, field, value) => {
    updateGameState({ players: players.map(p => p.id === id ? { ...p, [field]: value } : p) });
  };
  
  const adjustBuyIns = (id, type, delta) => {
    const target = players.find(p => p.id === id);
    const actionType = type === 'initial' ? '调整初始带入' : '调整加码';
    const newLogs = appendLog(gameState, currentUserName, actionType, `为 ${target.name} ${delta > 0 ? '+' : ''}${delta}手`);
    updateGameState({ 
      players: players.map(p => p.id === id && type === 'initial' ? { ...p, initialBuyIns: Math.max(0, p.initialBuyIns + delta) } : p),
      logs: newLogs
    });
  };

  const addRebuy = (id, amount) => {
    const target = players.find(p => p.id === id);
    const newLogs = appendLog(gameState, currentUserName, '快捷加码', `为 ${target.name} +${amount}手`);
    updateGameState({ 
      players: players.map(p => {
        if (p.id === id) {
          const history = p.rebuyHistory || Array.from({ length: p.rebuys || 0 }).fill(1);
          return { ...p, rebuys: (p.rebuys || 0) + amount, rebuyHistory: [...history, amount] };
        }
        return p;
      }),
      logs: newLogs
    });
  };

  const calculateSettlement = () => {
    if (btnDisabled) return;

    const ratio = config.moneyPerBuyIn / config.chipsPerBuyIn;
    let totalExpectedChips = 0, totalActualChips = 0;

    const balances = players.map(p => {
      const totalBuyInCount = p.initialBuyIns + p.rebuys;
      const totalBoughtChips = totalBuyInCount * config.chipsPerBuyIn;
      totalExpectedChips += totalBoughtChips;
      const final = Number(p.finalChips) || 0;
      totalActualChips += final;
      const netChips = final - totalBoughtChips;
      return { ...p, totalBuyInCount, totalBoughtChips, netChips, netMoney: netChips * ratio };
    });

    const chipMismatch = totalActualChips - totalExpectedChips;
    const winners = balances.filter(p => p.netMoney > 0.01);
    const losers = balances.filter(p => p.netMoney < -0.01);
    const transfers = [];
    let chipLeader = null;

    if (winners.length > 0) {
      chipLeader = winners.reduce((max, p) => p.netMoney > max.netMoney ? p : max, winners[0]);

      losers.forEach(loser => {
        transfers.push({
          from: loser.name,
          to: chipLeader.name,
          amount: Math.abs(loser.netMoney),
          isToCL: true
        });
      });

      winners.forEach(winner => {
        if (winner.id !== chipLeader.id) {
          transfers.push({
            from: chipLeader.name,
            to: winner.name,
            amount: winner.netMoney,
            isFromCL: true
          });
        }
      });
    }

    setResults({ balances, chipMismatch, transfers, totalExpectedChips, totalActualChips, chipLeader });
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 pb-32 font-sans selection:bg-blue-200">
      
      {showLogs && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-100 animate-in slide-in-from-bottom-full duration-300">
          <div className="bg-white border-b border-slate-200 px-5 py-4 flex justify-between items-center shadow-sm pt-safe">
            <h2 className="font-bold text-lg flex items-center"><ClipboardList className="w-5 h-5 mr-2 text-blue-600" /> 操作日志</h2>
            <button onClick={() => setShowLogs(false)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
              <X className="w-5 h-5"/>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-safe">
            {(logs || []).slice().reverse().map(log => (
              <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/60">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">{log.time}</span>
                  <span className="text-xs font-medium text-slate-500 flex items-center">
                    <User className="w-3 h-3 mr-1"/> {log.user}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-bold text-blue-600 mr-2">{log.action}</span> 
                  <span className="text-slate-700 font-medium">{log.detail}</span>
                </div>
              </div>
            ))}
            {(!logs || logs.length === 0) && (
              <div className="text-center text-slate-400 py-20 flex flex-col items-center">
                <ClipboardList className="w-12 h-12 mb-3 opacity-20" />
                <p>暂无操作记录</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200/60 px-5 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/20">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">结算大厅</span>
          <span className="flex h-2 w-2 rounded-full bg-green-500 ml-1"></span>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowLogs(true)} className="p-2 text-slate-500 hover:text-blue-600 bg-slate-50 rounded-full transition-colors relative">
            <ClipboardList className="w-4 h-4" />
          </button>
          {isAdmin && (
            <button onClick={resetGame} className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-full transition-colors ml-1">
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-5 border border-blue-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm mr-3">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 mb-0.5">我的代号</div>
              <div className="font-bold text-slate-800 flex items-center">
                {currentUserName} 
                {isAdmin && <Shield className="w-4 h-4 ml-1.5 text-yellow-500" />}
              </div>
            </div>
          </div>
          <div>
            {!isAdmin ? (
              <div className="text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100 flex items-center">
                房管: {admin || '无'}
              </div>
            ) : (
              <div className="text-xs text-yellow-600 bg-yellow-100 px-3 py-1.5 rounded-full shadow-sm font-bold flex items-center border border-yellow-200">
                <Shield className="w-3.5 h-3.5 mr-1" /> 管理员
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center">全局配置</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-500">人数</span>
              <select 
                value={players.length} onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-bold px-4 py-1.5 rounded-full outline-none text-sm text-center"
              >
                {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1} 人</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-1 rounded-2xl mb-4">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100/50">
              <label className="block text-xs font-medium text-slate-400 mb-1">1手筹码量</label>
              <input 
                type="number" value={config.chipsPerBuyIn} onChange={e => updateGameState({ config: { ...config, chipsPerBuyIn: Number(e.target.value) } })}
                className="w-full text-lg font-bold text-slate-800 bg-transparent outline-none"
              />
            </div>
            <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100/50">
              <label className="block text-xs font-medium text-slate-400 mb-1">对应 coins</label>
              <div className="flex items-center">
                <span className="text-slate-400 mr-1">C</span>
                <input 
                  type="number" value={config.moneyPerBuyIn} onChange={e => updateGameState({ config: { ...config, moneyPerBuyIn: Number(e.target.value) } })}
                  className="w-full text-lg font-bold text-slate-800 bg-transparent outline-none"
                />
              </div>
            </div>
          </div>
          
          {isAdmin && players.length > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
               <span className="text-sm text-slate-500 flex items-center"><Shield className="w-4 h-4 mr-1"/> 移交权限</span>
               <select
                 value={admin || ''}
                 onChange={e => {
                   const newLogs = appendLog(gameState, currentUserName, '移交管理', `权交给 ${e.target.value}`);
                   updateGameState({ admin: e.target.value, logs: newLogs });
                 }}
                 className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 font-medium px-4 py-1.5 rounded-xl outline-none text-sm text-center focus:ring-2 focus:ring-blue-500"
               >
                 {players.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
               </select>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {players.map((player) => {
            const isMe = player.name.toLowerCase() === currentUserName.toLowerCase();
            const isPlayerAdmin = player.name === admin;

            return (
              <div key={player.id} className={`bg-white rounded-3xl p-5 shadow-sm border ${isMe ? 'border-blue-200 shadow-blue-900/5' : 'border-slate-100'} relative overflow-hidden transition-all`}>
                {isMe && <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">当前操作</div>}
                
                <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
                  <div className="w-2/3 flex items-center">
                    <input 
                      type="text" value={player.name} onChange={e => updatePlayer(player.id, 'name', e.target.value)}
                      className={`text-xl font-bold bg-transparent outline-none w-full ${isMe ? 'text-blue-600' : 'text-slate-800'}`}
                      placeholder="输入名字"
                    />
                    {isPlayerAdmin && <Shield className="w-5 h-5 text-yellow-400 ml-1 shrink-0" />}
                  </div>
                  <button onClick={() => removePlayer(player.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="block text-xs font-medium text-slate-400 mb-2">初始带入 (手)</span>
                    <div className="flex items-center bg-slate-50 rounded-2xl p-1 border border-slate-100">
                      <button onClick={() => adjustBuyIns(player.id, 'initial', -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 active:scale-95"><Minus className="w-5 h-5" /></button>
                      <span className="flex-1 text-center font-bold text-lg">{player.initialBuyIns}</span> 
                      <button onClick={() => adjustBuyIns(player.id, 'initial', 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-600 active:scale-95"><Plus className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-400 mb-2">离场余码 <span className="text-[10px] text-red-400 ml-1">*必填</span></span>
                    <div className={`bg-slate-50 rounded-2xl p-1 h-[48px] flex items-center px-3 focus-within:ring-2 focus-within:ring-green-500 focus-within:bg-white transition-all border ${(player.finalChips === '' || player.finalChips === null) ? 'border-red-200 bg-red-50/30' : 'border-slate-100'}`}>
                      <input 
                        type="number" value={player.finalChips} onChange={e => updatePlayer(player.id, 'finalChips', e.target.value)}
                        placeholder="清点桌码..." 
                        className="w-full bg-transparent outline-none font-bold text-lg text-slate-800 placeholder:text-slate-400/70 placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50/50 rounded-2xl p-3 border border-orange-100/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-orange-600 flex items-center">
                      <Plus className="w-3 h-3 mr-1"/> 途中加码 ({player.rebuys || 0} 手)
                    </span>
                  </div>
                  {(player.rebuyHistory && player.rebuyHistory.length > 0) && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {player.rebuyHistory.map((amount, i) => (
                        <div key={i} className="bg-white border border-orange-200 text-orange-600 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm">
                          +{amount}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {[1, 2, 3, 5].map(amount => (
                      <button 
                        key={amount} onClick={() => addRebuy(player.id, amount)} 
                        className="flex-1 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-orange-600 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
                      >+{amount}</button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {results && (
          <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h2 className="text-xl font-bold text-slate-900 px-2">分配账单</h2>
            
            <div className={`p-5 rounded-3xl border ${results.chipMismatch === 0 ? 'bg-green-500 text-white shadow-green-500/20 shadow-lg' : 'bg-red-500 text-white shadow-red-500/20 shadow-lg'}`}>
              <div className="flex items-center font-bold text-lg mb-1">
                {results.chipMismatch === 0 ? <><CheckCircle2 className="w-6 h-6 mr-2" /> 账目完美匹配</> : <><AlertCircle className="w-6 h-6 mr-2" /> 筹码核对异常</>}
              </div>
              <div className="text-white/90 text-sm mt-3 flex justify-between bg-white/10 p-3 rounded-2xl backdrop-blur-sm">
                <span>发出: <b className="text-lg">{results.totalExpectedChips}</b></span>
                <span>收回: <b className="text-lg">{results.totalActualChips}</b></span>
              </div>
              {results.chipMismatch !== 0 && (
                <div className="mt-3 text-center bg-white/20 rounded-xl py-2 font-bold backdrop-blur-sm text-sm">
                  总池误差: {results.chipMismatch > 0 ? `多出 ${results.chipMismatch}` : `丢失 ${Math.abs(results.chipMismatch)}`} 筹码
                  <div className="text-xs font-normal opacity-80 mt-1">注：依据分配规则，误差可能会由大赢家(CL)承担。</div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center">
                   <Receipt className="w-5 h-5 text-blue-500 mr-2" />
                   <h3 className="font-bold text-slate-800">极简分配方案 <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded ml-1">CL模式</span></h3>
                </div>
              </div>
              <div className="p-3">
                {results.transfers.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">无 coins 变动，天下太平。</div>
                ) : (
                  <>
                    {results.chipLeader && (
                      <div className="bg-amber-50 border border-amber-100 text-amber-900 text-sm px-4 py-3 rounded-2xl mb-4 flex items-center shadow-sm">
                        <Crown className="w-5 h-5 mr-2 text-amber-500" />
                        <div>本局大赢家 (CL): <strong className="ml-1 text-amber-600 text-base">{results.chipLeader.name}</strong></div>
                      </div>
                    )}
                    <div className="space-y-2">
                      {results.transfers.filter(t => t.isToCL).length > 0 && (
                        <div className="px-2 pt-1 pb-2">
                          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">第一步：将 coins 支付给 CL</div>
                          {results.transfers.filter(t => t.isToCL).map((t, idx) => (
                            <div key={'to'+idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 hover:border-blue-100 rounded-2xl mb-2 shadow-sm transition-colors">
                              <div className="w-[35%] text-right font-bold text-slate-800 text-base">{t.from}</div>
                              <div className="flex-1 flex flex-col items-center px-2">
                                <div className="w-full h-[2px] bg-slate-100 relative flex items-center justify-center">
                                  <ChevronRight className="w-4 h-4 text-slate-300 bg-white" />
                                </div>
                              </div>
                              <div className="w-[35%] text-left font-bold text-amber-600 text-base flex items-center">
                                <Crown className="w-3 h-3 mr-1 text-amber-400" /> {t.to}
                              </div>
                              <div className="w-[30%] text-right font-black text-lg text-slate-900">
                                {t.amount.toFixed(0)} <span className="text-xs font-bold text-slate-400">c</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {results.transfers.filter(t => t.isFromCL).length > 0 && (
                        <div className="px-2 pt-3 border-t border-slate-50">
                          <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">第二步：CL 下发给其他赢家</div>
                          {results.transfers.filter(t => t.isFromCL).map((t, idx) => (
                            <div key={'from'+idx} className="flex items-center justify-between p-3.5 bg-white border border-slate-100 hover:border-green-100 rounded-2xl mb-2 shadow-sm transition-colors">
                              <div className="w-[35%] text-right font-bold text-amber-600 text-base flex justify-end items-center">
                                {t.from} <Crown className="w-3 h-3 ml-1 text-amber-400" /> 
                              </div>
                              <div className="flex-1 flex flex-col items-center px-2">
                                <div className="w-full h-[2px] bg-slate-100 relative flex items-center justify-center">
                                  <ChevronRight className="w-4 h-4 text-slate-300 bg-white" />
                                </div>
                              </div>
                              <div className="w-[35%] text-left font-bold text-green-600 text-base">{t.to}</div>
                              <div className="w-[30%] text-right font-black text-lg text-slate-900">
                                {t.amount.toFixed(0)} <span className="text-xs font-bold text-slate-400">c</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-10">
              <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">各家盈亏明细</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {results.balances.map(p => (
                  <div key={p.id} className="p-5 flex justify-between items-center hover:bg-slate-50/50 transition-colors">
                    <div>
                      <div className="font-bold text-slate-800 text-lg mb-1 flex items-center">
                        {p.name}
                        {results.chipLeader?.id === p.id && <Crown className="w-4 h-4 text-amber-500 ml-1.5" title="大赢家" />}
                      </div>
                      <div className="text-xs text-slate-400 flex space-x-2">
                        <span>带入: {p.totalBoughtChips}</span>
                        <span>余码: {p.finalChips || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-black text-xl ${p.netMoney > 0 ? 'text-green-500' : p.netMoney < 0 ? 'text-red-500' : 'text-slate-300'}`}>
                        {p.netMoney > 0 ? '+' : ''}{p.netMoney.toFixed(1)} <span className="text-sm font-medium">coins</span>
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        净筹码 {p.netChips > 0 ? '+' : ''}{p.netChips}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50 flex justify-center pb-safe">
        <div className="max-w-2xl w-full">
          <button 
            onClick={calculateSettlement} 
            disabled={btnDisabled}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-xl flex justify-center items-center active:scale-[0.98] transition-all ${
              btnDisabled ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-slate-900 text-white shadow-slate-900/20'
            }`}
          >
            {!btnDisabled && <Calculator className="w-6 h-6 mr-2" />} 
            {btnText}
          </button>
        </div>
      </div>
      <div className="h-24"></div>
    </div>
  );
}
