import { Link } from "wouter";
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Web3() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="container mx-auto px-4 pt-20 py-8">
        <section className="py-8 md:py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Web3 Integration</h1>
          <p className="text-xl text-gray-300">Connecting Vision, Technology, and Community Participation</p>
        </section>
      
        <section className="max-w-4xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Why Web3 for IASE?</h2>
          <p className="text-lg text-gray-300 mb-4">
            IASE is not just a scientific vision for autonomous AI in space. It's also a social and technological experiment in open participation. Web3 allows the project to be not only transparent and verifiable, but also governed and supported by a global community.
          </p>
          <p className="text-lg text-gray-300">
            Instead of being managed by closed institutions or centralized entities, IASE can evolve through collaborative inputs, verified code, and decentralized ownership.
          </p>
        </section>
        
        <section className="max-w-4xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-primary mb-4">Token Utility &amp; Governance</h2>
          <p className="text-lg text-gray-300 mb-4">
            The <strong>IASE Token</strong> represents a core element of the Web3 structure. It is not just a digital asset — it's a tool for interaction, validation, and long-term sustainability of the IASE ecosystem.
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4 text-lg text-gray-300">
            <li>Participate in early pre-sale and token distribution</li>
            <li>Enable access to staking and future governance mechanisms</li>
            <li>Contribute to proposals and decisions about project development</li>
          </ul>
          <p className="text-lg text-gray-300">
            Learn more in the{" "}
            <Link href="/token">
              <span className="text-primary hover:text-primary/80 hover:underline cursor-pointer">
                Token page
              </span>
            </Link>.
          </p>
        </section>
        
        <section className="max-w-4xl mx-auto py-8">
          <h2 className="text-2xl font-bold text-primary mb-4">NFT &amp; Staking System</h2>
          <p className="text-lg text-gray-300 mb-4">
            IASE has officially launched a collection of <strong>functional NFTs</strong> called <em>IASE Units</em>.
            Each NFT represents a conceptual AI entity, with different roles, rarity, and staking power.
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-4 text-lg text-gray-300">
            <li>Stake NFTs to earn additional IASE Tokens</li>
            <li>Unlock access to advanced governance tiers</li>
            <li>Contribute to decentralized intelligence simulations</li>
          </ul>
          <p className="text-lg text-gray-300 mb-4">
            The collection is live and available now. Visit the{" "}
            <Link href="/nft">
              <span className="text-primary hover:text-primary/80 hover:underline cursor-pointer">
                NFT page
              </span>
            </Link>{" "}
            to learn more and explore the Units.
          </p>
          <p className="text-lg text-gray-300">
            This system is under development and will be expanded soon. Stay tuned for updates in our{" "}
            <Link href="/roadmap">
              <span className="text-primary hover:text-primary/80 hover:underline cursor-pointer">
                Roadmap
              </span>
            </Link>{" "}
            and{" "}
            <Link href="/articles">
              <span className="text-primary hover:text-primary/80 hover:underline cursor-pointer">
                IASE Articles
              </span>
            </Link>.
          </p>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}