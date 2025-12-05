import React, { useState, useEffect } from "react";
import { FiUser, FiMail, FiCalendar, FiLock, FiEdit3 } from "react-icons/fi";

export default function Profile() {
    const [profile, setProfile] = useState({
        name: 'Analyst User',
        email: 'analyst.user@data-corp.com',
        role: 'Senior Data Analyst',
        memberSince: '2025-01-15',
        lastLogin: '2025-12-05T08:45:00Z',
        permissions: ['Read: All Dashboards', 'Write: Analysis', 'Admin: Settings'],
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        // In a real app, this would fetch user data from a server API.
        // For simulation, we can just load a placeholder or mock user object.
        const mockUser = {
            name: 'Aurora V. Data',
            email: 'aurora.v.data@analytics.io',
            role: 'Lead AI Strategist',
            memberSince: '2024-08-20',
            lastLogin: new Date().toLocaleString(),
            permissions: ['Read: All', 'Write: All', 'Admin: All'],
        };
        setProfile(mockUser);
    }, []);
    
    // Simulate updating a profile field (optional)
    const handleUpdate = () => {
        // In a real application, send updated profile data to a backend API.
        setIsEditing(false);
        // Display a temporary success message here
    };

    return (
        <div className="min-h-screen p-8 text-white" style={{ background: "linear-gradient(180deg,#0e121e,#15082e)" }}>
            <header className="mb-8 border-b border-gray-700/50 pb-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-purple-400">
                    <FiUser size={28} className="text-pink-400"/> User Profile
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Your account details and access level.
                </p>
            </header>
            
            <div className="max-w-3xl mx-auto bg-gray-900/50 p-8 rounded-xl border border-gray-700 shadow-xl">
                
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="text-4xl font-extrabold text-white">{profile.name}</div>
                        <div className="text-lg text-purple-400 font-medium mt-1">{profile.role}</div>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className="px-4 py-2 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition flex items-center gap-2 text-sm font-semibold"
                    >
                        <FiEdit3 size={14}/> {isEditing ? "Cancel" : "Edit Profile"}
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                        <FiMail className="text-purple-400"/>
                        <span className="font-medium">Email:</span>
                        <span className="text-gray-300">{profile.email}</span>
                    </div>

                    {/* Member Since */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                        <FiCalendar className="text-purple-400"/>
                        <span className="font-medium">Member Since:</span>
                        <span className="text-gray-300">{profile.memberSince}</span>
                    </div>
                    
                    {/* Last Login */}
                    <div className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                        <FiCalendar className="text-purple-400"/>
                        <span className="font-medium">Last Login:</span>
                        <span className="text-gray-300">{profile.lastLogin}</span>
                    </div>

                    {/* Permissions */}
                    <div className="pt-4 border-t border-gray-700/50">
                        <h3 className="text-xl font-semibold mb-2 flex items-center gap-2"><FiLock/> Access Permissions</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.permissions.map((p, i) => (
                                <span key={i} className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-500/50">
                                    {p}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                
                {isEditing && (
                    <div className="mt-6 text-right">
                        <button onClick={handleUpdate} className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold transition">
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}