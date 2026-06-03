import { Metadata } from 'next';
import ObservatoryClient from './ObservatoryClient';

export const metadata: Metadata = {
  title: 'Observatory - AI Materiality Intelligence',
  description: 'Real-world signals. Material insights. Operational relevance. The Observatory tracks emerging signals across AI adoption, infrastructure, governance, and resource consumption.',
};

export default function ObservatoryPage() {
  return <ObservatoryClient />;
}
