import * as React from 'react';

export const Progress: React.FC<{ value?: number; className?: string }> = ({ value = 0, className = '' }) => {
  const clamped = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`w-full rounded h-2 mx-progress ${className}`}>
      <div style={{ width: `${clamped}%` }} className="h-full bar rounded" />
    </div>
  );
};

export default Progress;
