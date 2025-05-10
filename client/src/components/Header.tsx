import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMediaQuery } from "@/hooks/use-mobile";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Chi Siamo", href: "/chi-siamo" },
  { label: "Servizi", href: "/servizi" },
  { label: "Progetti", href: "/progetti" },
  { label: "Contatti", href: "/contatti" }
];

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [location] = useLocation();
  
  useEffect(() => {
    // Close mobile menu when route changes
    setMobileMenuOpen(false);
  }, [location]);
  
  useEffect(() => {
    // Handle body scroll when mobile menu is open
    if (isMobile) {
      if (mobileMenuOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen, isMobile]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-primary text-2xl font-bold font-heading">IASE PROJECT</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`font-medium transition-standard ${
                  location === item.href 
                    ? "text-primary" 
                    : "text-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          
          {/* Mobile Navigation Toggle */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              className="text-foreground focus:outline-none"
              aria-label={mobileMenuOpen ? "Chiudi menu" : "Apri menu"}
            >
              <i className={`text-2xl ${mobileMenuOpen ? "ri-close-line" : "ri-menu-line"}`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        <div className={`md:hidden ${mobileMenuOpen ? "block" : "hidden"} pb-4`}>
          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={`py-2 border-b border-border font-medium transition-standard ${
                  location === item.href 
                    ? "text-primary" 
                    : "text-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
