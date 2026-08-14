import React from 'react';
import { useRevealOnScroll } from '@/hooks/use-parallax';

interface RevealOnScrollProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const RevealOnScroll: React.FC<RevealOnScrollProps> = ({
  children,
  threshold = 0.1,
  className = '',
  delay = 0,
  direction = 'up',
}) => {
  const { ref, isVisible } = useRevealOnScroll(threshold);

  const getTransform = () => {
    if (!isVisible) return '';
    
    switch (direction) {
      case 'up':
        return 'translateY(0)';
      case 'down':
        return 'translateY(0)';
      case 'left':
        return 'translateX(0)';
      case 'right':
        return 'translateX(0)';
      default:
        return 'translateY(0)';
    }
  };

  const getInitialTransform = () => {
    if (isVisible) return '';
    
    switch (direction) {
      case 'up':
        return 'translateY(50px)';
      case 'down':
        return 'translateY(-50px)';
      case 'left':
        return 'translateX(50px)';
      case 'right':
        return 'translateX(-50px)';
      default:
        return 'translateY(50px)';
    }
  };

  return (
    <div
      ref={ref}
      className={`${className} transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        transform: isVisible ? getTransform() : getInitialTransform(),
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};