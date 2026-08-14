import React from 'react';
import { useParallax } from '@/hooks/use-parallax';

interface ParallaxContainerProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  offset?: number;
  className?: string;
}

export const ParallaxContainer: React.FC<ParallaxContainerProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  offset = 0,
  className = '',
}) => {
  const { transform } = useParallax({ speed, direction, offset });

  return (
    <div 
      className={className}
      style={{ 
        transform,
        willChange: 'transform'
      }}
    >
      {children}
    </div>
  );
};