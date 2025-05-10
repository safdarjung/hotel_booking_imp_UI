
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const backgrounds = [
  'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2070',
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?q=80&w=1770',
];

interface HeroSectionProps {
  children?: React.ReactNode;
}

const HeroSection = ({ children }: HeroSectionProps) => {
  const [currentBg, setCurrentBg] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgrounds.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen min-h-[600px] overflow-hidden">
      {backgrounds.map((bg, index) => (
        <div
          key={bg}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000 ease-in-out bg-cover bg-center bg-no-repeat",
            currentBg === index ? "opacity-100" : "opacity-0"
          )}
          style={{ backgroundImage: `url(${bg})` }}
        />
      ))}
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-semibold text-white mb-6 leading-tight">
            Discover Your Perfect Stay
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl">
            Explore the world's most extraordinary accommodations, from beachfront villas 
            to mountain chalets and urban retreats.
          </p>
          
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
