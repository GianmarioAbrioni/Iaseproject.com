import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Il nome deve contenere almeno 2 caratteri" }),
  email: z.string().email({ message: "Inserisci un indirizzo email valido" }),
  subject: z.string().min(5, { message: "L'oggetto deve contenere almeno 5 caratteri" }),
  message: z.string().min(10, { message: "Il messaggio deve contenere almeno 10 caratteri" })
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactSectionProps {
  extended?: boolean;
}

const ContactSection: React.FC<ContactSectionProps> = ({ extended = false }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  });

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Messaggio inviato!",
      description: "Ti risponderemo il prima possibile."
    });
    
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <section id="contatti" className="section-padding bg-white">
      <div className="container-custom">
        {!extended && (
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-heading text-foreground mb-2">Contattaci</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Hai domande o vuoi discutere del tuo progetto? Siamo qui per aiutarti.</p>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-12">
          {/* Contact Form */}
          <div className={extended ? "md:w-3/5" : "md:w-2/3"}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Nome</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Il tuo nome" 
                            className="px-4 py-3 border border-input rounded-md focus:ring-2 focus:ring-primary" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="La tua email" 
                            className="px-4 py-3 border border-input rounded-md focus:ring-2 focus:ring-primary" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Oggetto</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Oggetto del messaggio" 
                          className="px-4 py-3 border border-input rounded-md focus:ring-2 focus:ring-primary" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground font-medium">Messaggio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Il tuo messaggio" 
                          rows={5} 
                          className="px-4 py-3 border border-input rounded-md focus:ring-2 focus:ring-primary" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-opacity-90 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Invio in corso..." : "Invia Messaggio"}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Contact Info */}
          <div className={extended ? "md:w-2/5" : "md:w-1/3"}>
            <div className="bg-muted rounded-lg p-6">
              <h3 className="text-xl font-bold font-heading mb-4">Informazioni di Contatto</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <i className="ri-map-pin-line text-primary text-xl mr-3 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Indirizzo</h4>
                    <p className="text-muted-foreground">Via Roma 123, 00100 Roma, Italia</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="ri-phone-line text-primary text-xl mr-3 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Telefono</h4>
                    <p className="text-muted-foreground">+39 06 1234567</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="ri-mail-line text-primary text-xl mr-3 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Email</h4>
                    <p className="text-muted-foreground">info@iaseproject.com</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <i className="ri-time-line text-primary text-xl mr-3 mt-1"></i>
                  <div>
                    <h4 className="font-medium">Orari di Lavoro</h4>
                    <p className="text-muted-foreground">Lun - Ven: 9:00 - 18:00</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-medium mb-3">Seguici</h4>
                <div className="flex space-x-4">
                  <a href="#" className="social-icon" aria-label="Facebook">
                    <i className="ri-facebook-fill"></i>
                  </a>
                  <a href="#" className="social-icon" aria-label="Twitter">
                    <i className="ri-twitter-fill"></i>
                  </a>
                  <a href="#" className="social-icon" aria-label="LinkedIn">
                    <i className="ri-linkedin-fill"></i>
                  </a>
                  <a href="#" className="social-icon" aria-label="Instagram">
                    <i className="ri-instagram-fill"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
