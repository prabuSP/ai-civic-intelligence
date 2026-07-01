/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, UserRole, Complaint, Ward, BudgetSuggestion, Notification } from './types';
import GISMap from './components/GISMap';
import BudgetPlanner from './components/BudgetPlanner';
import AIChatbot from './components/AIChatbot';
import AnalyticsView from './components/AnalyticsView';
import ReportIssueModal from './components/ReportIssueModal';
import {
  Sparkles,
  MapPin,
  Bot,
  Bell,
  LogOut,
  Plus,
  Shield,
  MessageSquare,
  TrendingUp,
  FileText,
  User as UserIcon,
  Phone,
  Building2,
  Mail,
  Lock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  Settings,
  ListFilter
} from 'lucide-react';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login input states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register input states
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Citizen');
  const [regWard, setRegWard] = useState('Ward 1 - Downtown');
  const [regPhone, setRegPhone] = useState('');

  // App core state
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [budgetSuggestions, setBudgetSuggestions] = useState<BudgetSuggestion[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'budget' | 'analytics' | 'chatbot'>('dashboard');

  // UI state
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch core data on mount and user changes
  useEffect(() => {
    fetchWards();
    fetchComplaints();
    fetchBudgetSuggestions();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications(currentUser.id);
    }
  }, [currentUser]);

  const fetchWards = async () => {
    try {
      const res = await fetch('/api/wards');
      const data = await res.json();
      setWards(data);
    } catch (e) {
      console.error("Failed to fetch wards:", e);
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      setComplaints(data);
      // set first complaint as selected by default for details view if none
      if (data.length > 0 && !selectedComplaint) {
        setSelectedComplaint(data[0]);
      }
    } catch (e) {
      console.error("Failed to fetch complaints:", e);
    }
  };

  const fetchBudgetSuggestions = async () => {
    try {
      const res = await fetch('/api/budget-suggestions');
      const data = await res.json();
      setBudgetSuggestions(data);
    } catch (e) {
      console.error("Failed to fetch budgets:", e);
    }
  };

  const fetchNotifications = async (userId: string) => {
    try {
      const res = await fetch(`/api/notifications/${userId}`);
      const data = await res.json();
      setNotifications(data);
    } catch (e) {
      console.error("Failed to fetch notifications:", e);
    }
  };

  // Auth operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
        return;
      }
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError("Failed to connect to authentication server.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          ward: regWard,
          phone: regPhone,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
        return;
      }
      setCurrentUser(data.user);
    } catch (err) {
      setAuthError("Failed to register account.");
    }
  };

  const handleDemoLogin = (email: string) => {
    setLoginEmail(email);
    setLoginPassword('password');
    // programmatically trigger submit
    setTimeout(() => {
      const form = document.getElementById('login-form-submit') as HTMLButtonElement;
      if (form) form.click();
    }, 50);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setNotifications([]);
    setActiveTab('dashboard');
  };

  // Complaint operations
  const handleReportSubmitted = (newComplaint: Complaint) => {
    setComplaints((prev) => [newComplaint, ...prev]);
    setSelectedComplaint(newComplaint);
    setShowReportModal(false);
    if (currentUser) {
      fetchNotifications(currentUser.id);
    }
  };

  const handleUpdateStatus = async (complaintId: string, newStatus: 'Accepted' | 'Rejected' | 'Resolved' | 'Escalated') => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          officer_name: currentUser.name,
        }),
      });
      const updated = await res.json();
      setComplaints((prev) => prev.map((c) => (c.id === complaintId ? updated : c)));
      setSelectedComplaint(updated);
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !commentText.trim() || !currentUser) return;

    setIsSubmittingComment(true);
    try {
      const res = await fetch(`/api/complaints/${selectedComplaint.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_role: currentUser.role,
          text: commentText,
        }),
      });
      const newComment = await res.json();
      
      const updatedComplaint = {
        ...selectedComplaint,
        comments: [...selectedComplaint.comments, newComment],
      };
      
      setComplaints((prev) => prev.map((c) => (c.id === selectedComplaint.id ? updatedComplaint : c)));
      setSelectedComplaint(updatedComplaint);
      setCommentText('');
    } catch (err) {
      console.error("Comment post failed:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Budget suggestion recalculation callback
  const handleRecalculateBudget = async (wardName: string) => {
    const res = await fetch(`/api/budget-suggestions/generate/${encodeURIComponent(wardName)}`, {
      method: 'POST',
    });
    if (!res.ok) {
      throw new Error("Recalculate error");
    }
    const updatedModel = await res.json();
    setBudgetSuggestions((prev) => {
      const existingIdx = prev.findIndex((s) => s.ward === wardName);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx] = updatedModel;
        return copy;
      }
      return [...prev, updatedModel];
    });
  };

  // Notification Mark as Read
  const handleMarkNotificationRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (e) {
      console.error(e);
    }
  };

  // Counts of unread notifications
  const unreadNotifCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div id="app-root-viewport" className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      {/* Header Bar */}
      <header id="app-header-bar" className="sticky top-0 bg-white border-b border-slate-200 z-30 px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-md shadow-indigo-600/10 shrink-0">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h1 className="font-display font-bold text-lg text-slate-800 leading-none">
              Civic AI
            </h1>
            <span className="text-[10px] text-indigo-600 font-semibold uppercase tracking-wider font-sans mt-0.5 block">Intelligence Platform</span>
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-4">
            {/* Notification trigger */}
            <div className="relative">
              <button
                id="notification-bell-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl border border-slate-150 bg-slate-50 hover:bg-slate-100 transition relative cursor-pointer"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {unreadNotifCount > 0 && (
                  <span id="notification-count-badge" className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown feed */}
              {showNotifications && (
                <div id="notifications-dropdown-panel" className="absolute right-0 mt-2.5 w-80 bg-white border border-slate-150 rounded-2xl shadow-xl z-50 p-3 text-xs">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 font-semibold text-slate-700">
                    <span>Notifications ({unreadNotifCount} unread)</span>
                    <button onClick={() => setShowNotifications(false)} className="text-[10px] text-indigo-600 hover:underline cursor-pointer">Close</button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-slate-400 text-center py-6">No notifications yet.</div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarkNotificationRead(n.id)}
                          className={`p-2.5 rounded-lg border transition text-left cursor-pointer ${
                            n.is_read ? 'bg-white border-slate-100 text-slate-500' : 'bg-indigo-50/40 border-indigo-100 text-slate-700 font-medium'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-slate-800 text-[11px]">{n.title}</span>
                            {!n.is_read && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full mt-1 shrink-0" />}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{n.message}</p>
                          <div className="text-[8px] text-slate-400 font-mono mt-1 text-right">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile info and Logout */}
            <div id="user-profile-badge" className="flex items-center gap-3 border-l pl-4 border-slate-200 text-xs">
              <div className="hidden md:block text-right">
                <div className="font-bold leading-none text-slate-800">{currentUser.name}</div>
                <span className="text-[10px] text-slate-500 uppercase font-medium mt-0.5 block">{currentUser.role}</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-600 font-bold uppercase shrink-0">
                {currentUser.name[0]}
              </div>
              <button
                id="user-logout-btn"
                onClick={handleLogout}
                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition shrink-0 cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-slate-400">Visitor Mode (Authentication Required)</span>
        )}
      </header>

      {/* Under-header Content Wrapper */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop Left Sidebar: shown only if logged in */}
        {currentUser && (
          <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col p-4 shrink-0 justify-between">
            <nav className="space-y-1 text-left">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Main Menu
              </div>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition cursor-pointer ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="opacity-70">▤</span> Dashboard
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition cursor-pointer ${
                  activeTab === 'map'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="opacity-70">🗺</span> GIS Map
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition cursor-pointer ${
                  activeTab === 'budget'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="opacity-70">❖</span> AI Budget Insights
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition cursor-pointer ${
                  activeTab === 'analytics'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="opacity-70">⚝</span> Ward Analytics
              </button>
              <button
                onClick={() => setActiveTab('chatbot')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition cursor-pointer ${
                  activeTab === 'chatbot'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="opacity-70">⚡</span> AI Copilot Chat
              </button>
            </nav>

            <div className="p-4 bg-indigo-900 rounded-xl text-white text-left">
              <p className="text-xs font-semibold mb-1">AI ENGINE: GEMINI 1.5</p>
              <div className="h-1 bg-indigo-700 rounded-full mb-3">
                <div className="h-1 bg-cyan-400 rounded-full w-4/5 shadow-[0_0_8px_rgba(34,211,238,0.6)] animate-pulse"></div>
              </div>
              <p className="text-[10px] opacity-70 leading-tight">95.4% Routing Accuracy. Last sync: 1m ago.</p>
            </div>
          </aside>
        )}

        {/* Content Container */}
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {/* Main workspace canvas */}
          <main id="app-workspace-canvas" className="flex-1 p-4 md:p-6 w-full max-w-7xl mx-auto">
        {!currentUser ? (
          /* Authentication Screen */
          <div id="authentication-screen" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4 md:pt-10">
            {/* Info Section */}
            <div className="lg:col-span-7 text-left space-y-6">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
                <span>Powered by Gemini 3.5 AI</span>
              </div>

              <h2 className="font-display font-extrabold text-3xl md:text-5xl text-slate-900 tracking-tight leading-none">
                AI-Powered <span className="text-blue-600">Civic Intelligence</span> Decision Support
              </h2>
              
              <p className="text-sm md:text-base text-slate-500 leading-relaxed max-w-xl">
                A secure multi-role portal helping citizens lodge complaints, and municipal administrators prioritize budget distributions. AI automatically processes photos, categorizes grievances, and generates severity ratings.
              </p>

              {/* Demo Accounts Board */}
              <div id="demo-accounts-board" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 max-w-xl">
                <h4 className="font-display font-bold text-xs text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-blue-500" />
                  Instant Quick-Switch Demo Accounts
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <button
                    onClick={() => handleDemoLogin('citizen@civic.gov')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition"
                  >
                    <div className="font-semibold text-slate-700">Citizen</div>
                    <div className="text-[9px] text-slate-400 font-mono">citizen@civic.gov</div>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('officer@civic.gov')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition"
                  >
                    <div className="font-semibold text-slate-700">Ward Officer</div>
                    <div className="text-[9px] text-slate-400 font-mono">officer@civic.gov</div>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('admin@civic.gov')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition"
                  >
                    <div className="font-semibold text-slate-700">Admin</div>
                    <div className="text-[9px] text-slate-400 font-mono">admin@civic.gov</div>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('mla@civic.gov')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition"
                  >
                    <div className="font-semibold text-slate-700">MLA (Representative)</div>
                    <div className="text-[9px] text-slate-400 font-mono">mla@civic.gov</div>
                  </button>
                  <button
                    onClick={() => handleDemoLogin('collector@civic.gov')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/20 text-left transition"
                  >
                    <div className="font-semibold text-slate-700">District Collector</div>
                    <div className="text-[9px] text-slate-400 font-mono">collector@civic.gov</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Auth Card */}
            <div className="lg:col-span-5">
              <div id="auth-box-card" className="bg-white p-6 md:p-8 rounded-2xl border border-slate-100 shadow-xl text-left space-y-6">
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg md:text-xl text-slate-800">
                    {authMode === 'login' ? 'Access Portal' : 'Register New Account'}
                  </h3>
                  <p className="text-xs text-slate-400">Enter your credentials to manage municipal affairs</p>
                </div>

                {authError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{authError}</span>
                  </div>
                )}

                {authMode === 'login' ? (
                  <form id="login-form" onSubmit={handleLogin} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="login-email-input"
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="name@civic.gov"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Secure Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="login-password-input"
                          type="password"
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      id="login-form-submit"
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-blue-500/15 transition mt-2"
                    >
                      Authenticate Access
                    </button>
                  </form>
                ) : (
                  <form id="register-form" onSubmit={handleRegister} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Full Official Name</label>
                      <div className="relative">
                        <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="register-name-input"
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Arjun Kumar"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-slate-600">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          id="register-email-input"
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. citizen@civic.gov"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-600">Assigned Role</label>
                        <select
                          id="register-role-select"
                          value={regRole}
                          onChange={(e) => setRegRole(e.target.value as UserRole)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                        >
                          <option value="Citizen">Citizen</option>
                          <option value="Officer">Ward Officer</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-600">Secure Password</label>
                        <input
                          id="register-password-input"
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-600">Local Ward Location</label>
                        <select
                          id="register-ward-select"
                          value={regWard}
                          onChange={(e) => setRegWard(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs"
                        >
                          {wards.map((w) => (
                            <option key={w.id} value={w.name}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-semibold text-slate-600">Phone Contact</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input
                            id="register-phone-input"
                            type="text"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="9876543210"
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      id="register-form-submit"
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl shadow-lg transition mt-2"
                    >
                      Create Official Account
                    </button>
                  </form>
                )}

                <div className="pt-4 border-t border-slate-150 text-center">
                  <button
                    id="toggle-auth-mode-btn"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setAuthError(null);
                    }}
                    className="text-xs text-blue-600 font-semibold hover:underline"
                  >
                    {authMode === 'login' ? "Don't have an account? Register here" : "Already registered? Login here"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard View */
          <div id="logged-in-container" className="space-y-6">
            {/* Mobile Navigation Tabs */}
            <div id="mobile-navigation-tabs" className="lg:hidden flex bg-slate-100 p-1 rounded-xl text-[10px] font-semibold text-slate-500 overflow-x-auto gap-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex-1 py-2 text-center rounded-lg transition ${activeTab === 'dashboard' ? 'bg-white text-slate-950 shadow-xs font-bold' : ''}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-2 text-center rounded-lg transition ${activeTab === 'map' ? 'bg-white text-slate-950 shadow-xs font-bold' : ''}`}
              >
                GIS Map
              </button>
              <button
                onClick={() => setActiveTab('budget')}
                className={`flex-1 py-2 text-center rounded-lg transition ${activeTab === 'budget' ? 'bg-white text-slate-950 shadow-xs font-bold' : ''}`}
              >
                Budget AI
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex-1 py-2 text-center rounded-lg transition ${activeTab === 'analytics' ? 'bg-white text-slate-950 shadow-xs font-bold' : ''}`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('chatbot')}
                className={`flex-1 py-2 text-center rounded-lg transition ${activeTab === 'chatbot' ? 'bg-white text-slate-950 shadow-xs font-bold' : ''}`}
              >
                AI Copilot
              </button>
            </div>

            {/* Render selected workspace tab */}
            {activeTab === 'map' && (
              <GISMap
                complaints={complaints}
                wards={wards}
                onSelectComplaint={(c) => {
                  setSelectedComplaint(c);
                  setActiveTab('dashboard'); // Jump back to show expanded card
                }}
                selectedComplaintId={selectedComplaint?.id}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetPlanner
                wards={wards}
                suggestions={budgetSuggestions}
                onRecalculateBudget={handleRecalculateBudget}
                userRole={currentUser.role}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView
                complaints={complaints}
                wards={wards}
              />
            )}

            {activeTab === 'chatbot' && (
              <AIChatbot
                complaints={complaints}
                userRole={currentUser.role}
                userWard={currentUser.ward}
              />
            )}

            {activeTab === 'dashboard' && (
              <div id="main-dashboard-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Panel: Complaint list and Report Trigger */}
                <div id="dashboard-left-panel" className="lg:col-span-4 flex flex-col gap-4 text-left">
                  
                  {/* Top Stats and Trigger button */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display font-semibold text-slate-800 text-sm">Citizen Action Hub</h3>
                      <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 font-mono font-bold px-2 py-0.5 rounded-full">
                        {currentUser.ward.split(' - ')[1]}
                      </span>
                    </div>

                    <button
                      id="trigger-report-modal-btn"
                      onClick={() => setShowReportModal(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md shadow-blue-500/10 transition flex items-center justify-center gap-2 text-xs"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>Report New Incident</span>
                    </button>

                    {/* Simple summary counters */}
                    <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="text-slate-400">TOTAL</div>
                        <div className="text-sm font-bold text-slate-800">{complaints.length}</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-100 p-2 rounded-lg">
                        <div className="text-amber-500">PENDING</div>
                        <div className="text-sm font-bold text-amber-700">
                          {complaints.filter(c => c.status !== 'Resolved').length}
                        </div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                        <div className="text-emerald-500">SOLVED</div>
                        <div className="text-sm font-bold text-emerald-700">
                          {complaints.filter(c => c.status === 'Resolved').length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complaint Scroll List */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                      <span className="font-display font-bold text-xs text-slate-600 uppercase tracking-wider">Public Grievances</span>
                      <ListFilter className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    <div id="complaints-list-scroll-view" className="overflow-y-auto flex-1 space-y-2.5 pr-1 text-xs">
                      {complaints.length === 0 ? (
                        <div className="text-slate-400 text-center py-12">No complaints reported yet.</div>
                      ) : (
                        complaints.map((c) => {
                          const isSelected = selectedComplaint?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedComplaint(c)}
                              className={`p-3 rounded-xl border transition text-left cursor-pointer hover:bg-slate-50/50 ${
                                isSelected ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-150'
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-semibold text-slate-800 line-clamp-1 leading-tight">{c.title}</h4>
                                <span className={`shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  c.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                                  c.status === 'Pending' ? 'bg-rose-100 text-rose-800' :
                                  c.status === 'Accepted' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {c.status}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 line-clamp-1 mt-1 font-mono">
                                Ward: {c.ward.split(' - ')[1]} | {c.category}
                              </p>
                              
                              {/* Severity indicator block */}
                              {c.ai_analysis && (
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/50 text-[9px]">
                                  <span className="text-slate-400 flex items-center gap-1">
                                    <Bot className="w-3 h-3 text-blue-500" />
                                    <span>{c.ai_analysis.department.split(' ')[0]}</span>
                                  </span>
                                  <span className={`font-semibold ${
                                    c.ai_analysis.severity === 'Critical' ? 'text-rose-600' :
                                    c.ai_analysis.severity === 'High' ? 'text-orange-500' : 'text-slate-500'
                                  }`}>
                                    Score: {c.ai_analysis.priority_score}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Panel: Selected Complaint Detailed Breakdown with Timeline */}
                <div id="dashboard-right-panel" className="lg:col-span-8 space-y-4">
                  {selectedComplaint ? (
                    <div id="complaint-details-card" className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 md:p-6 text-left space-y-6">
                      
                      {/* Top Row: Title, Ward and Metadata */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start justify-between gap-2.5">
                          <h2 className="font-display font-bold text-lg md:text-xl text-slate-800 tracking-tight leading-snug">
                            {selectedComplaint.title}
                          </h2>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              selectedComplaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                              selectedComplaint.status === 'Pending' ? 'bg-rose-100 text-rose-800' :
                              selectedComplaint.status === 'Accepted' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                              {selectedComplaint.status}
                            </span>
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
                              ID: {selectedComplaint.id}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{selectedComplaint.ward}</span>
                          </span>
                          <span>Category: <strong className="text-slate-600">{selectedComplaint.category}</strong></span>
                          <span>By: <strong className="text-slate-600">{selectedComplaint.created_by_name}</strong></span>
                          <span>Date: <strong className="text-slate-600">{new Date(selectedComplaint.created_at).toLocaleDateString()}</strong></span>
                        </div>
                      </div>

                      {/* Complaint Image & Description */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                        <div className="md:col-span-8 space-y-3 text-xs leading-relaxed text-slate-600">
                          <h4 className="font-display font-semibold text-slate-800 uppercase tracking-wider text-[10px]">Citizen Grievance Description</h4>
                          <p className="bg-slate-50 p-3 rounded-xl border border-slate-150 leading-relaxed">
                            {selectedComplaint.description}
                          </p>
                        </div>
                        {selectedComplaint.image && (
                          <div className="md:col-span-4 space-y-1.5 text-xs">
                            <h4 className="font-display font-semibold text-slate-800 uppercase tracking-wider text-[10px]">Submitted Photo</h4>
                            <div className="aspect-video md:aspect-square rounded-xl overflow-hidden border border-slate-200">
                              <img src={selectedComplaint.image} alt="Grievance context" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* AI Copilot Audit Analysis Box */}
                      {selectedComplaint.ai_analysis && (
                        <div id="ai-analysis-block" className="bg-gradient-to-tr from-slate-900 to-slate-850 text-white rounded-2xl p-5 relative overflow-hidden text-xs space-y-4">
                          {/* absolute decorative background icon */}
                          <div className="absolute top-0 right-0 p-4 text-white opacity-5 pointer-events-none">
                            <Bot className="w-24 h-24" />
                          </div>

                          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-600/30 p-1.5 rounded-lg border border-blue-500/20 text-blue-400">
                                <Bot className="w-4 h-4 text-blue-400" />
                              </div>
                              <div>
                                <h4 className="font-display font-bold text-sm text-slate-100 flex items-center gap-1">
                                  <span>Gemini AI Priority Analysis</span>
                                  <span className="text-[8px] bg-blue-500 text-white px-1 py-0.2 rounded font-bold uppercase">Decision Support</span>
                                </h4>
                                <p className="text-[9px] text-slate-400 mt-0.5">Automated on-submission routing recommendation</p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">AI Severity Rank</span>
                              <span className={`font-display font-bold text-sm ${
                                selectedComplaint.ai_analysis.severity === 'Critical' ? 'text-rose-400' :
                                selectedComplaint.ai_analysis.severity === 'High' ? 'text-orange-400' : 'text-slate-300'
                              }`}>
                                {selectedComplaint.ai_analysis.severity}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-[10px] block">Assigned Board</span>
                              <span className="font-bold text-slate-100 line-clamp-1 mt-0.5">{selectedComplaint.ai_analysis.department}</span>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-[10px] block">Calculated Priority Score</span>
                              <span className="font-bold text-blue-400 mt-0.5 text-sm font-mono">{selectedComplaint.ai_analysis.priority_score} / 100</span>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-[10px] block">Estimated Repair Cost</span>
                              <span className="font-bold text-emerald-400 mt-0.5 text-sm font-mono">₹{selectedComplaint.ai_analysis.estimated_cost.toLocaleString()}</span>
                            </div>
                            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                              <span className="text-slate-400 text-[10px] block">Lodge Sentiment Index</span>
                              <span className="font-bold text-slate-100 mt-0.5">{selectedComplaint.ai_analysis.sentiment}</span>
                            </div>
                          </div>

                          <div className="space-y-1.5 text-left border-t border-slate-800/80 pt-3">
                            <span className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider block">AI Ground-Team Action Recommendation:</span>
                            <p className="text-slate-300 leading-relaxed font-sans font-medium text-xs">
                              "{selectedComplaint.ai_analysis.recommendation}"
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Officer Operations Console */}
                      {currentUser.role !== 'Citizen' && (
                        <div id="officer-actions-console" className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                          <h4 className="font-display font-semibold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Shield className="w-4 h-4 text-blue-600" />
                            Officer Operations Control Console
                          </h4>
                          
                          <div className="flex flex-wrap gap-2">
                            {selectedComplaint.status === 'Pending' && (
                              <>
                                <button
                                  id="officer-accept-btn"
                                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'Accepted')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                >
                                  Accept & Mobilize
                                </button>
                                <button
                                  id="officer-reject-btn"
                                  onClick={() => handleUpdateStatus(selectedComplaint.id, 'Rejected')}
                                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                                >
                                  Reject Report
                                </button>
                              </>
                            )}

                            {(selectedComplaint.status === 'Pending' || selectedComplaint.status === 'Accepted') && (
                              <button
                                id="officer-escalate-btn"
                                onClick={() => handleUpdateStatus(selectedComplaint.id, 'Escalated')}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                              >
                                Escalate to Commissioner
                              </button>
                            )}

                            {selectedComplaint.status !== 'Resolved' && (
                              <button
                                id="officer-resolve-btn"
                                onClick={() => handleUpdateStatus(selectedComplaint.id, 'Resolved')}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg transition"
                              >
                                Mark as Repaired & Solved
                              </button>
                            )}

                            {selectedComplaint.status === 'Resolved' && (
                              <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 animate-bounce" />
                                Complaint resolved. Work complete.
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Comments & Updates Timeline */}
                      <div className="space-y-4">
                        <h4 className="font-display font-semibold text-slate-800 text-xs uppercase tracking-wider">Comments & Update Logs</h4>
                        
                        <div id="comments-timeline-list" className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                          {selectedComplaint.comments.length === 0 ? (
                            <p className="text-slate-400 italic text-xs">No administrative comments yet.</p>
                          ) : (
                            selectedComplaint.comments.map((cmt) => (
                              <div key={cmt.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5 text-xs text-left">
                                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                                    <span>{cmt.user_name}</span>
                                    <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded uppercase">{cmt.user_role}</span>
                                  </span>
                                  <span>{new Date(cmt.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-slate-600 leading-relaxed font-sans font-medium">{cmt.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Comment Form */}
                        <form id="comment-submission-form" onSubmit={handleAddComment} className="flex gap-2">
                          <input
                            id="comment-input-field"
                            type="text"
                            required
                            disabled={isSubmittingComment}
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder="Add comment, landmark update, or on-site status update..."
                            className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                          />
                          <button
                            id="submit-comment-btn"
                            type="submit"
                            disabled={isSubmittingComment || !commentText.trim()}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs transition"
                          >
                            Post Log
                          </button>
                        </form>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center text-slate-400 text-xs">
                      Select a grievance from the left sidebar to view fully authorized AI prioritizing audits, comments, and action plans.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        )}
      </main>

          {/* Footer Bar */}
          <footer className="h-8 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <div>Connected: <b>Municipality Main Server</b></div>
            <div className="flex gap-4">
              <span>Version 1.2.4-stable</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Operational</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Report Issue Modal */}
      {showReportModal && currentUser && (
        <ReportIssueModal
          wards={wards}
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={handleReportSubmitted}
          userId={currentUser.id}
          userName={currentUser.name}
        />
      )}
    </div>
  );
}
