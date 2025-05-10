export default function Contact() {
  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <header className="py-12 text-center bg-gray-800">
        <h1 className="text-4xl font-bold text-blue-400">Contact &amp; Resources</h1>
        <p className="mt-2 text-xl">Official channels and documents related to IASE</p>
      </header>
      
      <div className="container mx-auto px-4 py-12">
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">Contact</h2>
          <p className="text-lg mb-4">You can reach the IASE Project directly via the following emails:</p>
          <ul className="ml-6 space-y-2">
            <li className="text-lg">
              <strong>Main contact:</strong> <a href="mailto:contact@iaseproject.com" className="text-blue-400 hover:text-blue-300">contact@iaseproject.com</a>
            </li>
            <li className="text-lg">
              <strong>Technical support:</strong> <a href="mailto:admin@iaseproject.com" className="text-blue-400 hover:text-blue-300">admin@iaseproject.com</a>
            </li>
          </ul>
          
          <div className="max-w-xs mx-auto my-8 p-6 bg-gray-800 rounded-xl shadow-lg text-center">
            <img 
              src="/images/linkedin-badge.jpg" 
              alt="Gianmario Abrioni" 
              className="w-24 h-24 rounded-full object-cover mx-auto mb-4 shadow"
            />
            <h3 className="text-xl font-semibold mt-2">Gianmario Abrioni</h3>
            <p className="text-gray-400">Founder at IASE Project</p>
            <p className="text-gray-400">IT Specialist | Web3, AI &amp; Space Technologies Explorer</p>
            <a 
              href="https://www.linkedin.com/in/gianmario-abrioni-456622239" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
            >
              View LinkedIn Profile
            </a>
          </div>
        </section>
        
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">Social Media</h2>
          <ul className="ml-6 space-y-3">
            <li>
              <a 
                href="https://x.com/iase_project" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg"
              >
                IASE on X (Twitter)
              </a>
            </li>
            <li>
              <a 
                href="https://www.reddit.com/r/IASEproject" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg"
              >
                Project community on Reddit
              </a>
            </li>
            <li>
              <a 
                href="https://t.me/IASEtoken" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg"
              >
                Official Telegram Channel
              </a>
            </li>
            <li>
              <a 
                href="https://medium.com/@iaseproject" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg"
              >
                Medium Articles
              </a>
            </li>
            <li>
              <a 
                href="https://github.com/IASEProject" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg"
              >
                GitHub Repository
              </a>
            </li>
          </ul>
        </section>
        
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">Documents &amp; Resources</h2>
          <ul className="ml-6 space-y-4">
            <li>
              <a 
                href="/pdf/iase_token_whitepaper.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg font-semibold"
              >
                Whitepaper (EN)
              </a>
            </li>
            <li>
              <a 
                href="/pdf/iase_concept_overview.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg font-semibold"
              >
                Concept Overview (EN)
              </a>
            </li>
            <li>
              <a 
                href="https://zenodo.org/records/14993586" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-lg font-semibold"
              >
                Official Research on Zenodo
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}