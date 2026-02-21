import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Custom hook to handle hash (#) navigation and scroll to element
 * Handles cross-page navigation with retry logic for async content
 */
const useScrollToHash = () => {
  const location = useLocation();

  useEffect(() => {
    // Check if URL has a hash
    if (location.hash) {
      // Remove the # symbol
      const id = location.hash.replace('#', '');
      
      // Function to attempt scrolling
      const scrollToElement = () => {
        const element = document.getElementById(id);
        
        if (element) {
          // Add small delay to ensure rendering is complete
          setTimeout(() => {
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start'
            });
            
            // Optional: Add offset for fixed headers (uncomment and adjust if needed)
            // setTimeout(() => {
            //   const offset = 100; // Height of your fixed header
            //   const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
            //   window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
            // }, 100);
          }, 100);
          
          return true; // Element found and scrolled
        }
        return false; // Element not found
      };

      // Strategy: Multiple retry attempts with increasing delays
      // This handles:
      // 1. Immediate render (0ms)
      // 2. Fast components (100ms)
      // 3. API data loading (500ms, 1000ms)
      // 4. Slow connections (2000ms)
      
      let attempts = 0;
      const maxAttempts = 20; // Total attempts
      const checkInterval = 100; // Check every 100ms
      
      const intervalId = setInterval(() => {
        attempts++;
        
        if (scrollToElement()) {
          // Success! Clear interval
          clearInterval(intervalId);
        } else if (attempts >= maxAttempts) {
          // Give up after 2 seconds (20 * 100ms)
          clearInterval(intervalId);
          console.warn(`Element with id "${id}" not found after ${maxAttempts} attempts`);
        }
      }, checkInterval);

      // Cleanup interval on unmount
      return () => clearInterval(intervalId);
      
    } else {
      // If no hash, scroll to top (default behavior)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname, location.hash]); // Listen to both path and hash changes
};

export default useScrollToHash;
