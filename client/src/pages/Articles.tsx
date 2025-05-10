import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageContext } from '@/App';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail: string;
  author: string;
  categories: string[];
}

interface ArticlesData {
  status: string;
  items: Article[];
  feed: {
    title: string;
    description: string;
    link: string;
    image: string;
  };
}

export default function Articles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [feedInfo, setFeedInfo] = useState<ArticlesData['feed'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const { setCurrentSection } = usePageContext();

  // Set current section for the AI helper
  useEffect(() => {
    // When category filters are shown, set the section to 'filter'
    if (categories.length > 0) {
      setCurrentSection('filter');
    }
    
    return () => {
      setCurrentSection('');
    };
  }, [categories.length, setCurrentSection]);

  useEffect(() => {
    // Get IASE articles from Medium via RSS2JSON
    const articlesFeedUrl = 'https://articles.iaseproject.com';
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(articlesFeedUrl)}&api_key=wyx8alrrnogwtzqpxal2x65uxhwsvxdm92moxp9f`;
    
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((data: ArticlesData) => {
        if (data.status === 'ok') {
          setArticles(data.items);
          setFeedInfo(data.feed);
          
          // Extract unique categories
          const allCategories = data.items.flatMap(item => item.categories || []);
          const uniqueCategories = allCategories
            .filter(cat => cat.trim() !== '')
            .filter((cat, index, self) => self.indexOf(cat) === index);
          setCategories(uniqueCategories);
        } else {
          throw new Error('Failed to load articles');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching articles:', err);
        setError('Failed to load articles. Please try again later.');
        setLoading(false);
      });
  }, []);

  // Filter articles by category if one is selected
  const filteredArticles = selectedCategory 
    ? articles.filter(article => article.categories?.includes(selectedCategory))
    : articles;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 py-8">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">IASE Articles</h1>
          <p className="text-xl text-gray-300 mb-4">Insights and Publications from the IASE Project</p>
          
          {feedInfo && (
            <div className="max-w-2xl mx-auto">
              <a 
                href={feedInfo.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-primary hover:underline"
              >
                {feedInfo.image && (
                  <img 
                    src={feedInfo.image} 
                    alt="Medium" 
                    className="w-6 h-6 rounded-full"
                  />
                )}
                <span>Follow us on Medium</span>
              </a>
            </div>
          )}
        </section>
        
        {/* Category filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button 
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                selectedCategory === null 
                  ? 'bg-primary text-white font-medium' 
                  : 'bg-card hover:bg-card-hover text-gray-300'
              }`}
            >
              All
            </button>
            
            {categories.map(category => (
              <button 
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedCategory === category 
                    ? 'bg-primary text-white font-medium' 
                    : 'bg-card hover:bg-card-hover text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      
        <section className="py-4">
          <h2 className="text-2xl font-bold text-primary mb-8">
            {selectedCategory 
              ? `Articles about ${selectedCategory}` 
              : 'Latest Articles'}
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 bg-red-900/20 rounded-lg">
              <p className="text-lg text-gray-300">{error}</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-300">
                {selectedCategory 
                  ? `No articles found in category "${selectedCategory}".` 
                  : 'No articles found.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, index) => {
                // Process description to remove HTML and limit length
                const textDescription = article.description
                  .replace(/<\/?[^>]+(>|$)/g, "") // Remove HTML tags
                  .substring(0, 150) + "..."; // Limit length
                
                return (
                  <div 
                    key={index} 
                    className="bg-card rounded-lg shadow-md overflow-hidden flex flex-col h-full transition-all hover:transform hover:-translate-y-1 hover:shadow-lg"
                  >
                    {article.thumbnail && (
                      <div className="w-full h-48 overflow-hidden">
                        <img 
                          src={article.thumbnail} 
                          alt={article.title} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    
                    <div className="p-6 flex-grow flex flex-col">
                      <div className="mb-auto">
                        <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                          <a 
                            href={article.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary/80 hover:underline"
                          >
                            {article.title}
                          </a>
                        </h3>
                        
                        <p className="text-gray-300 mb-4 line-clamp-3">
                          {textDescription}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-400">
                            {new Date(article.pubDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          
                          <a 
                            href={article.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary text-sm hover:underline"
                          >
                            Read more
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        
        {/* Call to action */}
        <section className="py-12 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-4">Stay Connected</h2>
            <p className="text-gray-300 mb-6">
              Follow our Medium publication for the latest updates, insights, and announcements
              about the IASE Project and our technology solutions.
            </p>
            <a 
              href={feedInfo?.link || "https://articles.iaseproject.com"}
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium shadow-lg hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 12C13 15.315 10.315 18 7 18C3.685 18 1 15.315 1 12C1 8.685 3.685 6 7 6C10.315 6 13 8.685 13 12Z" fill="currentColor"/>
                <path d="M23 12C23 14.76 21.76 17 20 17C18.24 17 17 14.76 17 12C17 9.24 18.24 7 20 7C21.76 7 23 9.24 23 12Z" fill="currentColor"/>
                <path d="M16 12C16 14.21 15.21 16 14 16C12.79 16 12 14.21 12 12C12 9.79 12.79 8 14 8C15.21 8 16 9.79 16 12Z" fill="currentColor"/>
              </svg>
              Follow on Medium
            </a>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}