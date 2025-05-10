import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-gradient-to-r from-[#0A1929] to-[#1A5F8C]">
        {/* Blockchain grid overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(#2E7DAF 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.1
        }}></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative z-10">
          <div className="flex flex-col md:flex-row items-center">
            <motion.div 
              className="md:w-1/2 md:pr-10 mb-10 md:mb-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl font-display font-bold text-white leading-tight mb-6">
                Piattaforma Smart Contract <span className="text-[#61DAFB]">Innovativa</span>
              </h1>
              <p className="text-lg text-gray-300 mb-8">
                Soluzioni blockchain all'avanguardia per le tue esigenze contrattuali. Sicuro, trasparente e completamente decentralizzato.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-primary hover:bg-primary/90 text-white font-medium px-6 py-5 rounded-md">
                  Inizia ora
                  <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Button>
                <Button variant="outline" className="border border-gray-300 text-gray-200 bg-transparent hover:bg-white hover:bg-opacity-10 px-6 py-5 rounded-md">
                  Scopri di più
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2 flex justify-center"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative w-full max-w-md motion-safe:animate-float">
                <img 
                  src="https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                  alt="Blockchain technology visualization" 
                  className="rounded-lg shadow-2xl w-full"
                />
                <div className="absolute -bottom-6 -right-6 bg-white dark:bg-secondary-800 p-4 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Smart Contract Verificato</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">100% Sicuro e Trasparente</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
