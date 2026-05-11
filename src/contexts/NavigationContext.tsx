import { createContext, useContext, useState, type ReactNode } from "react";

export type Page =
  | "home"
  | "login"
  | "registro"
  | "reservas"
  | "tickets"
  | "admin"
  | "cambiar-contrasena";

interface NavigationContextType {
  currentPage: Page;
  navigate: (page: Page) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [history, setHistory] = useState<Page[]>([]);

  const navigate = (page: Page) => {
    setHistory([...history, currentPage]);
    setCurrentPage(page);
    // Scroll al inicio de la página
    window.scrollTo(0, 0);
  };

  const goBack = () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousPage = newHistory.pop()!;
      setHistory(newHistory);
      setCurrentPage(previousPage);
      window.scrollTo(0, 0);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentPage, navigate, goBack, canGoBack: history.length > 0 }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation debe usarse dentro de NavigationProvider");
  }
  return context;
}
