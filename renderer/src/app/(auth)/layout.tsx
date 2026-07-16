export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        {children}
      </div>
    </div>
  );
}
