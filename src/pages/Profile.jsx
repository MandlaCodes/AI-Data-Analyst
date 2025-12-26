import React, { useState, useEffect } from 'react';
import { User, Building2, Briefcase, Mail, ShieldCheck, Clock } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token'); // Or however you store your JWT
        const response = await fetch('http://localhost:8000/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) throw new Error('Failed to fetch profile data');

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
      Error: {error}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Account Profile</h1>
        <p className="text-gray-500">Manage your neural engine identity and organization settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">
              {profile.first_name} {profile.last_name}
            </h2>
            <p className="text-sm text-gray-500">{profile.organization || 'Independent Analyst'}</p>
            <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3 h-3" /> Verified Account
            </div>
          </div>
        </div>

        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gray-50/50">
              <h3 className="font-medium text-gray-900">Identity Details</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 gap-6">
              {/* Email Row */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Email Address</p>
                  <p className="text-gray-700 font-medium">{profile.email}</p>
                </div>
              </div>

              {/* Organization Row */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Organization</p>
                  <p className="text-gray-700 font-medium">{profile.organization || 'Not Specified'}</p>
                </div>
              </div>

              {/* Industry Row */}
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Primary Industry</p>
                  <p className="text-gray-700 font-medium">{profile.industry || 'Not Specified'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Meta */}
          <div className="flex items-center justify-between text-sm text-gray-400 px-2">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              User ID: {profile.user_id}
            </div>
            <button className="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;