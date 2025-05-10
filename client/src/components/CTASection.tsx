import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const CTASection: React.FC = () => {
  return (
    <section className="py-16 bg-primary text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold font-heading mb-4">
          Pronti a trasformare la tua presenza digitale?
        </h2>
        <p className="text-xl max-w-2xl mx-auto mb-8">
          Contattaci oggi stesso per una consulenza gratuita e scopri come possiamo aiutarti a raggiungere i tuoi obiettivi.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button 
            asChild
            size="lg" 
            className="bg-white text-primary hover:bg-opacity-90"
          >
            <Link href="/contatti">
              Contattaci Ora
            </Link>
          </Button>
          <Button 
            asChild
            size="lg" 
            variant="outline"
            className="bg-transparent border border-white hover:bg-white hover:bg-opacity-20 text-white"
          >
            <Link href="/servizi">
              Scopri i Nostri Servizi
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
