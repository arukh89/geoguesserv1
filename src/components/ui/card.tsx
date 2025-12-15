import * as React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...p }) => (
  <div
    className={`
      border border-[rgba(0,255,65,0.3)] 
      bg-[rgba(0,18,0,0.5)] 
      backdrop-blur-[3px] 
      shadow-[0_0_15px_rgba(0,255,65,0.2)]
      rounded-lg
      ${className}
    `}
    {...p}
  />
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...p }) => (
  <div className={`p-4 border-b border-[rgba(0,255,65,0.3)] ${className}`} {...p} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className = '', ...p }) => (
  <h3 className={`text-lg font-semibold mx-accent ${className}`} {...p} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className = '', ...p }) => (
  <p className={`text-sm text-[color:rgba(151,255,151,0.8)] ${className}`} {...p} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = '', ...p }) => (
  <div className={`p-4 ${className}`} {...p} />
);
