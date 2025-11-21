export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-pink-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}