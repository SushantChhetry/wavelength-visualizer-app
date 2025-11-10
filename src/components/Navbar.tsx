import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconHome, IconInfoCircle } from '@tabler/icons-react';
import './Navbar.css';

export function Navbar() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: IconHome },
    { path: '/about', label: 'About', icon: IconInfoCircle },
  ];

  return (
    <motion.nav
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <motion.span
            className="brand-text"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            Wavelength
          </motion.span>
        </Link>

        <ul className="navbar-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`navbar-link ${isActive ? 'active' : ''}`}
                >
                  <motion.div
                    className="link-content"
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </motion.div>
                  {isActive && (
                    <motion.div
                      className="link-indicator"
                      layoutId="navbar-indicator"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.nav>
  );
}

