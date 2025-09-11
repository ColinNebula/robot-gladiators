import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

const AboutPage = () => {
  const { currentTheme } = useTheme();

  const features = [
    {
      icon: '🤖',
      title: 'Robot Gladiators',
      description: 'Choose from unique robotic fighters, each with their own abilities and fighting styles.'
    },
    {
      icon: '⚔️',
      title: 'Epic Battles',
      description: 'Engage in intense side-scrolling combat with advanced physics and collision detection.'
    },
    {
      icon: '🎮',
      title: 'Controller Support',
      description: 'Full support for Xbox, PlayStation, and Nintendo controllers with haptic feedback.'
    },
    {
      icon: '✨',
      title: 'Visual Effects',
      description: 'Experience stunning particle effects, screen shake, and smooth sprite animations.'
    },
    {
      icon: '🏆',
      title: 'Achievements',
      description: 'Unlock achievements and compete on global leaderboards.'
    },
    {
      icon: '🎨',
      title: 'Customizable',
      description: 'Multiple themes, accessibility options, and performance settings.'
    }
  ];

  const technologies = [
    { name: 'React', icon: '⚛️', description: 'Modern UI framework' },
    { name: 'Vite', icon: '⚡', description: 'Fast build tool' },
    { name: 'Canvas API', icon: '🎨', description: 'Game rendering' },
    { name: 'Gamepad API', icon: '🎮', description: 'Controller support' },
    { name: 'Framer Motion', icon: '🎬', description: 'Animations' },
    { name: 'React Router', icon: '🛣️', description: 'Navigation' }
  ];

  return (
    <div style={{
      minHeight: '80vh',
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          textAlign: 'center',
          marginBottom: '4rem'
        }}
      >
        <motion.h1
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)',
            fontWeight: 'bold',
            background: currentTheme.gradients.primary,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '1rem'
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'linear'
          }}
        >
          About Nebula Wars
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            fontSize: '1.25rem',
            color: currentTheme.colors.textSecondary,
            maxWidth: '800px',
            margin: '0 auto',
            lineHeight: 1.6
          }}
        >
          An epic robot gladiator arena built with modern web technologies. 
          Experience the thrill of cosmic combat in this cutting-edge browser game.
        </motion.p>
      </motion.div>

      {/* Game Description */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{
          marginBottom: '4rem',
          padding: '2rem',
          background: currentTheme.colors.surface,
          borderRadius: '16px',
          boxShadow: currentTheme.shadows.medium
        }}
      >
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          The Ultimate Robot Combat Experience 🤖⚔️
        </h2>
        
        <div style={{
          fontSize: '1.1rem',
          color: currentTheme.colors.text,
          lineHeight: 1.8,
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <p style={{ marginBottom: '1.5rem' }}>
            In the distant future, robot gladiators battle for supremacy in the cosmic arenas 
            of the Nebula Wars. Choose your mechanical warrior, master devastating combos, and 
            rise through the ranks to become the ultimate champion.
          </p>
          
          <p style={{ marginBottom: '1.5rem' }}>
            Built as a modern web application, Nebula Wars showcases the power of contemporary 
            browser technologies. From its humble beginnings as a vanilla JavaScript game, 
            it has evolved into a comprehensive React-based experience with advanced features 
            like gamepad support, particle physics, and real-time combat mechanics.
          </p>
          
          <p>
            Whether you're a casual gamer looking for quick battles or a competitive player 
            aiming for leaderboard dominance, Nebula Wars offers an engaging experience 
            that pushes the boundaries of what's possible in a browser-based game.
          </p>
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ marginBottom: '4rem' }}
      >
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Game Features
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              whileHover={{ 
                scale: 1.02,
                boxShadow: currentTheme.shadows.large
              }}
              style={{
                padding: '2rem',
                background: currentTheme.colors.surface,
                borderRadius: '12px',
                border: `1px solid ${currentTheme.colors.primary}30`,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '3rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                {feature.icon}
              </div>
              
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: currentTheme.colors.text,
                marginBottom: '0.75rem',
                textAlign: 'center'
              }}>
                {feature.title}
              </h3>
              
              <p style={{
                color: currentTheme.colors.textSecondary,
                lineHeight: 1.6,
                textAlign: 'center',
                margin: 0
              }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Technology Stack */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ marginBottom: '4rem' }}
      >
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Built With Modern Technologies
        </h2>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          {technologies.map((tech, index) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.05 }}
              whileHover={{ scale: 1.05 }}
              style={{
                padding: '1.5rem',
                background: `linear-gradient(135deg, ${currentTheme.colors.primary}10, ${currentTheme.colors.secondary}10)`,
                borderRadius: '12px',
                border: `1px solid ${currentTheme.colors.primary}20`,
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{
                fontSize: '2rem',
                marginBottom: '0.5rem'
              }}>
                {tech.icon}
              </div>
              
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: currentTheme.colors.text,
                marginBottom: '0.25rem'
              }}>
                {tech.name}
              </h4>
              
              <p style={{
                color: currentTheme.colors.textSecondary,
                fontSize: '0.9rem',
                margin: 0
              }}>
                {tech.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Development Info */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        style={{
          padding: '2rem',
          background: `linear-gradient(135deg, ${currentTheme.colors.surface}, ${currentTheme.colors.primary}10)`,
          borderRadius: '16px',
          textAlign: 'center',
          border: `1px solid ${currentTheme.colors.primary}30`
        }}
      >
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: currentTheme.colors.text,
          marginBottom: '1rem'
        }}>
          Development Journey
        </h3>
        
        <p style={{
          color: currentTheme.colors.textSecondary,
          fontSize: '1.1rem',
          lineHeight: 1.6,
          maxWidth: '700px',
          margin: '0 auto 1.5rem'
        }}>
          This project began as a simple vanilla JavaScript robot fighting game and evolved 
          into a comprehensive React-based experience. It demonstrates the evolution from 
          basic DOM manipulation to modern component-based architecture, showcasing 
          progressive enhancement and modern web development practices.
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          flexWrap: 'wrap',
          marginTop: '2rem'
        }}>
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.primary
            }}>
              2024
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              Year Created
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.secondary
            }}>
              React
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              Framework
            </div>
          </div>
          
          <div>
            <div style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: currentTheme.colors.success || currentTheme.colors.primary
            }}>
              Open
            </div>
            <div style={{
              color: currentTheme.colors.textSecondary,
              fontSize: '0.9rem'
            }}>
              Source
            </div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default AboutPage;