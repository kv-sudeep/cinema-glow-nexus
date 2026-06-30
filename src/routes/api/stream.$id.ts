import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/stream/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("movies")
          .select("video_url")
          .eq("id", params.id)
          .maybeSingle();
        if (error || !data?.video_url) {
          return new Response("Not found", { status: 404 });
        }
        const target = data.video_url;
        const range = request.headers.get("range");
        const upstream = await fetch(target, {
          headers: range ? { Range: range } : undefined,
        });
        const headers = new Headers();
        const copy = [
          "content-type",
          "content-length",
          "content-range",
          "accept-ranges",
          "last-modified",
          "etag",
          "cache-control",
        ];
        for (const h of copy) {
          const v = upstream.headers.get(h);
          if (v) headers.set(h, v);
        }
        if (!headers.has("content-type")) {
          headers.set("content-type", "video/x-matroska");
        }
        if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});