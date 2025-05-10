import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createContext, useState, useEffect, useContext } from "react";
import NotFound from "@/pages/not-found";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AIMascot from "./components/AIMascot";
import Home from "./pages/Home";
import ChiSiamo from "./pages/ChiSiamo";
import Servizi from "./pages/Servizi";
import Progetti from "./pages/Progetti";
import Contatti from "./pages/Contatti";
import Roadmap from "./pages/Roadmap";
import Articles from "./pages/Articles";
import Token from "./pages/Token";
import NFT from "./pages/NFT";
import Web3 from "./pages/Web3";
import Behind from "./pages/Behind";
import Technology from "./pages/Technology";
import ProjectOverview from "./pages/ProjectOverview";
import Contact from "./pages/Contact";

// Create a context to track current page and section
interface PageContextType {
  currentPage: string;
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

const PageContext = createContext<PageContextType>({
  currentPage: 'home',
  currentSection: '',
  setCurrentSection: () => {}
});

// Custom hook to use the page context
export const usePageContext = () => useContext(PageContext);

function Router() {
  return (
    <Switch>
      <Route path="/behind">
        <Behind />
      </Route>
      <Route path="/technology">
        <Technology />
      </Route>
      <Route path="/project-overview">
        <ProjectOverview />
      </Route>
      <Route path="/roadmap">
        <Roadmap />
      </Route>
      <Route path="/articles">
        <Articles />
      </Route>
      <Route path="/token">
        <Token />
      </Route>
      <Route path="/nft">
        <NFT />
      </Route>
      <Route path="/web3">
        <Web3 />
      </Route>
      <Route path="/contact">
        <Contact />
      </Route>
      <Route path="/chi-siamo">
        <ChiSiamo />
      </Route>
      <Route path="/servizi">
        <Servizi />
      </Route>
      <Route path="/progetti">
        <Progetti />
      </Route>
      <Route path="/contatti">
        <Contatti />
      </Route>
      <Route path="/">
        <Home />
      </Route>
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentSection, setCurrentSection] = useState<string>('');
  
  // Update current page based on location
  useEffect(() => {
    const path = location.startsWith('/') ? location.substring(1) : location;
    const pageName = path || 'home';
    setCurrentPage(pageName);
    // Reset section when page changes
    setCurrentSection('');
  }, [location]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PageContext.Provider value={{ currentPage, currentSection, setCurrentSection }}>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
              <Router />
            </main>
            <Footer />
            
            {/* AI Mascot with help bubbles */}
            <AIMascot 
              currentPage={currentPage} 
              currentSection={currentSection}
              position="bottom-right"
              autoShowDelay={2500}
            />
          </div>
        </PageContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
