export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-slate-800">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-semibold">Not Found</h1>
        <p className="text-sm text-slate-500">
          The page you requested does not exist.
        </p>
      </div>
    </div>
  );
}
