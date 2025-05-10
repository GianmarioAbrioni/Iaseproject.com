import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Hero: React.FC = () => {
  return (
    <section className="relative text-white">
      <div className="absolute inset-0 hero-gradient opacity-90"></div>
      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-4">
            Benvenuti sul Nostro Sito Web Rinnovato
          </h1>
          <p className="text-xl mb-8">
            Scopri i nostri servizi e le nostre soluzioni innovative per il tuo business.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              asChild
              size="lg" 
              className="bg-accent hover:bg-opacity-90 text-white"
            >
              <Link href="/servizi">
                Scopri di Più
              </Link>
            </Button>
            <Button 
              asChild
              size="lg" 
              variant="outline" 
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
            >
              <Link href="/contatti">
                Contattaci
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
