'use client';

import { motion } from 'motion/react';

export const Dots_v4 = () => (
  <div className="flex items-center justify-center space-x-2">
    {[...Array(3)].map((_, index) => (
      <motion.span
        key={index}
        className="bg-primary size-3.5 rounded-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          delay: index * 0.2,
          duration: 1.2,
          repeat: Infinity,
          repeatType: 'reverse',
        }}
      ></motion.span>
    ))}
  </div>
);
