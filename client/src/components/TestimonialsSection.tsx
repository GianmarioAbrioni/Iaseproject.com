import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Testimonial {
  id: number;
  text: string;
  author: {
    name: string;
    position: string;
    initials: string;
  };
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    text: "Lavorare con questo team è stata un'esperienza straordinaria. Hanno capito perfettamente le nostre esigenze e hanno creato un sito web che ha superato le nostre aspettative.",
    author: {
      name: "Marco Lombardi",
      position: "Direttore Marketing, Azienda Spa",
      initials: "ML"
    },
    rating: 5
  },
  {
    id: 2,
    text: "La campagna di marketing digitale che hanno sviluppato per noi ha prodotto risultati eccezionali. Abbiamo visto un aumento significativo delle visite al sito e delle vendite.",
    author: {
      name: "Anna Rossi",
      position: "CEO, Innovazione Srl",
      initials: "AR"
    },
    rating: 5
  },
  {
    id: 3,
    text: "L'app che hanno sviluppato per la nostra azienda è intuitiva e funzionale. I nostri clienti adorano usarla e abbiamo ricevuto molti feedback positivi.",
    author: {
      name: "Giuseppe Ferrari",
      position: "CTO, Tech Solutions",
      initials: "GF"
    },
    rating: 4.5
  }
];

const TestimonialsSection: React.FC = () => {
  // Helper function to render stars
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<i key={`full-${i}`} className="ri-star-fill"></i>);
    }
    
    if (hasHalfStar) {
      stars.push(<i key="half" className="ri-star-half-fill"></i>);
    }
    
    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<i key={`empty-${i}`} className="ri-star-line"></i>);
    }
    
    return stars;
  };

  return (
    <section className="section-padding bg-muted">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading text-foreground mb-2">
            Cosa Dicono i Clienti
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Le opinioni dei nostri clienti sono importanti per noi. Ecco alcune testimonianze di chi ha scelto i nostri servizi.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="bg-white rounded-lg shadow-md">
              <CardContent className="p-6">
                <div className="text-yellow-400 flex mb-4">
                  {renderStars(testimonial.rating)}
                </div>
                <p className="text-muted-foreground italic mb-6">"{testimonial.text}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-muted mr-4 flex items-center justify-center">
                    <div className="font-bold text-muted-foreground">{testimonial.author.initials}</div>
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.author.name}</h4>
                    <p className="text-muted-foreground text-sm">{testimonial.author.position}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
