'use client';

interface AssessmentBridgeProps {
  signalType: string;
  className?: string;
}

export default function AssessmentBridge({ signalType, className = '' }: AssessmentBridgeProps) {
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

  const getSignalTypeDescription = (signalType: string) => {
    switch (signalType) {
      case 'AI Visibility':
        return 'Understanding where and how AI is being used across your organization';
      case 'Operational Dependency':
        return 'Assessing how critical AI systems are to your daily operations';
      case 'Governance Pressure':
        return 'Evaluating whether your governance frameworks can handle AI adoption';
      case 'Resource Readiness':
        return 'Determining if you have the resources and capabilities for AI at scale';
      default:
        return 'Understanding the organizational implications of AI adoption';
    }
  };

  return (
    <div className={`bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 rounded-2xl p-12 text-center ${className}`}>
      <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
        How Do These Observations Apply To Your Organization?
      </h2>
      
      <p className="text-lg text-gray-300 mb-8 leading-relaxed">
        Observing AI adoption trends is different from understanding AI exposure inside your own organization.
      </p>
      
      <p className="text-lg text-gray-300 mb-8 leading-relaxed">
        This signal may indicate emerging conditions related to:
      </p>
      
      {/* Signal Type Tags */}
      <div className="flex flex-wrap justify-center gap-4 mb-8">
        <span className={`px-4 py-2 ${getSignalTypeBg(signalType)} rounded-lg text-gray-300 border`}>
          {signalType}
        </span>
        <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">
          AI Visibility
        </span>
        <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">
          Operational Dependency
        </span>
        <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">
          Governance Pressure
        </span>
        <span className="px-4 py-2 bg-slate-700 rounded-lg text-gray-300">
          Resource Readiness
        </span>
      </div>
      
      {/* Signal Type Specific Description */}
      <div className={`mb-12 p-6 rounded-lg ${getSignalTypeBg(signalType)} border`}>
        <p className={`text-lg ${getSignalTypeColor(signalType)} leading-relaxed`}>
          {getSignalTypeDescription(signalType)}
        </p>
      </div>
      
      <p className="text-lg text-gray-300 mb-8 leading-relaxed">
        The next question is whether similar conditions already exist within your organization.
      </p>
      
      <p className="text-lg text-gray-300 mb-12 leading-relaxed">
        Determine whether AI adoption has become operationally significant.
      </p>
      
      {/* Primary CTA */}
      <a 
        href="https://ai-resource-intelligence.pages.dev/"
        className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-medium transition-colors inline-block text-lg mb-6"
      >
        Start AI Double Materiality Assessment →
      </a>
      
      {/* Secondary CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <a 
          href="/observatory"
          className="border border-teal-400 text-teal-400 hover:bg-teal-400 hover:text-slate-950 px-6 py-3 rounded-lg font-medium transition-colors inline-block"
        >
          Explore More Signals
        </a>
        <a 
          href="#questions"
          className="border border-gray-400 text-gray-400 hover:bg-gray-400 hover:text-slate-950 px-6 py-3 rounded-lg font-medium transition-colors inline-block"
        >
          Review Executive Questions
        </a>
      </div>
      
      {/* Trust Indicators */}
      <div className="mt-12 pt-8 border-t border-slate-600">
        <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>Confidential Assessment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span>Executive-Focused</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Materiality Framework</span>
          </div>
        </div>
      </div>
    </div>
  );
}
