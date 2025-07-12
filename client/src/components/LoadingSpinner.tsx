import React from 'react';

export default function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100px' }}>
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
    </div>
  );
}
