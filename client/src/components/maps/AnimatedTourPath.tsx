import React, { useEffect, useRef, useState } from 'react';

interface AnimatedTourPathProps {
  map: google.maps.Map;
  coordinates: Array<{ lat: number; lng: number }>;
  color?: string;
  speed?: number; // Animation speed in pixels per second
  pathWidth?: number;
  animate?: boolean;
  onComplete?: () => void;
}

/**
 * AnimatedTourPath - A component that draws an animated polyline path on a Google Map.
 * 
 * The path will animate to show tour route progression between multiple venues.
 */
const AnimatedTourPath: React.FC<AnimatedTourPathProps> = ({
  map,
  coordinates,
  color = '#4285F4',
  speed = 5,
  pathWidth = 3,
  animate = true,
  onComplete
}) => {
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const animationRef = useRef<number | null>(null);
  const completedPathRef = useRef<google.maps.Polyline | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [animationStarted, setAnimationStarted] = useState<boolean>(false);
  
  // Create or update the polyline when coordinates change
  useEffect(() => {
    // Clear any existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }
    
    if (completedPathRef.current) {
      completedPathRef.current.setMap(null);
    }
    
    if (coordinates.length < 2) return;
    
    // Create a new polyline for the full path
    polylineRef.current = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 0.5,
      strokeWeight: pathWidth,
      map: map
    });
    
    // Create a polyline for the completed part of the path
    completedPathRef.current = new google.maps.Polyline({
      path: [],
      geodesic: true,
      strokeColor: color,
      strokeOpacity: 1.0,
      strokeWeight: pathWidth + 1,
      map: map
    });
    
    // Set the initial path to show the complete route with low opacity
    polylineRef.current.setPath(coordinates);
    
    // Reset progress
    setProgress(0);
    setAnimationStarted(false);
  }, [coordinates, color, pathWidth, map]);
  
  // Toggle animation based on the animate prop
  useEffect(() => {
    if (animate) {
      startAnimation();
    } else {
      stopAnimation();
    }
    
    return () => {
      stopAnimation();
    };
  }, [animate]);
  
  // Function to start the animation
  const startAnimation = () => {
    if (animationRef.current !== null || !polylineRef.current || coordinates.length < 2) {
      return;
    }
    
    setAnimationStarted(true);
    let startTime: number | null = null;
    const duration = 10000 / speed; // Adjust duration based on speed parameter
    
    // Animation function
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      
      // Calculate progress (0 to 1)
      const newProgress = Math.min(elapsed / duration, 1);
      setProgress(newProgress);
      
      // Update the completed path
      if (completedPathRef.current && polylineRef.current) {
        const fullPath = polylineRef.current.getPath();
        const numPoints = fullPath.getLength();
        const animatedPoints = [];
        
        // Calculate how many points to show based on progress
        const pointsToShow = Math.floor(numPoints * newProgress);
        
        for (let i = 0; i < pointsToShow; i++) {
          animatedPoints.push(fullPath.getAt(i));
        }
        
        // If not at the end, add a partial segment
        if (pointsToShow < numPoints && pointsToShow > 0) {
          const lastPoint = fullPath.getAt(pointsToShow - 1);
          const nextPoint = fullPath.getAt(pointsToShow);
          const partialProgress = (newProgress * numPoints) % 1;
          
          const interpolatedLat = lastPoint.lat() + (nextPoint.lat() - lastPoint.lat()) * partialProgress;
          const interpolatedLng = lastPoint.lng() + (nextPoint.lng() - lastPoint.lng()) * partialProgress;
          
          animatedPoints.push(new google.maps.LatLng(interpolatedLat, interpolatedLng));
        }
        
        completedPathRef.current.setPath(animatedPoints);
      }
      
      // Continue animation if not complete
      if (newProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (onComplete) {
          onComplete();
        }
        
        // After a delay, restart the animation for a continuous effect
        setTimeout(() => {
          setProgress(0);
          if (animate) {
            startTime = null;
            animationRef.current = requestAnimationFrame(animate);
          }
        }, 2000);
      }
    };
    
    // Start the animation
    animationRef.current = requestAnimationFrame(animate);
  };
  
  // Function to stop the animation
  const stopAnimation = () => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
      if (completedPathRef.current) {
        completedPathRef.current.setMap(null);
      }
    };
  }, []);
  
  // Start animation automatically if not started yet and animate is true
  useEffect(() => {
    if (animate && !animationStarted && coordinates.length >= 2) {
      startAnimation();
    }
  }, [animate, animationStarted, coordinates]);
  
  // This component doesn't render anything directly
  return null;
};

export default AnimatedTourPath;