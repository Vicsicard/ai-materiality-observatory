'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Observation {
  id: number;
  title: string;
  slug: string;
  content: string;
  signal_type: string;
  created_at: string;
}

export default function ObservatoryPage() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchObservations() {
      try {
        const response = await fetch('https://ai-materiality-observatory.vic-76c.workers.dev/api/observations');
        if (response.ok) {
          const data = await response.json();
          setObservations(data.slice(0, 4)); // Show latest 4
        }
      } catch (error) {
        console.error('Failed to fetch observations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchObservations();
  }, []);

  const signalCategories = [
    {
      title: 'Governance',
      description: 'Policies, accountability, and oversight signals.',
      icon: 'G'
    },
    {
      title: 'Resource Consumption',
      description: 'Spending, capacity, compute, and efficiency signals.',
      icon: 'R'
    },
    {
      title: 'Operational Dependency',
      description: 'Adoption, reliance, workflow, and integration signals.',
      icon: 'O'
    },
    {
      title: 'Infrastructure',
      description: 'Compute, data center, power, and platform signals.',
      icon: 'I'
    },
    {
      title: 'Reporting & Disclosure',
      description: 'Transparency, investor, regulatory, and reporting signals.',
      icon: 'D'
    },
    {
      title: 'Sustainability',
      description: 'Energy, emissions, water, and environmental impact signals.',
      icon: 'S'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-white">
                DIG DEVELOPMENT
              </Link>
              <nav className="hidden md:flex space-x-6">
                <Link href="/intelligence" className="text-gray-300 hover:text-white transition-colors">
                  Intelligence
                </Link>
                <Link href="/observatory" className="text-teal-400 font-medium">
                  Observatory
                </Link>
                <a href="https://ai-resource-intelligence.pages.dev/" className="text-gray-300 hover:text-white transition-colors">
                  Assessment
                </a>
                <Link href="/briefings" className="text-gray-300 hover:text-white transition-colors">
                  Briefings
                </Link>
                <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                  About
                </Link>
              </nav>
            </div>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
              Contact
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"></div>
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="text-sm font-medium text-teal-400 mb-4">AI MATERIALITY</div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
                Observatory
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 mb-8">
                Real-world signals. Material insights. Operational relevance.
              </p>
              <p className="text-lg text-gray-400 mb-8 max-w-2xl">
                The Observatory tracks emerging signals across AI adoption, infrastructure, governance, resource consumption, operational dependency, sustainability, and reporting pressure — helping organizations understand what matters now and what may become materially significant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://ai-resource-intelligence.pages.dev/"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium transition-colors text-center"
                >
                  Assess Your Organization&apos;s AI Exposure
                </a>
                <button 
                  onClick={() => document.getElementById('recent-signals')?.scrollIntoView({ behavior: 'smooth' })}
                  className="border border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 px-8 py-4 rounded-lg font-medium transition-colors text-center"
                >
                  Explore Signals
                </button>
              </div>
            </div>
            
            <div className="lg:col-span-4">
              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
                  <div className="text-teal-400 font-semibold mb-2">OBSERVE</div>
                  <div className="text-gray-300">We monitor what matters.</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
                  <div className="text-teal-400 font-semibold mb-2">UNDERSTAND</div>
                  <div className="text-gray-300">We turn signals into organizational insight.</div>
                </div>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
                  <div className="text-teal-400 font-semibold mb-2">AUTHORIZE</div>
                  <div className="text-gray-300">We help you act with confidence.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Signals Section */}
      <section id="recent-signals" className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Recent Signals
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Published observations from the AI ecosystem that may indicate emerging operational significance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
                  <div className="h-4 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-20 bg-slate-700 rounded"></div>
                </div>
              ))
            ) : observations.length > 0 ? (
              observations.map((observation) => (
                <div key={observation.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm hover:border-teal-400/50 transition-colors">
                  <div className="text-xs font-medium text-teal-400 mb-2 uppercase tracking-wide">
                    {observation.signal_type}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">
                    {observation.title}
                  </h3>
                  <div className="text-sm text-gray-400 mb-4">
                    {new Date(observation.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-gray-300 mb-4 line-clamp-3">
                    {observation.content.replace(/[#*\[\]]/g, '').substring(0, 150)}...
                  </div>
                  <Link 
                    href={`/observations/${observation.slug}`}
                    className="text-teal-400 hover:text-teal-300 font-medium text-sm"
                  >
                    Read Observation →
                  </Link>
                </div>
              ))
            ) : (
              // Static placeholder cards
              [
                {
                  category: 'Resource Visibility',
                  title: 'Token Spend Breaks Budgets: A Signal of Emerging AI Resource Visibility Challenges',
                  source: 'The Pragmatic Engineer',
                  date: '2026-06-03'
                },
                {
                  category: 'Governance',
                  title: 'Anthropic IPO Signals Growing Governance Expectations for AI Companies',
                  source: 'TechCrunch',
                  date: '2026-06-02'
                },
                {
                  category: 'Infrastructure',
                  title: 'AI Infrastructure Expansion Signals Dependency Growth Across Organizations',
                  source: 'CRN',
                  date: '2026-06-01'
                },
                {
                  category: 'Operational Dependency',
                  title: 'Enterprise AI Adoption Signals Emerging Tool Reliance and Lock-In Risk',
                  source: 'Industry Reporting',
                  date: '2026-05-31'
                }
              ].map((card, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm hover:border-teal-400/50 transition-colors">
                  <div className="text-xs font-medium text-teal-400 mb-2 uppercase tracking-wide">
                    {card.category}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">
                    {card.title}
                  </h3>
                  <div className="text-sm text-gray-400 mb-4">
                    {card.source} • {card.date}
                  </div>
                  <Link 
                    href="#"
                    className="text-teal-400 hover:text-teal-300 font-medium text-sm"
                  >
                    Read Observation →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Signal Categories Section */}
      <section className="py-20 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Explore By Signal Category
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {signalCategories.map((category, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 backdrop-blur-sm hover:border-teal-400/50 transition-colors cursor-pointer">
                <div className="w-12 h-12 bg-teal-400/20 rounded-lg flex items-center justify-center text-teal-400 font-bold text-xl mb-4">
                  {category.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {category.title}
                </h3>
                <p className="text-gray-400">
                  {category.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Observatory Thesis Section */}
      <section className="py-20 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8">
            The Observatory Thesis
          </h2>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 backdrop-blur-sm">
            <p className="text-2xl font-medium text-teal-400 mb-8">
              AI adoption is accelerating. Visibility is not.
            </p>
            
            <p className="text-lg text-gray-300 mb-8">
              Organizations increasingly know AI is being used. Many cannot clearly determine where it is being used, how significant it has become, which dependencies are emerging, or whether materiality thresholds may eventually be crossed.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Where AI is being used</div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">How significant usage has become</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Which operational dependencies are emerging</div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Whether governance, resource, or reporting exposure is increasing</div>
                </div>
              </div>
            </div>
            
            <p className="text-xl font-medium text-white">
              Understanding AI adoption is different from understanding AI materiality.
            </p>
          </div>
        </div>
      </section>

      {/* Assessment Bridge CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Understand what matters. Assess what applies. Act with confidence.
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              The AI Double Materiality Assessment helps organizations evaluate AI exposure, operational significance, resource impact, governance readiness, and reporting preparedness.
            </p>
            <a 
              href="https://ai-resource-intelligence.pages.dev/"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-block"
            >
              Start Assessment
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="text-xl font-bold text-white mb-4">
                DIG DEVELOPMENT
              </div>
              <div className="space-y-2 text-gray-400 text-sm">
                <div>Observing systems in motion.</div>
                <div>We observe the systems.</div>
                <div>We turn signals into intelligence.</div>
                <div>We enable informed decision authority.</div>
                <div>We help you govern with confidence.</div>
              </div>
            </div>
            <div className="text-right">
              <a href="https://getdigdev.com" className="text-teal-400 hover:text-teal-300 transition-colors">
                getdigdev.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
