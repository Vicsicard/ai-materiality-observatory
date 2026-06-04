'use client';

import Link from 'next/link';

interface ObservatoryArticleV3Props {
  article: {
    id: number;
    title: string;
    slug: string;
    signal_type: string;
    content: string;
    created_at: string;
    // V3 specific fields
    original_event?: string;
    observation?: string;
    what_this_may_indicate?: string;
    why_organizations_should_pay_attention?: string;
    executive_questions?: string[];
    intelligence_assessment?: string;
  };
}

export default function ObservatoryArticleV3({ article }: ObservatoryArticleV3Props) {
  const getSignalTypeColor = (signalType: string) => {
    switch (signalType) {
      case 'AI Visibility': return 'text-blue-400';
      case 'Operational Dependency': return 'text-orange-400';
      case 'Governance Pressure': return 'text-purple-400';
      case 'Resource Readiness': return 'text-green-400';
      default: return 'text-teal-400';
    }
  };

  const getSignalTypeBg = (signalType: string) => {
    switch (signalType) {
      case 'AI Visibility': return 'bg-blue-900/20 border-blue-800';
      case 'Operational Dependency': return 'bg-orange-900/20 border-orange-800';
      case 'Governance Pressure': return 'bg-purple-900/20 border-purple-800';
      case 'Resource Readiness': return 'bg-green-900/20 border-green-800';
      default: return 'bg-teal-900/20 border-teal-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navigation */}
      <header className="border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* Article Content */}
      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Signal Classification */}
        <div className="mb-12">
          <div className={`inline-block px-4 py-2 rounded-lg border ${getSignalTypeBg(article.signal_type)} mb-4`}>
            <span className={`text-sm font-medium uppercase tracking-wide ${getSignalTypeColor(article.signal_type)}`}>
              {article.signal_type}
            </span>
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-8 leading-tight">
          {article.title}
        </h1>

        {/* Publication Date */}
        <div className="text-gray-400 mb-12">
          Published {new Date(article.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

        {/* Original Event */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Original Event</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed">
              {article.original_event || (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-gray-400 italic">Original event summary will be generated here...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Observation */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Observation</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed">
              {article.observation || (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-gray-400 italic">Observation analysis will be generated here...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* What This May Indicate */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">What This May Indicate</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed">
              {article.what_this_may_indicate || (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-gray-400 italic">Broader organizational signal analysis will be generated here...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Why Organizations Should Pay Attention */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Why Organizations Should Pay Attention</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed">
              {article.why_organizations_should_pay_attention || (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-gray-400 italic">Latent exposure analysis will be generated here...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Questions Worth Considering */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Questions Worth Considering</h2>
          <div className="space-y-4">
            {article.executive_questions && article.executive_questions.length > 0 ? (
              article.executive_questions.map((question, index) => (
                <div key={index} className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-teal-400 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 leading-relaxed">{question}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                <p className="text-gray-400 italic">Executive questions will be generated here...</p>
              </div>
            )}
          </div>
        </section>

        {/* Intelligence Assessment */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-6">Intelligence Assessment</h2>
          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 leading-relaxed">
              {article.intelligence_assessment || (
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
                  <p className="text-gray-400 italic">Executive intelligence assessment will be generated here...</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Assessment Bridge */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              How Do These Observations Apply To Your Organization?
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Observing AI adoption trends is different from understanding AI exposure inside your own organization.
            </p>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              This signal may indicate emerging conditions related to:
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">AI Visibility</span>
              <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">Operational Dependency</span>
              <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">Governance Pressure</span>
              <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">Resource Readiness</span>
            </div>
            <p className="text-lg text-gray-300 mb-12 leading-relaxed">
              The next question is whether similar conditions already exist within your organization.
            </p>
            <p className="text-lg text-gray-300 mb-12 leading-relaxed">
              Determine whether AI adoption has become operationally significant.
            </p>
            <a 
              href="https://ai-resource-intelligence.pages.dev/"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-block text-lg"
            >
              Start AI Double Materiality Assessment →
            </a>
          </div>
        </section>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-8 border-t border-slate-800">
          <Link href="/observatory" className="text-teal-400 hover:text-teal-300 transition-colors">
            ← Back to Observatory
          </Link>
          <div className="text-gray-400 text-sm">
            AI Materiality Observatory
          </div>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
