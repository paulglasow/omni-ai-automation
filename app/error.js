'use client';

export default function Error({ error, reset }) {
  return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center max-w-md px-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-sm text-slate-500 mb-4">{error?.message || 'An unexpected error occurred'}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
