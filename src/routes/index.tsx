import { createFileRoute } from "@tanstack/react-router";
import { DeskPending, OutlookDesk } from "@/components/outlook-desk";
import { getPairNews } from "@/lib/fundamentals/news";
import { getOutlook } from "@/lib/fundamentals/outlook";

export const Route = createFileRoute("/")({
  loader: () =>
    Promise.all([
      getOutlook({ data: { fresh: false } }),
      getPairNews({ data: { fresh: false } }),
    ]),
  pendingComponent: DeskPending,
  component: Home,
});

function Home() {
  const [initial, initialNews] = Route.useLoaderData();
  return <OutlookDesk initial={initial} initialNews={initialNews} />;
}