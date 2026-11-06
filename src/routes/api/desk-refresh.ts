import { createFileRoute } from "@tanstack/react-router";
import { getOutlook } from "@/lib/fundamentals/outlook";

function cronAllowed(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret) return request.headers.get("authorization") === `Bearer ${secret}`;
  const agent = request.headers.get("user-agent") ?? "";
  return agent.toLowerCase().includes("vercel-cron");
}

export const Route = createFileRoute("/api/desk-refresh")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!cronAllowed(request)) return new Response("Forbidden", { status: 403 });
        const result = await getOutlook({ data: { fresh: true } });
        if (!result.ok) return new Response(result.error, { status: 502 });
        return Response.json({
          ok: true,
          marketRetrievedAt: result.outlook.marketRetrievedAt,
          officialInputsRetrievedAt: result.outlook.officialInputsRetrievedAt,
          stale: result.outlook.stale,
        });
      },
    },
  },
});
