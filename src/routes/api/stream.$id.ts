import { createFileRoute } from "@tanstack/react-router";
import { parseLangSources } from "@/lib/admin.functions";

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
        const url = new URL(request.url);
        const langParam = url.searchParams.get("lang");
        const sources = parseLangSources(data.video_url);
        const picked =
          (langParam &&
            sources.find((s) => s.lang.toLowerCase() === langParam.toLowerCase())) ||
          sources[0];
        if (!picked) return new Response("Not found", { status: 404 });
        const target = picked.url;
        const range = request.headers.get("range");
        const upstream = await fetch(target, {
          headers: range ? { Range: range } : undefined,
        });
        const headers = new Headers();
        const copy = [
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
        // Browsers refuse video/x-matroska, but the MKV container almost
        // always holds H.264/AAC which Chromium plays fine when labelled mp4.
        const upstreamType = upstream.headers.get("content-type") || "";
        const lower = target.toLowerCase();
        let outType = upstreamType;
        if (!outType || /matroska|octet-stream/i.test(outType)) {
          if (lower.includes(".webm")) outType = "video/webm";
          else outType = "video/mp4";
        } else if (/x-matroska/i.test(outType)) {
          outType = "video/mp4";
        }
        headers.set("content-type", outType);
        if (!headers.has("accept-ranges")) headers.set("accept-ranges", "bytes");
        return new Response(upstream.body, { status: upstream.status, headers });
      },
    },
  },
});