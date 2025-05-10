import React from 'react';
import { Link, useLocation } from 'wouter';

const ProjectMenu: React.FC = () => {
  const [location] = useLocation();
  
  const menuItems = [
    { label: 'Project Overview', href: '/project-overview' },
    { label: 'Behind IASE', href: '/behind' },
    { label: 'Technology', href: '/technology' },
    { label: 'Token', href: '/token' },
    { label: 'NFT Collection', href: '/nft' },
    { label: 'Web3 Integration', href: '/web3' },
    { label: 'Roadmap', href: '/roadmap' },
    { label: 'Articles', href: '/articles' }
  ];
  
  return (
    <div className="bg-card/50 backdrop-blur-sm p-4 rounded-lg shadow-md mb-8">
      <h3 className="text-primary font-medium mb-3">Project Documentation</h3>
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.href}>
            <Link 
              href={item.href}
              className={`block py-2 px-3 rounded-md transition-all ${
                location === item.href 
                  ? 'bg-primary/20 text-primary font-medium' 
                  : 'text-gray-300 hover:bg-card-hover hover:text-primary'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectMenu;