import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

interface Service {
  id: number;
  icon: string;
  title: string;
  description: string;
}

const services: Service[] = [
  {
    id: 1,
    icon: "ri-computer-line",
    title: "Web Design",
    description: "Creiamo siti web moderni e responsivi che riflettono l'identità del tuo brand e migliorano l'esperienza utente."
  },
  {
    id: 2,
    icon: "ri-line-chart-line",
    title: "Digital Marketing",
    description: "Strategie di marketing digitale personalizzate per aumentare la visibilità del tuo brand e generare lead qualificati."
  },
  {
    id: 3,
    icon: "ri-smartphone-line",
    title: "App Development",
    description: "Sviluppiamo applicazioni mobile innovative che offrono un'esperienza utente eccezionale e soluzioni efficaci."
  },
  {
    id: 4,
    icon: "ri-store-2-line",
    title: "E-commerce",
    description: "Soluzioni e-commerce complete per vendere online in modo efficace e gestire il tuo negozio digitale."
  },
  {
    id: 5,
    icon: "ri-bar-chart-line",
    title: "SEO",
    description: "Ottimizziamo il tuo sito web per i motori di ricerca per aumentare la visibilità e generare traffico organico."
  },
  {
    id: 6,
    icon: "ri-creative-commons-line",
    title: "Branding",
    description: "Creiamo identità di marca distintive che comunicano i valori e la visione della tua azienda."
  }
];

interface ServicesSectionProps {
  extended?: boolean;
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ extended = false }) => {
  const displayServices = extended ? services : services.slice(0, 3);
  
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading text-foreground mb-2">
            I Nostri Servizi
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Offriamo un'ampia gamma di servizi per soddisfare le tue esigenze aziendali.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayServices.map((service) => (
            <Card 
              key={service.id} 
              className="bg-muted hover:shadow-lg transition-standard card-hover"
            >
              <CardContent className="p-6">
                <div className="text-primary mb-4">
                  <i className={`${service.icon} text-4xl`}></i>
                </div>
                <h3 className="text-xl font-bold font-heading mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <Link 
                  href={`/servizi#${service.title.toLowerCase().replace(/\s+/g, '-')}`} 
                  className="text-primary font-medium inline-flex items-center"
                >
                  Scopri di più <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {!extended && (
          <div className="text-center mt-10">
            <Link 
              href="/servizi" 
              className="inline-block bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-3 px-6 rounded-md transition-standard"
            >
              Visualizza Tutti i Servizi
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ServicesSection;
