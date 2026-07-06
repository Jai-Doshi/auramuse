'use client';

import React, { useState, useEffect, useRef } from 'react';

/**
 * VirtualItem is a wrapper component that virtualizes its children.
 * If the component is scrolled far off-screen, its children (e.g. image tags)
 * are completely destroyed to save RAM/GPU memory, rendering a lightweight
 * shimmer placeholder of the exact same size to maintain layout flow.
 */
export default function VirtualItem({
  children,
  defaultHeight = 350,
  className = '',
  style = {},
  onClick
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(true); // default to true for SSR/initial mount hydration safety
  const [height, setHeight] = useState(null);
  const domRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);

    // Initialize IntersectionObserver to track viewport entry/exit
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        // 400px rootMargin creates a viewport buffer zone to load images
        // just before they scroll into view, ensuring a seamless user experience.
        rootMargin: '400px 0px 400px 0px',
        threshold: 0
      }
    );

    const currentEl = domRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, []);

  // Monitor height changes when visible to store the exact height
  useEffect(() => {
    if (!isVisible || !isMounted) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use getBoundingClientRect for layout height, which includes padding and borders
        const h = entry.target.getBoundingClientRect().height;
        if (h > 0) {
          setHeight((prev) => {
            // Avoid micro-re-renders by only updating if height change is substantial (> 2px)
            if (prev === null || Math.abs(prev - h) > 2) {
              return h;
            }
            return prev;
          });
        }
      }
    });

    const currentEl = domRef.current;
    if (currentEl) {
      resizeObserver.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        resizeObserver.unobserve(currentEl);
      }
    };
  }, [isVisible, isMounted]);

  // SSR / Hydration phase safety: render children normally
  if (!isMounted) {
    return (
      <div ref={domRef} className={className} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }

  // Offscreen state: render simple container with exact cached height containing shimmer loader
  if (!isVisible) {
    const placeholderHeight = height !== null ? height : defaultHeight;
    return (
      <div
        ref={domRef}
        className={className}
        style={{
          ...style,
          height: `${placeholderHeight}px`,
          position: 'relative',
          overflow: 'hidden',
          display: 'block'
        }}
        onClick={onClick}
      >
        <div 
          className="shimmer-card" 
          style={{ 
            width: '100%', 
            height: '100%', 
            borderRadius: 'inherit' 
          }} 
        />
      </div>
    );
  }

  // Onscreen state: render active content
  return (
    <div ref={domRef} className={className} style={style} onClick={onClick}>
      {children}
    </div>
  );
}
