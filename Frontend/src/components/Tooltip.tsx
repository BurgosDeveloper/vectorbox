import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipEl = tooltipRef.current;
    const tooltipHeight = tooltipEl?.offsetHeight ?? 36;
    const tooltipWidth = tooltipEl?.offsetWidth ?? 180;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = rect.top - tooltipHeight - 8;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - 8;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + 8;
        break;
    }

    setCoords({ top, left });
  }, [position]);

  useEffect(() => {
    if (isVisible) {
      // Calculate position immediately and again after a frame (for tooltip dimensions)
      updatePosition();
      const raf = requestAnimationFrame(updatePosition);
      return () => cancelAnimationFrame(raf);
    }
  }, [isVisible, updatePosition]);

  const getTransform = () => {
    if (position === 'top' || position === 'bottom') {
      return 'translateX(-50%)';
    }
    return 'none';
  };

  const getInitialY = () => {
    if (position === 'top') return 4;
    if (position === 'bottom') return -4;
    return 0;
  };

  const tooltipElement = (
    <AnimatePresence>
      {isVisible && coords && (
        <motion.div
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.85, y: getInitialY() }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: getInitialY() }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            zIndex: 9999,
            top: coords.top,
            left: coords.left,
            transform: getTransform(),
            backgroundColor: '#141A17',
            color: '#C2AD90',
            border: '1px solid rgba(151, 117, 77, 0.4)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '0.75rem',
            lineHeight: '1.4',
            pointerEvents: 'none',
            width: 'max-content',
            maxWidth: '220px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.7)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div
      ref={triggerRef}
      style={{ position: 'relative', display: 'inline-block', width: '100%' }}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocusCapture={() => setIsVisible(true)}
      onBlurCapture={() => setIsVisible(false)}
    >
      {children}
      {ReactDOM.createPortal(tooltipElement, document.body)}
    </div>
  );
};
export default Tooltip;
