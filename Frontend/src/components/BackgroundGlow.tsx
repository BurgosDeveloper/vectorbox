import React from 'react';

/**
 * BackgroundGlow — Lightweight ambient background
 * Uses pure CSS animations instead of Framer Motion to avoid JS thread overhead.
 * Only 4 small particles with radial-gradient (no filter: blur).
 */
export const BackgroundGlow: React.FC = () => {
  // 4 particles with predefined positions and animation delays
  const particles = [
    { size: 60, x: 15, y: 20, delay: '0s', duration: '35s' },
    { size: 45, x: 75, y: 30, delay: '8s', duration: '40s' },
    { size: 80, x: 40, y: 70, delay: '4s', duration: '30s' },
    { size: 35, x: 85, y: 80, delay: '12s', duration: '45s' },
  ];

  return (
    <div style={styles.container}>
      {/* Mesh gradient — CSS animation for background-position */}
      <div style={styles.mesh} />

      {/* Lightweight bronze particles — CSS keyframe animations only */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            ...styles.particle,
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: -1,
    overflow: 'hidden',
    backgroundColor: '#0C100E',
    pointerEvents: 'none',
    willChange: 'transform',
    transform: 'translateZ(0)',
  },
  mesh: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage:
      'radial-gradient(at 0% 0%, rgba(54, 68, 66, 0.25) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(151, 117, 77, 0.06) 0px, transparent 50%)',
    backgroundSize: '200% 200%',
    animation: 'meshDrift 30s linear infinite',
  },
  particle: {
    position: 'absolute',
    borderRadius: '50%',
    background:
      'radial-gradient(circle, rgba(151, 117, 77, 0.08) 0%, transparent 60%)',
    transform: 'translate(-50%, -50%)',
    willChange: 'transform, opacity',
    animation: 'particleFloat 35s ease-in-out infinite',
  },
};

export default BackgroundGlow;
