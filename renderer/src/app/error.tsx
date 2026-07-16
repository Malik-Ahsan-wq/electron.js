'use client';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950 p-8">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
        <pre className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-auto max-h-60 mb-4">
          {error.message}
        </pre>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}