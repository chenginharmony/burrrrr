import React from "react";

export default function HelpSupport() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Help & Support</h1>
      <p className="text-gray-600">Need help? Contact our support team or browse FAQs.</p>
      <ul className="list-disc pl-6 mt-4 text-gray-700">
        <li>Email: support@betchat.com</li>
        <li>FAQ: <a href="#" className="text-purple-600 underline">View FAQs</a></li>
      </ul>
    </div>
  );
}
