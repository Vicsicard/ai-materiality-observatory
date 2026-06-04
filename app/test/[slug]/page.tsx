export default function TestPage({ params }: { params: { slug: string } }) {
  return (
    <div className="p-8">
      <h1>Test Route Working</h1>
      <p>Slug: {params.slug}</p>
      <p>If you can see this, dynamic routes are working.</p>
    </div>
  );
}
