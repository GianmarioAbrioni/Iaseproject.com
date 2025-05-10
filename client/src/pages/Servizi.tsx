import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import CTASection from "@/components/CTASection";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageContext } from "@/App";

// Servizi IASE Project aggiornati al focus del progetto
const servicesDetails = [
  {
    id: 1,
    icon: "🧠",
    title: "AI Systems Integration",
    description: "Integrazione di sistemi di intelligenza artificiale avanzati per applicazioni decentralizzate e autonome.",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop",
    features: [
      "Algoritmi di machine learning personalizzati",
      "Sistemi di apprendimento autonomo",
      "Integrazione con blockchain per decisioni verificabili",
      "Processamento dati in tempo reale",
      "Sistemi predittivi avanzati",
      "Architetture AI resistenti e fault-tolerant"
    ]
  },
  {
    id: 2,
    icon: "⛓️",
    title: "Blockchain Development",
    description: "Sviluppo di soluzioni blockchain innovative per la gestione decentralizzata di dati e asset digitali.",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=800&auto=format&fit=crop",
    features: [
      "Smart contract personalizzati",
      "Sistemi DAO (Decentralized Autonomous Organization)",
      "Tokenizzazione di asset reali e digitali",
      "Protocolli di consenso ottimizzati",
      "Interoperabilità cross-chain",
      "Sicurezza e audit di contratti intelligenti"
    ]
  },
  {
    id: 3,
    icon: "🛰️",
    title: "Space Technology",
    description: "Soluzioni tecnologiche per l'esplorazione e lo sfruttamento sostenibile dello spazio attraverso sistemi autonomi.",
    image: "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?q=80&w=800&auto=format&fit=crop",
    features: [
      "Sistemi di controllo decentralizzati per satelliti",
      "Reti di comunicazione spaziale peer-to-peer",
      "Coordinamento di costellazioni di nanosatelliti",
      "Algoritmi per l'esplorazione autonoma",
      "Sistemi di monitoring ambientale spaziale",
      "Tecnologie per missioni di lunga durata"
    ]
  },
  {
    id: 4,
    icon: "🔐",
    title: "Cybersecurity Avanzata",
    description: "Protezione di sistemi decentralizzati e applicazioni spaziali con tecnologie di sicurezza all'avanguardia.",
    image: "https://images.unsplash.com/photo-1510511459019-5dda7724fd87?q=80&w=800&auto=format&fit=crop",
    features: [
      "Crittografia quantistica",
      "Sicurezza multicampo per reti blockchain",
      "Protezione da attacchi distribuiti",
      "Monitoraggio basato su AI delle minacce",
      "Protocolli di comunicazione sicuri per lo spazio",
      "Sistemi di autenticazione decentralizzati"
    ]
  },
  {
    id: 5,
    icon: "📊",
    title: "Data Science Spaziale",
    description: "Analisi avanzata di dati spaziali per estrarre informazioni preziose e supportare decisioni autonome.",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop",
    features: [
      "Elaborazione di immagini satellitari con deep learning",
      "Analisi predittiva di fenomeni spaziali",
      "Gestione big data decentralizzata",
      "Algoritmi di ottimizzazione per missioni spaziali",
      "Modelli di simulazione avanzati",
      "Integrazione di dati multiparametrici"
    ]
  },
  {
    id: 6,
    icon: "⚙️",
    title: "IoT Spaziale",
    description: "Creazione di reti di dispositivi intelligenti interconnessi per applicazioni spaziali e terrestri.",
    image: "https://images.unsplash.com/photo-1518812319415-30a8af248edb?q=80&w=800&auto=format&fit=crop",
    features: [
      "Sensori autonomi per ambienti spaziali",
      "Sistemi edge computing decentralizzati",
      "Reti mesh autoadattative",
      "Dispositivi low-power per missioni prolungate",
      "Integrazione blockchain-IoT per tracciabilità",
      "Sistemi di comunicazione efficiente tra device"
    ]
  }
];

// Sezioni di processo
const processoFasi = [
  {
    numero: "01",
    titolo: "Analisi e Progettazione",
    descrizione: "Definiamo insieme gli obiettivi e progettiamo la soluzione tecnologica più adatta alle esigenze specifiche del progetto."
  },
  {
    numero: "02",
    titolo: "Sviluppo Prototipale",
    descrizione: "Creiamo un prototipo funzionante per validare le idee e perfezionare l'approccio prima dell'implementazione completa."
  },
  {
    numero: "03",
    titolo: "Implementazione",
    descrizione: "Sviluppiamo la soluzione completa integrando AI, blockchain e tecnologie spaziali secondo le specifiche concordate."
  },
  {
    numero: "04",
    titolo: "Testing e Ottimizzazione",
    descrizione: "Testiamo rigorosamente tutti gli aspetti della soluzione e ottimizziamo performance, sicurezza e usabilità."
  },
  {
    numero: "05",
    titolo: "Deployment e Monitoring",
    descrizione: "Rilasciamo la soluzione e implementiamo sistemi di monitoraggio continuo per garantirne l'efficacia nel tempo."
  }
];

// Esempi di casi studio (placeholder - andrebbero personalizzati)
const caseStudies = [
  {
    title: "Satellite Swarm Management",
    description: "Sistema decentralizzato per la gestione autonoma di una costellazione di nanosatelliti con capacità decisionale collettiva.",
    technologies: ["AI", "Blockchain", "IoT Spaziale"],
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Space Data Marketplace",
    description: "Piattaforma blockchain per lo scambio sicuro e verificabile di dati raccolti da sensori e dispositivi spaziali.",
    technologies: ["Blockchain", "Data Science", "Cybersecurity"],
    image: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=800&auto=format&fit=crop"
  },
  {
    title: "Autonomous Decision System",
    description: "Sistema AI per decisioni autonome di missioni spaziali con verifica su blockchain e tolleranza ai guasti.",
    technologies: ["AI", "Blockchain", "Space Tech"],
    image: "https://images.unsplash.com/photo-1581822261290-991b38693d1b?q=80&w=800&auto=format&fit=crop"
  }
];

const Servizi: React.FC = () => {
  const { setCurrentSection } = usePageContext();

  useEffect(() => {
    document.title = "Servizi | IASE Project";
    setCurrentSection("services");
    
    return () => {
      setCurrentSection("");
    };
  }, [setCurrentSection]);

  // Varianti per le animazioni
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Servizi | IASE Project</title>
        <meta name="description" content="Soluzioni innovative all'intersezione tra intelligenza artificiale, blockchain e tecnologia spaziale. Scopri come IASE Project può trasformare il tuo business." />
      </Helmet>
      
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/30 to-background z-0 pointer-events-none"></div>
          
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-60 h-60 bg-primary/50 rounded-full filter blur-3xl"></div>
            <div className="absolute top-40 -right-20 w-80 h-80 bg-blue-500/30 rounded-full filter blur-3xl"></div>
          </div>
          
          <div className="container mx-auto px-4 pt-36 pb-20 md:pt-40 md:pb-24 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">I Nostri Servizi</h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                Soluzioni innovative all'intersezione tra intelligenza artificiale, 
                blockchain e tecnologia spaziale.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="#services"
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-lg"
                >
                  Esplora i Servizi
                </a>
                <a
                  href="#process"
                  className="px-8 py-3 bg-card hover:bg-card/80 text-white font-medium rounded-lg transition-all border border-primary/20"
                >
                  Il Nostro Processo
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Services Overview Section */}
        <section id="services" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Le Nostre Competenze Chiave</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Offriamo un'ampia gamma di servizi specializzati che combinano intelligenza artificiale,
                blockchain e tecnologie spaziali per creare soluzioni all'avanguardia.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {servicesDetails.slice(0, 3).map((service, index) => (
                <motion.div
                  key={service.id}
                  variants={scaleIn}
                  className="bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{service.title}</h3>
                    <p className="text-gray-400 mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <a 
                      href={`#service-${service.id}`}
                      className="mt-4 inline-flex items-center text-primary hover:text-primary/80"
                    >
                      Scopri di più
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
            >
              {servicesDetails.slice(3).map((service, index) => (
                <motion.div
                  key={service.id}
                  variants={scaleIn}
                  className="bg-card/40 backdrop-blur-sm rounded-xl overflow-hidden transition-all hover:shadow-xl hover:transform hover:-translate-y-1"
                >
                  <div className="h-48 overflow-hidden relative">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent"></div>
                  </div>
                  <div className="p-6">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                      {service.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{service.title}</h3>
                    <p className="text-gray-400 mb-4">{service.description}</p>
                    <ul className="space-y-2">
                      {service.features.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-green-400 mr-2">✓</span>
                          <span className="text-gray-300 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <a 
                      href={`#service-${service.id}`}
                      className="mt-4 inline-flex items-center text-primary hover:text-primary/80"
                    >
                      Scopri di più
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Process Section */}
        <section id="process" className="py-20 bg-gradient-to-b from-background to-card/10">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Il Nostro Processo</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Un approccio metodico e strutturato per trasformare le idee in soluzioni concrete e innovative.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="max-w-4xl mx-auto"
            >
              {processoFasi.map((fase, index) => (
                <motion.div 
                  key={index}
                  variants={fadeInUp}
                  className="flex mb-8 md:mb-12 relative"
                >
                  {/* Timeline line */}
                  {index < processoFasi.length - 1 && (
                    <div className="absolute left-6 top-16 bottom-0 w-[2px] bg-primary/30"></div>
                  )}
                  
                  {/* Number box */}
                  <div className="h-12 w-12 rounded-full bg-primary text-white flex-shrink-0 flex items-center justify-center text-lg font-bold z-10">
                    {fase.numero}
                  </div>
                  
                  {/* Content */}
                  <div className="ml-6">
                    <h3 className="text-xl font-bold mb-2 text-white">{fase.titolo}</h3>
                    <p className="text-gray-300">{fase.descrizione}</p>
                    
                    {/* Separation */}
                    {index < processoFasi.length - 1 && (
                      <div className="h-10"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Case Studies Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Case Studies</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Esempi di progetti che dimostrano la nostra capacità di integrare tecnologie all'avanguardia
                per risolvere sfide complesse.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {caseStudies.map((caseStudy, index) => (
                <motion.div
                  key={index}
                  variants={scaleIn}
                  className="bg-card/40 rounded-xl overflow-hidden h-full flex flex-col"
                >
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={caseStudy.image} 
                      alt={caseStudy.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-6 flex-grow flex flex-col">
                    <h3 className="text-xl font-bold mb-2 text-white">{caseStudy.title}</h3>
                    <p className="text-gray-400 mb-4 flex-grow">{caseStudy.description}</p>
                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-gray-700">
                      {caseStudy.technologies.map((tech, idx) => (
                        <span key={idx} className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Services Details Section */}
        {servicesDetails.map((service) => (
          <section key={service.id} id={`service-${service.id}`} className="py-16 border-t border-gray-800">
            <div className="container mx-auto px-4">
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="flex flex-col md:flex-row gap-12 items-center"
              >
                <div className="w-full md:w-1/2">
                  <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl p-1">
                    <div className="aspect-video rounded-xl overflow-hidden">
                      <img 
                        src={service.image} 
                        alt={service.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                    {service.icon}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary">{service.title}</h2>
                  <p className="text-gray-300 mb-6">{service.description}</p>
                  
                  <h3 className="text-xl font-semibold mb-4 text-white">Funzionalità chiave</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {service.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start">
                        <span className="text-green-400 mr-2">✓</span>
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        ))}
        
        {/* Call to Action Section */}
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default Servizi;
