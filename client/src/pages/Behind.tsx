import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

export default function Behind() {
  useEffect(() => {
    document.title = "Behind IASE | IASE Project";
    
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Behind IASE | IASE Project</title>
        <meta name="description" content="Learn about the origin, vision, and founders behind the IASE Project." />
      </Helmet>
      
      <main className="container mx-auto px-4 py-8">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Behind IASE</h1>
          <p className="text-xl text-gray-300">The Origin, The Vision, The Founder</p>
        </section>
      
        <section className="max-w-4xl mx-auto py-8">
          <p className="text-lg text-gray-300">
            <strong>IASE</strong> (Intelligent Autonomous Space Entities) was conceived as a unique fusion of technological vision and scientific structure, created to rethink the way intelligent agents interact across space infrastructures.
          </p>
          
          <h2 className="text-2xl font-bold text-primary mt-10 mb-4">The Independent Origin</h2>
          <p className="text-lg text-gray-300">
            The project was started independently by <strong>Gianmario Abrioni</strong>, without any institutional, corporate or political affiliation. It originated from a personal passion for space systems, artificial intelligence and distributed logic, combined with a strong focus on open transparency and scientific method.
          </p>
          
          <h2 className="text-2xl font-bold text-primary mt-10 mb-4">Why It Matters</h2>
          <p className="text-lg text-gray-300">
            IASE stands apart as an idea born without commercial bias, offering a new kind of roadmap to autonomous systems in space. It has been developed to be open, verifiable, and accessible for public analysis, research or collaboration.
          </p>
          
          <h2 className="text-2xl font-bold text-primary mt-10 mb-4">Who Is Behind It</h2>
          <div className="max-w-xs mx-auto my-8 p-6 bg-card rounded-xl shadow-lg text-center">
            <img 
              src="/images/linkedin-badge.svg" 
              alt="Gianmario Abrioni" 
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow-lg"
            />
            <h3 className="text-xl font-semibold mt-2">Gianmario Abrioni</h3>
            <p className="text-gray-400">Founder at IASE Project</p>
            <p className="text-gray-400">IT Specialist | Web3, AI &amp; Space Technologies Explorer</p>
            <a 
              href="https://www.linkedin.com/in/gianmario-abrioni-456622239" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-primary hover:bg-primary/80 text-white font-semibold rounded-md transition-colors"
            >
              View LinkedIn Profile
            </a>
          </div>
          
          <h2 className="text-2xl font-bold text-primary mt-10 mb-4">Transparency &amp; Integrity</h2>
          <p className="text-lg text-gray-300">
            Everything related to IASE – the research, documents, token, roadmap and articles – is public and accessible through the official website. This approach was designed to ensure full openness to partners, investors and validators such as BscScan or decentralized communities.
          </p>
        </section>
      </main>
    </>
  );
}