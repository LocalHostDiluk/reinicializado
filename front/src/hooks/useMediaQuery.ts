import { useState, useEffect } from "react";

export const useMediaQuery = (query: string): boolean => {
  // Inicializar con el valor actual (sin causar re-render)
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const media = window.matchMedia(query);

    // Listener para cambios
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Agregar listener
    media.addEventListener("change", listener);

    // Cleanup
    return () => media.removeEventListener("change", listener);
  }, [query]); // Solo depende de query

  return matches;
};

// Hook personalizado para móvil
export const useIsMobile = () => useMediaQuery("(max-width: 1023px)");
