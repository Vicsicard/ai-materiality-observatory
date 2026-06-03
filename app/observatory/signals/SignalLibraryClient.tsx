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

export default function SignalLibraryClient() {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Signals');

  const categories = [
    'All Signals',
    'Governance',
    'Resource Consumption',
    'Operational Dependency',
    'Infrastructure',
    'Reporting & Disclosure',
    'Sustainability'
  ];

  const trendingThemes = [
    {
      title: 'AI Resource Visibility',
      description: 'Organizations are increasingly encountering questions related to AI costs, usage tracking, compute consumption, and operational visibility.',
      signalCount: 4
    },
    {
      title: 'Governance Pressure',
      description: 'Governance expectations around AI continue to expand across investors, boards, regulators, and stakeholders.',
      signalCount: 6
    },
    {
      title: 'Operational Dependency',
      description: 'Organizations are becoming increasingly reliant on AI systems across workflows, decision-making, and operations.',
      signalCount: 5
    }
  ];

  // Placeholder data for when API fails
  const getPlaceholderObservations = (): Observation[] => [
    {
      id: 1,
      title: 'Token Spend Breaks Budgets: A Signal of Emerging AI Resource Visibility Challenges',
      slug: 'token-spend-breaks-budgets',
      content: 'Organizations are discovering AI token consumption is exceeding planned budgets faster than expected.',
      signal_type: 'Resource Visibility',
      created_at: '2026-06-03'
    },
    {
      id: 2,
      title: 'Anthropic IPO Signals Growing Governance Expectations for AI Companies',
      slug: 'anthropic-ipo-governance-expectations',
      content: 'The Anthropic IPO filing reveals increasing investor and regulatory expectations around AI governance.',
      signal_type: 'Governance',
      created_at: '2026-06-02'
    },
    {
      id: 3,
      title: 'AI Infrastructure Expansion Signals Dependency Growth Across Organizations',
      slug: 'ai-infrastructure-expansion-dependency',
      content: 'Major cloud providers report unprecedented AI infrastructure demand indicating growing organizational dependency.',
      signal_type: 'Infrastructure',
      created_at: '2026-06-01'
    },
    {
      id: 4,
      title: 'Enterprise AI Adoption Signals Emerging Tool Reliance and Lock-In Risk',
      slug: 'enterprise-ai-adoption-tool-reliance',
      content: 'Enterprise surveys show increasing reliance on AI tools across core business functions.',
      signal_type: 'Operational Dependency',
      created_at: '2026-05-31'
    },
    {
      id: 5,
      title: 'SEC AI Disclosure Requirements Signal Growing Reporting Pressure',
      slug: 'sec-ai-disclosure-requirements',
      content: 'New SEC guidance indicates increasing regulatory expectations for AI risk disclosure.',
      signal_type: 'Reporting & Disclosure',
      created_at: '2026-05-30'
    },
    {
      id: 6,
      title: 'AI Data Center Energy Consumption Signals Sustainability Concerns',
      slug: 'ai-data-center-energy-consumption',
      content: 'Reports show AI workloads are driving significant increases in data center energy usage.',
      signal_type: 'Sustainability',
      created_at: '2026-05-29'
    }
  ];

  useEffect(() => {
    async function fetchObservations() {
      try {
        const response = await fetch('https://ai-materiality-observatory.vic-76c.workers.dev/api/observations', {
          cache: 'no-store'
        });
        if (response.ok) {
          const data = await response.json();
          setObservations(data);
        } else {
          // Use placeholder data if API fails
          setObservations(getPlaceholderObservations());
        }
      } catch (error) {
        console.error('Failed to fetch observations:', error);
        // Use placeholder data on error
        setObservations(getPlaceholderObservations());
      } finally {
        setLoading(false);
      }
    }

    fetchObservations();
  }, []);

  const filteredObservations = observations.filter(obs => {
    const matchesSearch = obs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         obs.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All Signals' || obs.signal_type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

      {/* Page Header */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-teal-400 mb-8">OBSERVATORY SIGNAL LIBRARY</div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Published Signals
            </h1>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              The Observatory tracks emerging signals across AI governance, resource consumption, infrastructure, operational dependency, reporting, and sustainability.
            </p>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              These observations help organizations identify patterns that may indicate growing AI significance.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">{observations.length} Signals</div>
              <div className="text-gray-400 text-sm">Published</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">6 Categories</div>
              <div className="text-gray-400 text-sm">Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400 mb-2">Updated Daily</div>
              <div className="text-gray-400 text-sm">Frequency</div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-12 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search signals, topics, organizations, or themes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-6 py-4 text-white placeholder-gray-400 focus:outline-none focus:border-teal-400 transition-colors"
              />
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedCategory === category
                    ? 'bg-teal-400 text-slate-950 font-medium'
                    : 'bg-slate-900/50 border border-slate-700 text-gray-300 hover:border-teal-400 hover:text-teal-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Themes */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-medium text-teal-400 mb-8">TRENDING THEMES</div>
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Emerging Patterns
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {trendingThemes.map((theme, index) => (
              <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 backdrop-blur-sm hover:border-teal-400/50 transition-colors">
                <h3 className="text-xl font-semibold text-white mb-4">
                  {theme.title}
                </h3>
                <p className="text-gray-300 mb-6">
                  {theme.description}
                </p>
                <div className="text-teal-400 font-medium">
                  {theme.signalCount} Signals
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signal Grid */}
      <section className="py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              All Signals
            </h2>
            <p className="text-lg text-gray-400">
              {filteredObservations.length} signals found
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
                  <div className="h-4 bg-slate-700 rounded mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-20 bg-slate-700 rounded"></div>
                </div>
              ))
            ) : filteredObservations.length > 0 ? (
              filteredObservations.map((observation) => (
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
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">No signals found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="text-sm font-medium text-teal-400 mb-8">ASSESSMENT</div>
          </div>
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-20 text-center">
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-12">
              Patterns Are Emerging.
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
