
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Adding a small buffer to ensure consistent mobile detection
  const isMobile = useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  return isMobile;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(() => {
    // For SSR or initial render, check if window exists
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    // Default to false if we're in SSR
    return false;
  });

  React.useEffect(() => {
    // Handle SSR case where window might not be available
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Set up event listener
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };
    
    // Use the appropriate event listener method based on browser support
    if (media.addEventListener) {
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    } else {
      // For older browsers
      media.addListener(listener);
      return () => media.removeListener(listener);
    }
  }, [query]);

  return matches;
}

// Hook to detect orientation
export function useOrientation() {
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  return { isPortrait, isLandscape };
}
