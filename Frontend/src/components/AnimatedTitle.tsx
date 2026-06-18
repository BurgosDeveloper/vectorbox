import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedTitleProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const AnimatedTitle: React.FC<AnimatedTitleProps> = ({ text, className, style }) => {
  const words = text.split(' ');

  // Contenedor principal que coordina el retraso (stagger) de los hijos
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.1,
      },
    },
  };

  // Variación individual para cada letra
  const charVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 14,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.span
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
      style={{ display: 'inline-block', ...style }}
    >
      {words.map((word, wordIndex) => (
        <span
          key={wordIndex}
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap' as const,
            marginRight: '0.22em',
          }}
        >
          {word.split('').map((char, charIndex) => (
            <motion.span
              key={charIndex}
              variants={charVariants}
              style={{ display: 'inline-block' }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.span>
  );
};

export default AnimatedTitle;
