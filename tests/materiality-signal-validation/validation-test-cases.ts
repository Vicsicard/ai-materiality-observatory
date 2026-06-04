export interface ValidationTestCase {
  id: string;
  name: string;
  source_url: string;
  expected_primary_signal: string;
  expected_secondary_signals: string[];
  expected_primary_dimensions: string[];
  expected_relevance_level: "High" | "Medium" | "Low";
  expected_evidence_count: number;
  description: string;
}

export const VALIDATION_TEST_CASES: ValidationTestCase[] = [
  {
    id: 'claude-code-pricing',
    name: 'Claude Code Pricing',
    source_url: 'https://www.cloudzero.com/blog/claude-code-pricing/',
    expected_primary_signal: 'resource_readiness',
    expected_secondary_signals: ['operational_dependency', 'visibility_gap'],
    expected_primary_dimensions: ['AI Visibility', 'Resource Readiness'],
    expected_relevance_level: 'High',
    expected_evidence_count: 2,
    description: 'AI tool pricing becoming operational cost requiring budget planning'
  },
  {
    id: 'anthropic-ipo',
    name: 'Anthropic IPO',
    source_url: 'https://techcrunch.com/2023/09/25/anthropic-raises-4b-from-amazon/',
    expected_primary_signal: 'resource_readiness',
    expected_secondary_signals: ['governance_pressure', 'reporting_pressure'],
    expected_primary_dimensions: ['Resource Readiness', 'Governance Readiness', 'Reporting Pressure'],
    expected_relevance_level: 'High',
    expected_evidence_count: 3,
    description: 'Major AI funding indicating resource requirements and governance implications'
  },
  {
    id: 'datacenter-expansion',
    name: 'Datacenter Expansion',
    source_url: 'https://www.datacenterdynamics.com/en/news/nvidia-ai-demand-drives-datacenter-expansion/',
    expected_primary_signal: 'infrastructure_readiness',
    expected_secondary_signals: ['resource_readiness', 'sustainability_impact'],
    expected_primary_dimensions: ['Infrastructure Readiness', 'Resource Readiness'],
    expected_relevance_level: 'High',
    expected_evidence_count: 2,
    description: 'AI workloads driving infrastructure expansion requirements'
  },
  {
    id: 'eu-ai-act',
    name: 'EU AI Act',
    source_url: 'https://europarl.europa.eu/news/en/press-room/20230601IPR28625/eu-ai-act-first-regulation-on-artificial-intelligence',
    expected_primary_signal: 'governance_pressure',
    expected_secondary_signals: ['reporting_pressure'],
    expected_primary_dimensions: ['Governance Readiness', 'Reporting Pressure'],
    expected_relevance_level: 'High',
    expected_evidence_count: 2,
    description: 'Regulatory requirements creating governance and compliance pressure'
  },
  {
    id: 'enterprise-ai-survey',
    name: 'Enterprise AI Adoption Survey',
    source_url: 'https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights/the-state-of-ai-in-2023',
    expected_primary_signal: 'visibility_gap',
    expected_secondary_signals: ['operational_dependency', 'resource_readiness'],
    expected_primary_dimensions: ['AI Visibility', 'Operational Dependency'],
    expected_relevance_level: 'High',
    expected_evidence_count: 2,
    description: 'Survey revealing hidden AI adoption and visibility challenges'
  }
];

export interface ValidationResult {
  test_case: ValidationTestCase;
  actual_primary_signal?: string;
  actual_secondary_signals: string[];
  actual_primary_dimensions: string[];
  actual_relevance_level?: "High" | "Medium" | "Low";
  actual_evidence_count: number;
  signal_confidence: number;
  evidence_snippets: string[];
  executive_observation?: string;
  organizational_relevance?: string[];
  questions_for_organizations?: string[];
  assessment_connection?: string;
  processing_time_ms: number;
  error?: string;
}

export interface ValidationReport {
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  overall_accuracy: number;
  signal_accuracy: number;
  aidma_accuracy: number;
  relevance_accuracy: number;
  evidence_quality_score: number;
  average_processing_time: number;
  results: ValidationResult[];
  summary: string;
}
