import React from "react";
import { Helmet } from "react-helmet";
import ContactSection from "@/components/ContactSection";

const Contatti: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Contatti | IASE Project</title>
        <meta name="description" content="Contattaci per una consulenza gratuita o per discutere del tuo progetto. Siamo qui per aiutarti a trasformare la tua presenza digitale." />
      </Helmet>
      
      <div className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contattaci</h1>
          <p className="text-xl max-w-3xl">Hai domande o vuoi discutere del tuo progetto? Siamo qui per aiutarti.</p>
        </div>
      </div>
      
      <ContactSection extended={true} />
      
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-map-pin-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Sede Principale</h3>
              <p className="text-muted-foreground">Via Roma 123, 00100 Roma, Italia</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-phone-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Telefono</h3>
              <p className="text-muted-foreground">+39 06 1234567</p>
              <p className="text-muted-foreground">Lun - Ven: 9:00 - 18:00</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-mail-line text-2xl text-primary"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Email</h3>
              <p className="text-muted-foreground">info@iaseproject.com</p>
              <p className="text-muted-foreground">support@iaseproject.com</p>
            </div>
          </div>
        </div>
      </section>
      
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold mb-2">Domande Frequenti</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Ecco alcune risposte alle domande più comuni che riceviamo.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl font-bold mb-2">Quanto costa un sito web?</h3>
              <p className="text-muted-foreground">Il costo di un sito web varia in base alle esigenze specifiche, alla complessità del design e alle funzionalità richieste. Contattaci per un preventivo personalizzato.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Quanto tempo ci vuole per sviluppare un sito web?</h3>
              <p className="text-muted-foreground">I tempi di sviluppo variano in base alla complessità del progetto. Un sito vetrina può richiedere 2-4 settimane, mentre progetti più complessi possono richiedere 2-3 mesi.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Offrite servizi di manutenzione?</h3>
              <p className="text-muted-foreground">Sì, offriamo pacchetti di manutenzione per tenere il tuo sito aggiornato, sicuro e funzionante al meglio. Contattaci per maggiori informazioni.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Lavorate con clienti internazionali?</h3>
              <p className="text-muted-foreground">Assolutamente sì. Abbiamo clienti in tutta Italia e all'estero. La distanza non è un problema grazie agli strumenti di comunicazione digitale che utilizziamo.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Come funziona il processo di lavoro?</h3>
              <p className="text-muted-foreground">Il nostro processo inizia con una consultazione, seguita da una proposta dettagliata. Dopo l'approvazione, procediamo con la progettazione, lo sviluppo, il test e infine il lancio del progetto.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-2">Offrite supporto post-lancio?</h3>
              <p className="text-muted-foreground">Sì, offriamo supporto tecnico continuo dopo il lancio del progetto. Siamo sempre disponibili per aiutarti con qualsiasi problema o domanda.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Contatti;
