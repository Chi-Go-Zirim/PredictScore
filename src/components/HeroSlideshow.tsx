import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HeroSlideshowProps {
  fallbackImage: string;
}

export default function HeroSlideshow({ fallbackImage }: HeroSlideshowProps) {
  const [validImages, setValidImages] = useState<string[]>([fallbackImage]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef<any>(null);

  // Validate prospective images on mount
  useEffect(() => {
    const prospectiveUrls = [
      fallbackImage, // Slide 1 (local asset, always first)
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1296&q=80", // Slide 2
      "https://unsplash.com/photos/white-blue-soccer-ball-on-green-grass-field-during-daytime-Ept2Na00VGY", // Slide 3
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=1296&q=80", // Slide 4
      "https://i.postimg.cc/QdjFp3X9/Chat-GPT-Image-Jul-3-2026-10-43-49-AM.png", // Slide 5
      "https://i.postimg.cc/yNV0YRg1/Chat-GPT-Image-Jul-3-2026-10-48-43-AM.png", // Slide 6
      "https://i.postimg.cc/sxSJZrVM/Chat-GPT-Image-Jul-3-2026-10-54-08-AM.png", // Slide 7
    ];

    // Track which images have been validated
    const validated: string[] = [fallbackImage]; // Always include fallback as guaranteed
    const urlsToTest = prospectiveUrls.slice(1);

    if (urlsToTest.length === 0) return;

    urlsToTest.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        validated.push(url);
        // Maintain the original requested order as much as possible
        setValidImages((prev) => {
          const combined = [...new Set([...prev, url])];
          return combined.sort((a, b) => prospectiveUrls.indexOf(a) - prospectiveUrls.indexOf(b));
        });
      };
      img.onerror = () => {
        // Silently ignore failed images
      };
    });
  }, [fallbackImage]);

  // Handle auto-advancing every 4 seconds
  useEffect(() => {
    if (validImages.length <= 1 || isHovered) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % validImages.length);
    }, 4000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [validImages, isHovered]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + validImages.length) % validImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % validImages.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  return (
    <div 
      className="relative w-full h-full group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={validImages[currentIndex]}
          src={validImages[currentIndex]}
          alt={`FIFA World Cup 2026 - Slide ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover object-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>

      {/* Navigation Arrows - Visible on hover */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-xs cursor-pointer z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-xs cursor-pointer z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {validImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-xs z-10">
          {validImages.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => handleDotClick(idx, e)}
              className={`w-2 h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex 
                  ? "bg-brand-primary w-4" 
                  : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
