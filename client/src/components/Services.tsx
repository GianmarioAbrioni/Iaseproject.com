import { motion } from "framer-motion";

const services = [
  {
    image: "https://images.unsplash.com/photo-1633265486501-0cf524a07213?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    title: "Sviluppo Smart Contract",
    description: "Sviluppiamo smart contract personalizzati per le tue esigenze specifiche, utilizzando le migliori pratiche di sicurezza e ottimizzazione."
  },
  {
    image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    title: "Audit di Sicurezza",
    description: "Effettuiamo audit completi dei tuoi smart contract esistenti per identificare e risolvere potenziali vulnerabilità di sicurezza."
  },
  {
    image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=300",
    title: "Integrazione Blockchain",
    description: "Integriamo soluzioni blockchain nelle tue applicazioni esistenti per sfruttare i vantaggi della tecnologia decentralizzata."
  }
];

const Services = () => {
  return (
    <section className="py-16 bg-white dark:bg-secondary-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            I Nostri Servizi
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Offriamo una gamma completa di servizi per soddisfare le tue esigenze di smart contract
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div 
              key={index}
              className="bg-gray-50 dark:bg-secondary-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="h-48 bg-primary-500 relative overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary-800 bg-opacity-50"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-bold text-white">{service.title}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {service.description}
                </p>
                <a href="#" className="text-primary dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center font-medium">
                  Scopri di più
                  <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
