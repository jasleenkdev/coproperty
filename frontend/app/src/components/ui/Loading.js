// Loading overlay and skeleton components
import { Spinner } from "./Button";

export function LoadingOverlay({ message = "Loading..." }) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 shadow-xl flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-primary-600" />
        <p className="text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" className="text-primary-600" />
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}
