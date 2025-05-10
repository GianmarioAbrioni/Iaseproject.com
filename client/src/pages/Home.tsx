import React from "react";
import Hero from "@/components/Hero";
import ServicesSection from "@/components/ServicesSection";
import AboutSection from "@/components/AboutSection";
import ProjectsSection from "@/components/ProjectsSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import ContactSection from "@/components/ContactSection";
import { Helmet } from "react-helmet";

const Home: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>IASE Project - Home | Soluzioni Digitali Innovative</title>
        <meta name="description" content="IASE Project offre servizi di web design, marketing digitale e sviluppo app per trasformare la presenza digitale della tua azienda." />
      </Helmet>
      
      <Hero />
      <ServicesSection />
      <AboutSection />
      <ProjectsSection />
      <TestimonialsSection />
      <CTASection />
      <ContactSection />
    </>
  );
};

export default Home;
