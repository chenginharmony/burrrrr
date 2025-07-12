import React from "react";

export default function Settings() {
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
      </div>
    </div>
  );
}
