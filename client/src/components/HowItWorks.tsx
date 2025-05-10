import { motion } from "framer-motion";

const steps = [
  {
    number: 1,
    title: "Definisci il Contratto",
    description: "Stabilisci le regole e le condizioni del tuo smart contract in modo chiaro e preciso."
  },
  {
    number: 2,
    title: "Sviluppo e Test",
    description: "I nostri esperti sviluppano e testano il tuo smart contract in un ambiente sicuro."
  },
  {
    number: 3,
    title: "Approvazione e Deployment",
    description: "Dopo la tua approvazione, implementiamo il contratto sulla blockchain."
  },
  {
    number: 4,
    title: "Monitoraggio e Gestione",
    description: "Monitora e gestisci il tuo smart contract tramite la nostra dashboard intuitiva."
  }
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gradient-to-b dark:from-secondary-900 dark:to-secondary-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            Come Funziona
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Scopri il processo semplice per implementare gli smart contract sulla nostra piattaforma
          </p>
        </motion.div>

        <div className="relative">
          {/* Timeline line */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-primary-200 dark:bg-primary-800"></div>

          {/* Steps */}
          <div className="space-y-12 md:space-y-0">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                className="relative md:grid md:grid-cols-2 md:gap-8 md:items-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className={`md:col-start-${index % 2 === 0 ? '1' : '2'} text-center md:text-${index % 2 === 0 ? 'right' : 'left'} mb-6 md:mb-0`}>
                  <div className="md:inline-flex items-center">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{step.number}. {step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                  </div>
                </div>
                <div className={`absolute left-1/2 transform -translate-x-1/2 md:relative md:left-0 md:transform-none md:col-start-${index % 2 === 0 ? '2' : '1'} ${index % 2 === 0 ? 'md:pl-8' : 'md:text-right'}`}>
                  <div className={`h-16 w-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold shadow-lg border-4 border-white dark:border-secondary-800 mx-auto ${index % 2 === 0 ? 'md:mx-0' : 'md:ml-auto'}`}>
                    {step.number}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
