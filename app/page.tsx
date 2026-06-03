import Link from "next/link";

interface Observation {
  id: number;
  title: string;
  signal_type: string;
  created_at: string;
  slug: string;
}

async function getObservations(): Promise<Observation[]> {
  // Database will be populated after articles are submitted and processed
  // For now, return empty array - observations will appear after first submission
  return [];
}

export default async function Home() {
  const observations = await getObservations();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">AI Materiality Observatory</h1>
            <Link 
              href="/admin" 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Latest Observations</h2>
          <p className="text-gray-600">Transforming AI events into organizational insights</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {observations.map((observation) => (
            <div key={observation.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-4">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                  {observation.signal_type}
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {observation.title}
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{new Date(observation.created_at).toLocaleDateString()}</span>
                <Link 
                  href={`/observations/${observation.slug}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Read Observation →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {observations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No observations published yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
