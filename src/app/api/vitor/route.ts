import { profile, services } from "@/lib/content";

// GET /api/vitor de verdade: a seção "sobre" consome este endpoint.
export async function GET() {
  return Response.json(
    {
      ...profile,
      services: services.map((s) => ({
        name: s.name,
        status: s.status,
        url: s.liveUrl ?? s.repoUrl,
      })),
      coffee: "required",
    },
    { headers: { "X-Powered-By": "Spring Boot (mentira, é Next.js)" } },
  );
}
