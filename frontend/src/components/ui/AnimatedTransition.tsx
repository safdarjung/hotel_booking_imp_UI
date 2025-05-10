
import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedTransitionProps {
  children: React.ReactNode;
  className?: string;
  initial?: Record<string, any>;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: Record<string, any>;
}

const defaultPageVariants = {
  initial: {
    opacity: 0,
    y: 10
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: -10
  }
};

const defaultPageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

const AnimatedTransition = ({ 
  children, 
  className,
  initial,
  animate,
  exit,
  transition
}: AnimatedTransitionProps) => {
  return (
    <motion.div
      initial={initial || "initial"}
      animate={animate || "in"}
      exit={exit || "out"}
      variants={defaultPageVariants}
      transition={transition || defaultPageTransition}
      className={cn('w-full', className)}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedTransition;
