import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Handle SSR case where window might not be available
    if (typeof window === 'undefined') return;
    
    const media = window.matchMedia(query);
    
    // Initial check
    setMatches(media.matches);
    
    // Set up event listener
    const listener = () => {
      setMatches(media.matches);
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
