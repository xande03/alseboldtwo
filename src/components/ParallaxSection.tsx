import React from 'react';
import { ParallaxContainer } from './ParallaxContainer';

interface ParallaxSectionProps {
  backgroundImage: string;
  children: React.ReactNode;
  speed?: number;
  className?: string;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  backgroundImage,
  children,
  speed = 0.3,
  className = '',
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          transform: 'translateZ(0)',
          willChange: 'transform',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <ParallaxContainer speed={speed} className="relative z-10 min-h-screen flex items-center justify-center">
        {children}
      </ParallaxContainer>
    </div>
  );
};