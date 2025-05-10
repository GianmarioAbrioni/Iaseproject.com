import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet';

export default function Technology() {
  useEffect(() => {
    document.title = "Technology & Applications | IASE Project";
    
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <title>Technology &amp; Applications | IASE Project</title>
        <meta name="description" content="Explore the IASE Project technology stack, comparing current capabilities with the full vision for autonomous space entities." />
      </Helmet>
      
      <main className="container mx-auto px-4 py-8">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Technology &amp; Applications</h1>
          <p className="text-xl text-gray-300">IASE – Scientific Foundations and Use Cases</p>
        </section>
      
        <section className="max-w-4xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-primary mb-6">IASE Core Technologies</h2>
          <p className="text-lg text-gray-300 mb-4">
            The IASE model is built upon advanced technological concepts designed to enable true autonomous AI operation in deep space. These include:
          </p>
          <ul className="list-disc pl-6 space-y-3 text-lg text-gray-300">
            <li>
              <strong className="text-primary">Federated Learning:</strong> Each IASE unit trains independently and shares learning models without transmitting raw data.
            </li>
            <li>
              <strong className="text-primary">Quantum Communication:</strong> To ensure long-distance, secure data exchange between space entities and Earth.
            </li>
            <li>
              <strong className="text-primary">Redundant AI Structures:</strong> AI is distributed across multiple fallback layers, ensuring mission continuity in case of failure.
            </li>
            <li>
              <strong className="text-primary">Self-healing Mechanisms:</strong> Hardware and software components designed to self-repair or switch to backups if anomalies are detected.
            </li>
            <li>
              <strong className="text-primary">Autonomous Navigation &amp; Decision-Making:</strong> Each IASE unit can explore, analyze, and make decisions in real-time without human intervention.
            </li>
          </ul>
        </section>
        
        <section className="max-w-4xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-primary mb-6">IASE 1.0 vs Full Version</h2>
          <p className="text-lg text-gray-300 mb-6">
            A functional prototype of IASE (Version 1.0) could be built today using available technologies. While it would lack some advanced features like full quantum channels, it could already operate as an intelligent decentralized node.
          </p>
          
          <div className="flex justify-center my-8">
            <img 
              src="/images/iase_comparison_table.jpg" 
              alt="IASE 1.0 vs IASE Full" 
              className="rounded-lg shadow-xl max-w-full"
            />
          </div>
          
          <p className="text-lg text-gray-300">
            The comparison above outlines the differences between a feasible version today and the ideal vision of IASE in the near future.
          </p>
        </section>
        
        <section className="max-w-4xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-primary mb-6">Applications of IASE</h2>
          <p className="text-lg text-gray-300 mb-4">
            The IASE architecture enables a wide range of mission-critical and intelligent operations within autonomous space systems and distributed infrastructures.
          </p>
          
          <ul className="list-disc pl-6 space-y-3 text-lg text-gray-300">
            <li>
              <strong className="text-primary">Autonomous Space Exploration:</strong> Deployable AI agents capable of navigating, mapping, and making decisions in unknown environments.
            </li>
            <li>
              <strong className="text-primary">Quantum-Secured Communication:</strong> Integration with quantum key systems for high-security orbital communication between AI nodes.
            </li>
            <li>
              <strong className="text-primary">Multi-Agent Collaboration:</strong> IASE entities operate as coordinated fleets, dynamically exchanging data and reconfiguring their behavior.
            </li>
            <li>
              <strong className="text-primary">Web3-Enabled Infrastructure:</strong> Token-based interaction models for participatory governance and decentralized incentive structures.
            </li>
            <li>
              <strong className="text-primary">Self-Healing and Fault Tolerance:</strong> Distributed resilience and adaptive reconfiguration in case of failure or environmental hazards.
            </li>
            <li>
              <strong className="text-primary">Deep-Space Autonomy:</strong> Reduced reliance on Earth-based control for long-duration missions.
            </li>
            <li>
              <strong className="text-primary">Payload Management &amp; Decision Support:</strong> AI-assisted operation and optimization of onboard scientific instruments.
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}