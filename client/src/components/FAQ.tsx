import { useState } from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Cos'è uno smart contract?",
    answer: "Uno smart contract è un programma informatico che esegue automaticamente le azioni necessarie per adempiere a un accordo tra più parti su internet. Questi contratti vengono eseguiti sulla blockchain, garantendo trasparenza, sicurezza e immutabilità."
  },
  {
    question: "Quali sono i vantaggi degli smart contract?",
    answer: "Gli smart contract offrono numerosi vantaggi, tra cui: automazione dei processi, eliminazione degli intermediari, riduzione dei costi, maggiore sicurezza, trasparenza nelle transazioni e immutabilità dei dati registrati."
  },
  {
    question: "Su quali blockchain possiamo implementare gli smart contract?",
    answer: "Offriamo implementazioni di smart contract su diverse blockchain, tra cui Ethereum, Binance Smart Chain, Solana, Polkadot e altre. La scelta della blockchain dipende dalle specifiche esigenze del progetto, come costi di transazione, velocità di esecuzione e requisiti di sicurezza."
  },
  {
    question: "Quanto tempo richiede lo sviluppo di uno smart contract?",
    answer: "I tempi di sviluppo variano in base alla complessità del contratto. Un contratto semplice può richiedere da 1 a 2 settimane, mentre progetti più complessi possono richiedere diversi mesi. Durante la fase di consultazione, ti forniremo una stima accurata basata sulle tue specifiche esigenze."
  },
  {
    question: "Come garantite la sicurezza degli smart contract?",
    answer: "La sicurezza è la nostra priorità assoluta. Seguiamo le migliori pratiche di sviluppo, conduciamo rigorosi test di sicurezza, e sottoponiamo tutti i nostri contratti a audit da parte di specialisti indipendenti. Inoltre, utilizziamo strumenti avanzati per l'analisi statica del codice e la verifica formale quando necessario."
  }
];

const FAQ = () => {
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
            Domande Frequenti
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Trova risposte alle domande più comuni sui nostri servizi di smart contract
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto divide-y divide-gray-200 dark:divide-gray-700">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <AccordionItem value={`item-${index}`} className="py-2 border-none">
                  <AccordionTrigger className="text-lg text-gray-900 dark:text-white font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-600 dark:text-gray-400">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
