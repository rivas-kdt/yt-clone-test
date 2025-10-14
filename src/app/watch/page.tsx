import { Suspense } from "react";
import WatchPage from "./WatchPage";

export default function VideoPlayerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-400">Loading...</div>}>
      <WatchPage />
    </Suspense>
  );
}
