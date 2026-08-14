import { useScroll } from "framer-motion";
import { useTransform } from "framer-motion";
import { useRef } from "react";

interface UseParallaxProps {
  speed?: number;
  direction?: 'up' | 'down';
  offset?: number;
}

export const useParallax = ({ speed = 0.5, direction = 'up', offset = 0 }: UseParallaxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up' 
      ? [`${offset}px`, `-${speed * 100 + offset}px`] 
      : [`-${speed * 100 + offset}px`, `${offset}px`]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.7, 1, 1, 0.7]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    [1, 1 + speed * 0.1]
  );

  return { ref, transform: y, opacity, scale };
};