import React from "react";
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <button className="bg-gray-200 px-4 py-2 rounded">Toggle</button>
        </div>
        <div className="flex items-center justify-between">
          <span>Notifications</span>
          <button className="bg-gray-200 px-4 py-2 rounded">Toggle</button>
        </div>
        <div className="flex items-center justify-between">
          <span>Profile Settings</span>
          <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => navigate('/settings/profile')}>Edit Profile</button>
        </div>
      </div>
    </div>
  );
}