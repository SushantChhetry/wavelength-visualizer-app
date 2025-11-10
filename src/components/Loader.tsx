import { motion } from 'framer-motion';
import './Loader.css';

interface LoaderProps {
  variant?: 'spinner' | 'pulse' | 'wave';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function Loader({ variant = 'spinner', size = 'medium', className = '' }: LoaderProps) {
  const sizeClasses = {
    small: 'loader-small',
    medium: 'loader-medium',
    large: 'loader-large',
  };

  const renderSpinner = () => (
    <div className={`loader-spinner ${sizeClasses[size]}`}>
      <motion.div
        className="spinner-ring"
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );

  const renderPulse = () => (
    <div className={`loader-pulse ${sizeClasses[size]}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="pulse-dot"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );

  const renderWave = () => (
    <div className={`loader-wave ${sizeClasses[size]}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="wave-bar"
          animate={{
            height: ['20%', '100%', '20%'],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.1,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );

  const renderLoader = () => {
    switch (variant) {
      case 'pulse':
        return renderPulse();
      case 'wave':
        return renderWave();
      default:
        return renderSpinner();
    }
  };

  return (
    <div className={`loader-container ${className}`}>
      {renderLoader()}
    </div>
  );
}

