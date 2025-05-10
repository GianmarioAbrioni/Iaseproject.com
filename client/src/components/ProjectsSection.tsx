import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";

interface Project {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
}

const projects: Project[] = [
  {
    id: 1,
    title: "Restyling Sito Web",
    description: "Modernizzazione completa del sito web aziendale per migliorare l'esperienza utente e aumentare le conversioni.",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    tags: ["Web Design", "UX/UI"]
  },
  {
    id: 2,
    title: "Campagna Marketing",
    description: "Strategia di marketing digitale integrata che ha aumentato il traffico del 150% e le conversioni del 75%.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    tags: ["SEO", "Social Media"]
  },
  {
    id: 3,
    title: "App E-commerce",
    description: "Sviluppo di un'applicazione mobile per e-commerce con interfaccia utente intuitiva e funzionalità avanzate.",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    tags: ["Mobile", "E-commerce"]
  }
];

interface ProjectsSectionProps {
  extended?: boolean;
}

const ProjectsSection: React.FC<ProjectsSectionProps> = ({ extended = false }) => {
  const displayProjects = extended ? projects.concat(projects) : projects;
  
  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-heading text-foreground mb-2">
            I Nostri Progetti
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Dai un'occhiata ad alcuni dei nostri lavori recenti che hanno aiutato i nostri clienti a raggiungere i loro obiettivi.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProjects.slice(0, extended ? 6 : 3).map((project) => (
            <Card 
              key={project.id} 
              className="bg-muted rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-standard card-hover"
            >
              <div className="w-full h-48 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold font-heading mb-2">{project.title}</h3>
                <p className="text-muted-foreground mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag, index) => (
                    <span key={index} className="service-tag">{tag}</span>
                  ))}
                </div>
                <Link 
                  href={`/progetti#${project.id}`} 
                  className="text-primary font-medium inline-flex items-center"
                >
                  Vedi Dettagli <i className="ri-arrow-right-line ml-1"></i>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {!extended && (
          <div className="text-center mt-10">
            <Link 
              href="/progetti" 
              className="inline-block bg-white border border-primary text-primary hover:bg-primary hover:text-white font-medium py-3 px-6 rounded-md transition-standard"
            >
              Visualizza Tutti i Progetti
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsSection;
