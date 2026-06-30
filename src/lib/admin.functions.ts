import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function checkAdmin(code: string | undefined | null) {
  const expected = process.env.ADMIN_CODE;
  if (!expected) throw new Error("Server misconfigured: ADMIN_CODE not set");
  if (!code || code !== expected) {
    throw new Response("Unauthorized", { status: 401 });
  }
}

const movieFields = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).nullable().optional(),
  poster_url: z.string().url().max(2000).nullable().optional(),
  trailer_url: z.string().url().max(2000).nullable().optional(),
  video_url: z.string().url().max(2000).nullable().optional(),
  genre: z.string().max(120).nullable().optional(),
  year: z.number().int().min(1800).max(3000).nullable().optional(),
  duration_min: z.number().int().min(0).max(100000).nullable().optional(),
});

export const adminCreateMovie = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminCode: z.string(), input: movieFields }).parse(data),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.adminCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("movies")
      .insert(data.input as never)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const adminUpdateMovie = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminCode: z.string(), id: z.string().uuid(), input: movieFields.partial() }).parse(data),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.adminCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("movies").update(data.input as never).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteMovie = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminCode: z.string(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.adminCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("movies").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminCreateSignedUpload = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({
      adminCode: z.string(),
      prefix: z.enum(["poster", "video", "trailer"]),
      ext: z.string().regex(/^[a-zA-Z0-9]{1,8}$/),
    }).parse(data),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.adminCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const path = `${data.prefix}/${crypto.randomUUID()}.${data.ext}`;
    const { data: signed, error } = await supabaseAdmin.storage
      .from("movie-assets")
      .createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    const { data: dl, error: dlErr } = await supabaseAdmin.storage
      .from("movie-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (dlErr) throw new Error(dlErr.message);
    return { path, uploadUrl: signed.signedUrl, token: signed.token, publicUrl: dl.signedUrl };
  });

export const incrementMovieViews = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("movies").select("views").eq("id", data.id).maybeSingle();
    const current = (row as { views?: number } | null)?.views ?? 0;
    await supabaseAdmin.from("movies").update({ views: current + 1 } as never).eq("id", data.id);
    return { ok: true };
  });

function classify(url: string | null | undefined): {
  kind: "youtube" | "hls" | "dash" | "video" | "none";
  ext: string;
} {
  if (!url) return { kind: "none", ext: "" };
  if (/youtu\.be|youtube\.com/.test(url)) return { kind: "youtube", ext: "" };
  if (/\.m3u8(\?|$)/i.test(url)) return { kind: "hls", ext: "m3u8" };
  if (/\.mpd(\?|$)/i.test(url)) return { kind: "dash", ext: "mpd" };
  const m = url.match(/\.([a-z0-9]{2,5})(?:\?|$)/i);
  return { kind: "video", ext: m ? m[1].toLowerCase() : "mp4" };
}

// Public meta about a movie's stream (kind + extension) without exposing the URL itself.
export const getMovieStreamMeta = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("movies")
      .select("video_url")
      .eq("id", data.id)
      .maybeSingle();
    const url = (row as { video_url?: string | null } | null)?.video_url ?? null;
    return { ...classify(url), youtubeUrl: classify(url).kind === "youtube" ? url : null };
  });

// Admin-only: return the raw video_url so the edit dialog can pre-fill it.
export const adminGetMovieFull = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ adminCode: z.string(), id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    checkAdmin(data.adminCode);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("movies")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });