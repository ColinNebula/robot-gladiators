import React from 'react';
import { motion } from 'framer-motion';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Report error to analytics/monitoring service if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'Arial, sans-serif'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: 'rgba(26, 26, 58, 0.95)',
              borderRadius: '16px',
              padding: '3rem',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid #4facfe',
              textAlign: 'center'
            }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              style={{
                fontSize: '4rem',
                marginBottom: '1rem'
              }}
            >
              ⚠️
            </motion.div>
            
            <h1 style={{
              color: '#fff',
              fontSize: '2.5rem',
              marginBottom: '1rem',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
            }}>
              Oops! Something went wrong
            </h1>
            
            <p style={{
              color: '#b0b0b0',
              fontSize: '1.2rem',
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              The game encountered an unexpected error. Don't worry, this happens sometimes in the digital battlefield!
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                background: 'rgba(255, 71, 87, 0.1)',
                border: '1px solid #ff4757',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '2rem',
                textAlign: 'left'
              }}>
                <summary style={{ 
                  color: '#ff4757', 
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  fontWeight: 'bold'
                }}>
                  🐛 Error Details (Development Mode)
                </summary>
                <pre style={{
                  color: '#fff',
                  fontSize: '0.9rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                  whiteSpace: 'pre-wrap'
                }}>
                  {this.state.error && this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleRetry}
                style={{
                  background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                🔄 Try Again
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(45deg, #ff4757 0%, #ff3838 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 71, 87, 0.3)',
                  transition: 'all 0.2s ease'
                }}
              >
                🏠 Reload Game
              </motion.button>
            </div>
            
            {this.state.retryCount > 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  marginTop: '2rem',
                  padding: '1rem',
                  background: 'rgba(255, 165, 0, 0.1)',
                  border: '1px solid #ffa502',
                  borderRadius: '8px',
                  color: '#ffa502'
                }}
              >
                <strong>🤔 Still having issues?</strong>
                <br />
                Try refreshing the page or check your browser console for more details.
              </motion.div>
            )}
            
            <p style={{
              color: '#64748b',
              fontSize: '0.9rem',
              marginTop: '2rem',
              fontStyle: 'italic'
            }}>
              "Even the mightiest gladiators stumble sometimes. Get back up and fight!" 💪
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;