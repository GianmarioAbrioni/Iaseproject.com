import React from "react";
import { Helmet } from "react-helmet";
import ProjectsSection from "@/components/ProjectsSection";
import CTASection from "@/components/CTASection";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const projectCategories = [
  { id: "all", label: "Tutti" },
  { id: "web", label: "Web Design" },
  { id: "marketing", label: "Digital Marketing" },
  { id: "app", label: "App Development" },
  { id: "ecommerce", label: "E-commerce" }
];

const projects = [
  {
    id: 1,
    title: "Restyling Sito Web Aziendale",
    description: "Modernizzazione completa del sito web aziendale per migliorare l'esperienza utente e aumentare le conversioni.",
    image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    category: "web",
    tags: ["Web Design", "UX/UI"],
    client: "Azienda Tech Spa",
    year: "2023",
    results: "Aumento del 35% nel tempo di permanenza sul sito e incremento del 25% nelle conversioni."
  },
  {
    id: 2,
    title: "Campagna Marketing Integrata",
    description: "Strategia di marketing digitale integrata che ha aumentato il traffico del 150% e le conversioni del 75%.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    category: "marketing",
    tags: ["SEO", "Social Media"],
    client: "Innovazione Srl",
    year: "2022",
    results: "Incremento del 150% nel traffico organico e miglioramento del 75% nel tasso di conversione."
  },
  {
    id: 3,
    title: "App E-commerce Mobile",
    description: "Sviluppo di un'applicazione mobile per e-commerce con interfaccia utente intuitiva e funzionalità avanzate.",
    image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    category: "app",
    tags: ["Mobile", "E-commerce"],
    client: "Fashion Brand",
    year: "2023",
    results: "Oltre 10.000 download nel primo mese e aumento del 40% delle vendite mobili."
  },
  {
    id: 4,
    title: "Piattaforma E-learning",
    description: "Creazione di una piattaforma e-learning completa con gestione corsi, quiz interattivi e monitoraggio progressi.",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    category: "web",
    tags: ["Web App", "E-learning"],
    client: "Istituto Formazione",
    year: "2022",
    results: "Oltre 5.000 studenti registrati nel primo anno con un tasso di completamento dei corsi dell'85%."
  },
  {
    id: 5,
    title: "E-commerce B2B",
    description: "Sviluppo di una piattaforma e-commerce B2B con funzionalità avanzate di gestione ordini e listini personalizzati.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    category: "ecommerce",
    tags: ["E-commerce", "B2B"],
    client: "Distribuzione Spa",
    year: "2023",
    results: "Incremento del 60% negli ordini online e riduzione del 45% nei tempi di elaborazione ordini."
  },
  {
    id: 6,
    title: "App Fitness & Wellness",
    description: "Sviluppo di un'app mobile per il tracciamento fitness con programmi personalizzati e analisi dei progressi.",
    image: "https://images.unsplash.com/photo-1544216717-3bbf52512659?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500",
    category: "app",
    tags: ["Mobile", "Health"],
    client: "Wellness Center",
    year: "2022",
    results: "15.000 utenti attivi mensili e retention rate del 65% dopo 6 mesi."
  }
];

const Progetti: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("all");
  
  const filteredProjects = activeTab === "all" 
    ? projects 
    : projects.filter(project => project.category === activeTab);

  return (
    <>
      <Helmet>
        <title>Progetti | IASE Project</title>
        <meta name="description" content="Esplora i nostri progetti di successo in web design, digital marketing, sviluppo app e e-commerce che hanno aiutato i nostri clienti a raggiungere i loro obiettivi." />
      </Helmet>
      
      <div className="py-20 bg-primary text-white">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">I Nostri Progetti</h1>
          <p className="text-xl max-w-3xl">Dai un'occhiata ai nostri lavori e scopri come abbiamo aiutato i nostri clienti a raggiungere i loro obiettivi.</p>
        </div>
      </div>
      
      <ProjectsSection extended={true} />
      
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-2 text-center">Portfolio Completo</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto">Esplora tutti i nostri progetti divisi per categoria.</p>
          </div>
          
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="flex flex-wrap justify-center mb-8">
              {projectCategories.map(category => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  onClick={() => setActiveTab(category.id)}
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProjects.map(project => (
                  <Card key={project.id} className="overflow-hidden card-hover">
                    <div className="h-48 w-full overflow-hidden">
                      <img 
                        src={project.image} 
                        alt={project.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                      <p className="text-muted-foreground mb-4">{project.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.tags.map((tag, idx) => (
                          <span key={idx} className="service-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <p className="font-semibold">Cliente:</p>
                          <p>{project.client}</p>
                        </div>
                        <div>
                          <p className="font-semibold">Anno:</p>
                          <p>{project.year}</p>
                        </div>
                      </div>
                      <div className="text-sm mb-4">
                        <p className="font-semibold">Risultati:</p>
                        <p>{project.results}</p>
                      </div>
                      <a href="#" className="text-primary font-medium inline-flex items-center">
                        Vedi Dettagli <i className="ri-arrow-right-line ml-1"></i>
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      <CTASection />
    </>
  );
};

export default Progetti;
