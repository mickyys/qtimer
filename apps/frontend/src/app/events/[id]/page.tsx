export default function EventPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Event Details
        </h1>
        <p className="text-lg text-gray-600">
          Event ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{params.id}</span>
        </p>
      </div>
    </div>
  );
}
