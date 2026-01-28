import React, { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Mail, ShieldCheck, LogOut, Target, Cpu, CreditCard, Zap, XCircle, Loader2, PlayCircle, CheckCircle, Edit3, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../contexts/DataContext'; 

const API_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const Profile = () => {
  const { profile, refreshAll } = useData(); 
  
  const [isCancelling, setIsCancelling] = useState(false);
  const [isStartingTrial, setIsStartingTrial] = useState(false);
  const [isLandingAfterPayment, setIsLandingAfterPayment] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true' || params.get('session_id')) {
      setIsLandingAfterPayment(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      const sync = async () => {
        await refreshAll();
        setTimeout(() => {
          setIsLandingAfterPayment(false);
        }, 3000);
      };
      sync();
    }
  }, [refreshAll]);

  const handleLogout = () => {
    localStorage.removeItem('adt_token');
    localStorage.removeItem('adt_profile');
    window.location.href = '/login'; 
  };

  const handleUpdateProfile = async (field, value) => {
    try {
      const token = localStorage.getItem('adt_token');
      // Create update payload based on existing profile + the new change
      const payload = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        organization: profile.organization,
        industry: profile.industry,
        [field]: value
      };

      const response = await fetch(`${API_URL}/auth/profile/update`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await refreshAll();
      }
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      const token = localStorage.getItem('adt_token');
      const response = await fetch(`${API_URL}/billing/start-trial`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error(err);
      alert("Failed to initialize checkout.");
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure? You will lose access to premium features immediately.")) {
      return;
    }
    setIsCancelling(true);
    try {
      const token = localStorage.getItem('adt_token');
      const response = await fetch(`${API_URL}/payments/cancel`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        alert("Subscription cancelled successfully.");
        await refreshAll(); 
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail || "Failed to cancel"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Network error.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (!profile) return (
    <div className="h-screen w-full flex items-center justify-center bg-black">
      <div className="relative">
        <div className="w-24 h-24 border-2 border-purple-500/20 rounded-full animate-ping"></div>
        <Cpu className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={32} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden flex flex-col font-sans">
      <AnimatePresence>
        {isLandingAfterPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center text-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-purple-500/20 blur-[100px] rounded-full animate-pulse" />
              <CheckCircle size={80} className="text-emerald-400 mx-auto mb-6" />
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-2">Protocol Verified</h2>
              <p className="text-purple-400 font-bold uppercase tracking-[0.3em] text-xs">Neural Engine Subscription Activated</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex flex-col w-full max-w-7xl mx-auto px-6 md:px-12">
        <header className="w-full py-12 md:py-20 flex flex-col lg:flex-row justify-between items-center gap-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center gap-8 w-full min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 md:w-40 md:h-40 rounded-[3rem] bg-gradient-to-br from-purple-600 to-blue-600 p-[1px] rotate-3">
                <div className="w-full h-full bg-black rounded-[3rem] flex items-center justify-center -rotate-3">
                  <User size={64} className="text-white opacity-90" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-3 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.4)] border-4 border-black">
                <ShieldCheck size={24} className="text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mb-4">
                <span className="bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full border border-white/10">Verified Executive</span>
                <span className="text-white/30 font-mono text-[10px] tracking-widest uppercase">ID // {profile?.user_id ? String(profile.user_id).substring(0, 12) : '----'}</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-[0.85] break-words">
                <span className="text-white">{profile?.first_name} </span>
                <span className="text-purple-500">{profile?.last_name}</span>
              </h1>
            </div>
          </div>
        </header>

        <main className="py-12 space-y-12">
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProfileItem 
              icon={<Mail size={24} className="text-purple-500" />} 
              label="Email Address" 
              value={profile?.email} 
              readonly
            />
            <ProfileItem 
              icon={<Building2 size={24} className="text-blue-500" />} 
              label="Organization" 
              value={profile?.organization} 
              onSave={(val) => handleUpdateProfile('organization', val)}
            />
            <ProfileItem 
              icon={<Briefcase size={24} className="text-emerald-500" />} 
              label="Industry" 
              value={profile?.industry} 
              onSave={(val) => handleUpdateProfile('industry', val)}
            />
          </section>

          <section className="relative overflow-hidden bg-gradient-to-r from-zinc-900 to-black border border-white/10 rounded-[3.5rem] p-10 md:p-14 shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={120} className="text-purple-500" />
            </div>
            
            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
              <div className="space-y-4 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-3">
                  <CreditCard className="text-purple-500" size={24} />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Billing_Protocol_V1</h3>
                </div>
                <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                  Subscription <span className={profile?.is_trial_active ? "text-purple-500" : "text-zinc-500"}>
                    {profile?.is_trial_active ? "Active" : "Inactive"}
                  </span>
                </h2>
                <p className="text-zinc-400 max-w-md text-sm md:text-base">
                  {profile?.is_trial_active 
                    ? "Data analyst is currently activated. Premium features are currently unlocked."
                    : "Activate Data analyst."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                {profile?.is_trial_active ? (
                  <button 
                    onClick={handleCancelSubscription}
                    disabled={isCancelling}
                    className="group flex items-center gap-4 bg-red-500/10 border border-red-500/30 text-red-500 px-8 py-5 rounded-2xl hover:bg-red-500 hover:text-white transition-all transform active:scale-95 shadow-xl justify-center disabled:opacity-50"
                  >
                    {isCancelling ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                      {isCancelling ? "Processing..." : "Cancel Plan"}
                    </span>
                  </button>
                ) : (
                  <button 
                    onClick={handleStartTrial}
                    disabled={isStartingTrial}
                    className="group flex items-center gap-4 bg-purple-600 text-white px-10 py-5 rounded-2xl hover:bg-white hover:text-black transition-all transform active:scale-95 shadow-[0_0_30px_rgba(147,51,234,0.3)] justify-center disabled:opacity-50"
                  >
                    {isStartingTrial ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">
                      {isStartingTrial ? "Initializing..." : "Activate Data Analyst"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProfileItem icon={<Target size={24} className="text-amber-500" />} label="Node Type" value="Remote Operational Node" readonly />
            <ProfileItem icon={<Cpu size={24} className="text-zinc-400" />} label="System Architecture" value="Metria Universal 2026" readonly />
          </section>

          <div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-6 border-t border-white/5">
            <button 
              onClick={handleLogout}
              className="group flex items-center gap-4 bg-red-500/10 hover:bg-red-500 border border-red-500/20 px-12 py-6 rounded-full transition-all w-full sm:w-auto justify-center"
            >
              <LogOut size={20} className="text-red-500 group-hover:text-white" />
              <span className="text-[11px] font-black uppercase tracking-[0.4em] text-red-500 group-hover:text-white">Sign Out of Session</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

const ProfileItem = ({ icon, label, value, onSave, readonly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || "");

  const handleBlur = () => {
    setIsEditing(false);
    if (currentValue !== value && onSave) {
      onSave(currentValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleBlur();
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3.5rem] hover:bg-white/[0.04] hover:border-white/10 transition-all group min-w-0 flex flex-col relative">
      <div className="mb-10 p-4 w-fit rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-3">{label}</p>
      
      {!readonly && !isEditing && (
        <button 
          onClick={() => setIsEditing(true)}
          className="absolute top-10 right-10 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-purple-500"
        >
          <Edit3 size={16} />
        </button>
      )}

      {isEditing && !readonly ? (
        <div className="flex items-center gap-2">
          <input 
            autoFocus
            className="bg-purple-500/10 border-b-2 border-purple-500 text-2xl font-bold tracking-tight text-white w-full outline-none py-1"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <Check size={20} className="text-emerald-500" />
        </div>
      ) : (
        <p 
          className={`text-2xl font-bold tracking-tight text-white truncate group-hover:whitespace-normal break-all ${!readonly ? 'cursor-pointer hover:text-purple-400' : ''}`}
          onClick={() => !readonly && setIsEditing(true)}
        >
          {value || "---"}
        </p>
      )}
    </div>
  );
};

export default Profile;