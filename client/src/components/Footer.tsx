import React from "react";
import { Link } from "wouter";

const Footer: React.FC = () => {
  return (
    <footer className="bg-background text-gray-300 py-6">
      <div className="container mx-auto px-4">
        <div className="text-center mb-4">
          <p className="text-sm">
            © 2025 IASE Project – All Rights Reserved
          </p>
        </div>
        
        <div className="flex justify-center space-x-4 mb-4">
          <a href="https://www.reddit.com/user/IAseProject" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            Reddit
          </a>
          <span className="text-primary">|</span>
          <a href="https://medium.com/@iaseproject" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            Medium
          </a>
          <span className="text-primary">|</span>
          <a href="https://twitter.com/IaseProject" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            X
          </a>
          <span className="text-primary">|</span>
          <a href="https://t.me/iaseproject" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
            Telegram
          </a>
        </div>
        
        <div className="flex justify-center space-x-6">
          <Link href="/privacy-policy" className="text-gray-300 hover:text-primary text-sm transition-colors">
            Privacy Policy
          </Link>
          <Link href="/cookie-policy" className="text-gray-300 hover:text-primary text-sm transition-colors">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
