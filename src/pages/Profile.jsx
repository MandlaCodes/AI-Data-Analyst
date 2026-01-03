import React, { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Mail, ShieldCheck, LogOut, Target, Cpu } from 'lucide-react';

const API_URL = "https://ai-data-analyst-backend-1nuw.onrender.com";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('adt_token');
    localStorage.removeItem('adt_profile');
    window.location.href = '/login'; 
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('adt_token');
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return (
    <div className="h-screen w-full  flex items-center justify-center">
      <div className="relative">
        <div className="w-24 h-24 border-2 border-purple-500/20 rounded-full animate-ping"></div>
        <Cpu className="absolute inset-0 m-auto text-purple-500 animate-pulse" size={32} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-black text-white overflow-x-hidden flex flex-col font-sans">
      
      {/* --- BACKGROUND MESH --- */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/40 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 flex flex-col w-full max-w-7xl mx-auto px-6 md:px-12">
        
        {/* --- HEADER --- */}
        <header className="w-full py-12 md:py-20 flex flex-col lg:flex-row justify-between items-center gap-10 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center gap-8 w-full min-w-0">
            {/* Avatar */}
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

            {/* Name Container */}
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

        {/* --- MAIN CONTENT AREA --- */}
        <main className="py-12 space-y-12">
          {/* Data Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProfileItem 
                icon={<Mail size={24} className="text-purple-500" />} 
                label="Email Address" 
                value={profile?.email} 
            />
            <ProfileItem 
                icon={<Building2 size={24} className="text-blue-500" />} 
                label="Organization" 
                value={profile?.organization || "N/A"} 
            />
            <ProfileItem 
                icon={<Briefcase size={24} className="text-emerald-500" />} 
                label="Industry" 
                value={profile?.industry || "N/A"} 
            />
            <ProfileItem 
                icon={<Target size={24} className="text-amber-500" />} 
                label="Node Type" 
                value="Remote Operational Node" 
            />
          </section>

          {/* Action Footer */}
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

/* --- SUB-COMPONENTS --- */

const ProfileItem = ({ icon, label, value }) => (
  <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[3.5rem] hover:bg-white/[0.04] hover:border-white/10 transition-all group min-w-0">
    <div className="mb-10 p-4 w-fit rounded-2xl bg-white/5 border border-white/5 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 mb-3">{label}</p>
    <p className="text-2xl font-bold tracking-tight text-white truncate group-hover:whitespace-normal break-all">
        {value || "---"}
    </p>
  </div>
);

export default Profile;