import React, { useEffect } from "react";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import CTASection from "@/components/CTASection";
import { usePageContext } from "@/App";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Definire i membri del team
const teamMembers = [
  {
    name: "Marco Rossi",
    role: "CEO & Fondatore",
    bio: "Con oltre 15 anni di esperienza nel settore blockchain e intelligenza artificiale, Marco guida la visione strategica dell'IASE Project.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&h=200&auto=format&fit=crop"
  },
  {
    name: "Elena Bianchi",
    role: "CTO",
    bio: "Esperta di tecnologie decentralizzate e AI, Elena supervisiona lo sviluppo delle nostre soluzioni tecnologiche all'avanguardia.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&auto=format&fit=crop"
  },
  {
    name: "Alessandro Verdi",
    role: "Responsabile Ricerca",
    bio: "Specializzato nella ricerca applicata all'integrazione tra IA e spazio, Alessandro guida il nostro team di ricerca e innovazione.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&auto=format&fit=crop"
  },
  {
    name: "Sofia Marino",
    role: "Partnerships & Sviluppo Business",
    bio: "Con una vasta rete di contatti nel settore della tecnologia e dello spazio, Sofia coordina le nostre partnership strategiche.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&h=200&auto=format&fit=crop"
  }
];

// Definire i valori aziendali
const valoriAziendali = [
  {
    icon: "🚀",
    title: "Innovazione",
    description: "Ricerchiamo costantemente nuove soluzioni all'intersezione tra intelligenza artificiale, blockchain e tecnologia spaziale."
  },
  {
    icon: "🔍",
    title: "Eccellenza",
    description: "Ogni aspetto del nostro lavoro è improntato al raggiungimento dei più alti standard qualitativi e tecnologici."
  },
  {
    icon: "🤝",
    title: "Collaborazione",
    description: "Crediamo nel potere della collaborazione e delle partnership per creare un ecosistema tecnologico robusto e innovativo."
  },
  {
    icon: "🌐",
    title: "Decentralizzazione",
    description: "Promuoviamo la decentralizzazione come principio fondamentale per l'autonomia e la resilienza dei sistemi tecnologici."
  },
  {
    icon: "🔒",
    title: "Sicurezza",
    description: "La sicurezza è integrata in ogni livello della nostra architettura tecnologica e nei nostri processi organizzativi."
  },
  {
    icon: "🛰️",
    title: "Visione Spaziale",
    description: "La nostra visione è proiettata verso l'esplorazione spaziale e l'applicazione delle tecnologie decentralizzate nello spazio."
  }
];

const ChiSiamo: React.FC = () => {
  const { setCurrentSection } = usePageContext();

  useEffect(() => {
    document.title = "Chi Siamo | IASE Project";
    setCurrentSection("about");
    
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
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Chi Siamo | IASE Project</title>
        <meta name="description" content="Scopri il team e la missione dietro IASE Project: all'intersezione tra intelligenza artificiale, blockchain e tecnologia spaziale per un futuro decentralizzato." />
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
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">Chi Siamo</h1>
              <p className="text-xl md:text-2xl text-gray-200 mb-8">
                Un team di innovatori all'intersezione tra intelligenza artificiale, 
                blockchain e tecnologia spaziale.
              </p>
              <div className="flex justify-center">
                <a 
                  href="#missione"
                  className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all shadow-lg mr-4"
                >
                  La Nostra Missione
                </a>
                <a
                  href="#team"
                  className="px-8 py-3 bg-card hover:bg-card/80 text-white font-medium rounded-lg transition-all border border-primary/20"
                >
                  Conosci il Team
                </a>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Missione Section */}
        <section id="missione" className="py-20 relative overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="flex flex-col md:flex-row items-center gap-12"
            >
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-primary">La Nostra Missione</h2>
                <p className="text-lg text-gray-300 mb-4">
                  IASE Project nasce per rivoluzionare il modo in cui l'intelligenza artificiale e la blockchain 
                  si integrano con le tecnologie spaziali. Il nostro obiettivo è creare un ecosistema decentralizzato 
                  di entità autonome che possano operare indipendentemente nello spazio.
                </p>
                <p className="text-lg text-gray-300 mb-6">
                  Crediamo fermamente che il futuro dell'esplorazione spaziale passi attraverso sistemi autonomi, 
                  resilienti e distribuiti, capaci di prendere decisioni complesse senza la necessità di un controllo 
                  centralizzato dalla Terra.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-card/50 p-4 rounded-lg flex flex-col items-center text-center">
                    <span className="text-3xl mb-2">2023</span>
                    <span className="text-sm text-gray-400">Anno di fondazione</span>
                  </div>
                  <div className="bg-card/50 p-4 rounded-lg flex flex-col items-center text-center">
                    <span className="text-3xl mb-2">10+</span>
                    <span className="text-sm text-gray-400">Progetti avviati</span>
                  </div>
                  <div className="bg-card/50 p-4 rounded-lg flex flex-col items-center text-center">
                    <span className="text-3xl mb-2">3</span>
                    <span className="text-sm text-gray-400">Brevetti tecnologici</span>
                  </div>
                  <div className="bg-card/50 p-4 rounded-lg flex flex-col items-center text-center">
                    <span className="text-3xl mb-2">5+</span>
                    <span className="text-sm text-gray-400">Partner strategici</span>
                  </div>
                </div>
              </div>
              <div className="w-full md:w-1/2 relative">
                <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl p-1">
                  <div className="aspect-video rounded-xl overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop"
                      alt="Esplorazione spaziale e tecnologia" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/30 rounded-full filter blur-2xl"></div>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Valori Section */}
        <section className="py-20 bg-gradient-to-b from-background to-card/10">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">I Nostri Valori</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Principi che guidano ogni nostra azione e decisione nel percorso verso 
                la creazione di un futuro tecnologico decentralizzato.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {valoriAziendali.map((valore, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-card/40 backdrop-blur-sm rounded-xl p-6 transition-all hover:transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center text-2xl mb-4">
                    {valore.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-100">{valore.title}</h3>
                  <p className="text-gray-300">{valore.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Team Section */}
        <section id="team" className="py-20">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Il Nostro Team</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Un gruppo di esperti appassionati che uniscono competenze diverse per 
                realizzare la visione dell'IASE Project.
              </p>
            </motion.div>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            >
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="bg-card/40 rounded-xl overflow-hidden transition-all hover:transform hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="h-60 overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-xl font-bold text-white">{member.name}</h3>
                    <p className="text-primary mb-3">{member.role}</p>
                    <p className="text-gray-400 text-sm">{member.bio}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
        
        {/* Timeline Section */}
        <section className="py-20 bg-gradient-to-b from-card/10 to-background">
          <div className="container mx-auto px-4">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Il Nostro Percorso</h2>
              <p className="text-lg text-gray-300 max-w-3xl mx-auto">
                Dall'idea iniziale ai risultati di oggi: un viaggio di innovazione continua.
              </p>
            </motion.div>
            
            <div className="max-w-4xl mx-auto relative">
              {/* Timeline line */}
              <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-1 bg-primary/30 md:transform md:-translate-x-1/2"></div>
              
              {/* Timeline items */}
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerChildren}
                className="space-y-12"
              >
                {/* Item 1 */}
                <motion.div variants={fadeInUp} className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                    <div className="bg-card/40 p-6 rounded-lg md:ml-auto">
                      <h3 className="text-xl font-bold mb-2">Concettualizzazione</h3>
                      <p className="text-gray-400 mb-2">Q1 2023</p>
                      <p className="text-gray-300">Sviluppo iniziale dell'idea di un sistema autonomo decentralizzato per applicazioni spaziali.</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center absolute left-0 md:left-1/2 transform md:-translate-x-1/2 z-10">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div className="md:w-1/2 md:pl-12"></div>
                </motion.div>
                
                {/* Item 2 */}
                <motion.div variants={fadeInUp} className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0 order-1 md:order-1"></div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center absolute left-0 md:left-1/2 transform md:-translate-x-1/2 z-10">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div className="md:w-1/2 md:pl-12 order-2 md:order-2">
                    <div className="bg-card/40 p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">Creazione del Token</h3>
                      <p className="text-gray-400 mb-2">Q2 2023</p>
                      <p className="text-gray-300">Lancio del token IASE su Binance Smart Chain e definizione della tokenomics del progetto.</p>
                    </div>
                  </div>
                </motion.div>
                
                {/* Item 3 */}
                <motion.div variants={fadeInUp} className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0">
                    <div className="bg-card/40 p-6 rounded-lg md:ml-auto">
                      <h3 className="text-xl font-bold mb-2">Primi Prototipi</h3>
                      <p className="text-gray-400 mb-2">Q3-Q4 2023</p>
                      <p className="text-gray-300">Sviluppo dei primi prototipi funzionanti e lancio della collezione NFT ufficiale del progetto.</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center absolute left-0 md:left-1/2 transform md:-translate-x-1/2 z-10">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div className="md:w-1/2 md:pl-12"></div>
                </motion.div>
                
                {/* Item 4 */}
                <motion.div variants={fadeInUp} className="relative flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 md:pr-12 md:text-right mb-4 md:mb-0 order-1 md:order-1"></div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center absolute left-0 md:left-1/2 transform md:-translate-x-1/2 z-10">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div className="md:w-1/2 md:pl-12 order-2 md:order-2">
                    <div className="bg-card/40 p-6 rounded-lg">
                      <h3 className="text-xl font-bold mb-2">Fase Attuale</h3>
                      <p className="text-gray-400 mb-2">Q1-Q2 2024</p>
                      <p className="text-gray-300">Sviluppo della piattaforma di staking e preparazione per il lancio della governance DAO.</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Call to Action Section */}
        <CTASection />
      </main>
      
      <Footer />
    </div>
  );
};

export default ChiSiamo;
