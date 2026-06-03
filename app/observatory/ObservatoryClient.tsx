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

export default function ObservatoryClient() {
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
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-48">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-8">
              <div className="text-sm font-medium text-teal-400 mb-4">AI MATERIALITY</div>
              <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6">
                Observatory
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 mb-8">
                Tracking real-world signals that may indicate AI is becoming operationally significant.
              </p>
              <p className="text-lg text-gray-400 mb-8 max-w-3xl">
                Major developments across AI infrastructure, governance, reporting, resource consumption, and adoption may have implications far beyond the companies making headlines.
              </p>
              <p className="text-lg text-gray-400 mb-8 max-w-3xl">
                The Observatory helps connect those signals to organizational relevance.
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
            <div className="text-sm font-medium text-teal-400 mb-8">RECENT SIGNALS</div>
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
                  <div className="text-xs font-medium text-teal-400 mb-3 uppercase tracking-wide">
                    {observation.signal_type}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    ORIGINAL EVENT
                  </h4>
                  <h3 className="text-lg font-semibold text-white mb-4 line-clamp-2">
                    {observation.title}
                  </h3>
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    WHAT THIS MAY INDICATE
                  </h4>
                  <div className="text-gray-300 mb-4 text-sm">
                    Organizations may be accumulating AI costs faster than visibility systems can track.
                  </div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    POTENTIAL RELEVANCE
                  </h4>
                  <div className="text-gray-300 mb-6 text-sm space-y-2">
                    <div>• AI Resource Intelligence</div>
                    <div>• Operational Dependency</div>
                    <div>• Governance Visibility</div>
                  </div>
                  <Link 
                    href={`/observations/${observation.slug}`}
                    className="text-teal-400 hover:text-teal-300 font-medium text-sm block"
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
                  <div className="text-xs font-medium text-teal-400 mb-3 uppercase tracking-wide">
                    {card.category}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    ORIGINAL EVENT
                  </h4>
                  <h3 className="text-lg font-semibold text-white mb-4 line-clamp-2">
                    {card.title}
                  </h3>
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    WHAT THIS MAY INDICATE
                  </h4>
                  <div className="text-gray-300 mb-4 text-sm">
                    {card.category === 'Resource Visibility' && 'Organizations may be accumulating AI costs faster than visibility systems can track.'}
                    {card.category === 'Governance' && 'Growing investor, reporting, and governance expectations around AI operations.'}
                    {card.category === 'Infrastructure' && 'Infrastructure expansion signals growing dependency and potential material impact on operations.'}
                    {card.category === 'Operational Dependency' && 'Tool reliance creates lock-in risk and may affect future operational flexibility.'}
                  </div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                    POTENTIAL RELEVANCE
                  </h4>
                  <div className="text-gray-300 mb-6 text-sm space-y-2">
                    {card.category === 'Resource Visibility' && (
                      <>
                        <div>• AI Resource Intelligence</div>
                        <div>• Operational Dependency</div>
                        <div>• Governance Visibility</div>
                      </>
                    )}
                    {card.category === 'Governance' && (
                      <>
                        <div>• Governance Readiness</div>
                        <div>• Reporting Pressure</div>
                        <div>• AI Dependency</div>
                      </>
                    )}
                    {card.category === 'Infrastructure' && (
                      <>
                        <div>• Infrastructure Dependency</div>
                        <div>• Resource Planning</div>
                        <div>• Operational Risk</div>
                      </>
                    )}
                    {card.category === 'Operational Dependency' && (
                      <>
                        <div>• Vendor Lock-in</div>
                        <div>• Workflow Integration</div>
                        <div>• Operational Flexibility</div>
                      </>
                    )}
                  </div>
                  <Link 
                    href="#"
                    className="text-teal-400 hover:text-teal-300 font-medium text-sm block"
                  >
                    Read Observation →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Signal Library CTA Section */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="text-sm font-medium text-teal-400 mb-8">SIGNAL LIBRARY</div>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Explore The Full Signal Library
            </h2>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              The Observatory tracks published signals across governance, resource consumption, infrastructure, operational dependency, reporting, and sustainability.
            </p>
            <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
              View the complete collection of observations and emerging patterns.
            </p>
            <Link 
              href="/observatory/signals"
              className="border border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 px-8 py-4 rounded-lg font-medium transition-colors inline-block"
            >
              View All Signals →
            </Link>
          </div>
        </div>
      </section>

      {/* Observatory Thesis Section */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-sm font-medium text-teal-400 mb-8">WHY THESE SIGNALS MATTER</div>
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8">
            Why These Signals Matter
          </h2>
          
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 backdrop-blur-sm">
            <p className="text-lg text-gray-300 mb-6">
              Organizations increasingly know AI is being used.
            </p>
            <p className="text-lg text-gray-300 mb-6">
              Many cannot determine:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6 text-left max-w-3xl mx-auto">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Where AI is being used</div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">How significant adoption has become</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Which dependencies are emerging</div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">What resource demands are increasing</div>
                </div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6 text-left max-w-3xl mx-auto">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Whether governance expectations are changing</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-teal-400 rounded-full mt-2"></div>
                  <div className="text-gray-300">Whether materiality thresholds may be crossed</div>
                </div>
              </div>
            </div>
            
            <p className="text-lg text-gray-300">
              The Observatory tracks signals that may indicate AI is becoming operationally significant.
            </p>
          </div>
        </div>
      </section>

      {/* Assessment Bridge CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="text-sm font-medium text-teal-400 mb-8">ASSESSMENT</div>
          </div>
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-20 text-center">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-12">
              You&apos;ve Seen The Signals.
            </h2>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-16">
              The Next Question Is Whether They Apply To Your Organization.
            </h2>
            <div className="mb-16 max-w-3xl mx-auto">
              <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                The AI Double Materiality Assessment helps organizations evaluate AI exposure, operational significance, governance readiness, resource impacts, sustainability considerations, and reporting preparedness.
              </p>
            </div>
            <a 
              href="https://ai-resource-intelligence.pages.dev/"
              className="bg-orange-500 hover:bg-orange-600 text-white px-16 py-8 rounded-lg font-medium transition-colors inline-block text-xl"
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
