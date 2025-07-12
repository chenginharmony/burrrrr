import React from "react";

export default function ProfileSettings() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Profile Settings</h1>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input className="w-full border rounded px-3 py-2" placeholder="Your name" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input className="w-full border rounded px-3 py-2" placeholder="Your email" />
        </div>
        <button className="bg-gradient-to-r from-purple-600 to-lime-500 text-white px-6 py-2 rounded font-semibold">Save Changes</button>
      </form>
    </div>
  );
}
