import React from 'react';

interface PhoneMockupProps {
  children: React.ReactNode;
  className?: string;
}

export const PhoneMockup: React.FC<PhoneMockupProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative mx-auto ${className}`} style={{ maxWidth: '280px' }}>
      {/* Phone frame */}
      <div className="relative bg-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-2xl z-10" />
        
        {/* Screen */}
        <div className="relative bg-background rounded-[2rem] overflow-hidden" style={{ aspectRatio: '9/19.5' }}>
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-6 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-between px-6 text-[10px] text-muted-foreground">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-muted-foreground/50 rounded-sm" />
            </div>
          </div>
          
          {/* Content area */}
          <div className="relative w-full h-full pt-6">
            {children}
          </div>
        </div>
        
        {/* Home indicator */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
};
