import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

interface AboutSectionProps {
  extended?: boolean;
}

const AboutSection: React.FC<AboutSectionProps> = ({ extended = false }) => {
  return (
    <section className="section-padding bg-muted">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
              alt="Il nostro team al lavoro" 
              className="rounded-lg shadow-lg w-full h-auto"
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold font-heading text-foreground mb-4">Chi Siamo</h2>
            <p className="text-muted-foreground mb-4">
              Siamo un'azienda dinamica e innovativa che lavora con passione per fornire soluzioni di alta qualità ai nostri clienti. 
              Con anni di esperienza nel settore, il nostro team di professionisti è dedicato a soddisfare le tue esigenze aziendali.
            </p>
            <p className="text-muted-foreground mb-6">
              La nostra missione è aiutare le aziende a crescere attraverso strategie digitali efficaci e soluzioni tecnologiche all'avanguardia.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start">
                <i className="ri-check-line text-primary text-xl mr-2"></i>
                <span>Team di professionisti esperti e qualificati</span>
              </li>
              <li className="flex items-start">
                <i className="ri-check-line text-primary text-xl mr-2"></i>
                <span>Approccio personalizzato per ogni cliente</span>
              </li>
              <li className="flex items-start">
                <i className="ri-check-line text-primary text-xl mr-2"></i>
                <span>Soluzioni innovative e all'avanguardia</span>
              </li>
              {extended && (
                <>
                  <li className="flex items-start">
                    <i className="ri-check-line text-primary text-xl mr-2"></i>
                    <span>Supporto continuo e assistenza post-progetto</span>
                  </li>
                  <li className="flex items-start">
                    <i className="ri-check-line text-primary text-xl mr-2"></i>
                    <span>Aggiornamento costante sulle ultime tecnologie</span>
                  </li>
                </>
              )}
            </ul>
            <Button 
              asChild 
              className="bg-primary hover:bg-opacity-90 text-white"
            >
              <Link href={extended ? "/servizi" : "/chi-siamo"}>
                {extended ? "Scopri i Nostri Servizi" : "Scopri di Più"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
