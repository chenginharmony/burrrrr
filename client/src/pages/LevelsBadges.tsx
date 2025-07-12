import React from "react";

export default function LevelsBadges() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Levels & Badges</h1>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">Level 1</div>
          <div className="text-gray-600">Beginner</div>
        </div>
        <div className="bg-white rounded shadow p-4 text-center">
          <div className="text-2xl font-bold text-lime-500 mb-2">Badge: Streak</div>
          <div className="text-gray-600">Login 7 days in a row</div>
        </div>
      </div>
    </div>
  );
}
