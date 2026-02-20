import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Show button when page is scrolled upto given distance
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Set the top cordinate to 0
  // make scrolling smooth
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 group flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500 text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_20px_60px_-15px_rgba(34,211,238,0.6)] backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-110 active:scale-95"
          aria-label="Volver arriba"
        >
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          <ArrowUp className="w-6 h-6 relative z-10" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
