import { Metadata } from 'next';
import SignalLibraryClient from './SignalLibraryClient';

export const metadata: Metadata = {
  title: 'Signal Library - AI Materiality Observatory',
  description: 'Explore published signals across AI governance, resource consumption, infrastructure, operational dependency, reporting, and sustainability.',
};

export default function SignalLibraryPage() {
  return <SignalLibraryClient />;
}
