import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Publication() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 py-8">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Publications</h1>
          <p className="text-xl text-gray-300">Scientific Research and Official IASE Project Books</p>
        </section>
      
        <section className="max-w-4xl mx-auto py-8">
          <div className="grid gap-8">
            {/* Publication 1 */}
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <div className="flex items-start">
                <img 
                  src="/images/pdf-icon.png" 
                  alt="PDF Icon" 
                  className="w-10 h-10 mr-4 mt-1"
                />
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    Scientific Research on IASE
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Peer-reviewed research paper on the IASE framework, published on Zenodo.
                  </p>
                  <a 
                    href="https://zenodo.org/records/14993586" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline inline-flex items-center"
                  >
                    View on Zenodo
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Publication 2 */}
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <div className="flex items-start">
                <img 
                  src="/images/italian-cover.jpg" 
                  alt="Italian Cover" 
                  className="w-16 h-20 object-cover rounded mr-4"
                />
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    IASE – Versione Italiana
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Versione italiana del libro ufficiale IASE, disponibile su Amazon Kindle.
                  </p>
                  <a 
                    href="https://mybook.to/IASE-Italiano" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline inline-flex items-center"
                  >
                    Acquista su Amazon Kindle
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Publication 3 */}
            <div className="bg-card p-6 rounded-xl shadow-lg">
              <div className="flex items-start">
                <img 
                  src="/images/english-cover.jpg" 
                  alt="English Cover" 
                  className="w-16 h-20 object-cover rounded mr-4"
                />
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    IASE – English Edition
                  </h3>
                  <p className="text-gray-300 mb-4">
                    English version of the official IASE Project book, available on Amazon Kindle.
                  </p>
                  <a 
                    href="https://mybook.to/IASE-English" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline inline-flex items-center"
                  >
                    Buy on Amazon Kindle
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 ml-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}