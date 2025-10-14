// app/results/page.tsx
import { Suspense } from "react";
import SearchPage from "./SearchPage";

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <SearchPage />
    </Suspense>
  );
}
