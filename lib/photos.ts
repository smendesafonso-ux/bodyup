"use client";

import { supabase } from "./supabase";

export interface ProgressPhoto {
  id: string;
  date: string;
  path: string;
  url: string; // URL signée (privée, valable 1 h)
}

/** Compresse une image côté client (max 1080 px, JPEG qualité 0.82). */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const max = 1080;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  return await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Compression impossible"))), "image/jpeg", 0.82)
  );
}

export async function uploadProgressPhoto(userId: string, file: File): Promise<void> {
  const blob = await compressImage(file);
  const path = `${userId}/${Date.now()}.jpg`;
  const { error: upErr } = await supabase.storage.from("progress").upload(path, blob, { contentType: "image/jpeg" });
  if (upErr) throw new Error("Envoi de la photo impossible. As-tu exécuté update_v2.sql dans Supabase ?");
  const { error: dbErr } = await supabase.from("progress_photos").insert({ user_id: userId, path });
  if (dbErr) {
    await supabase.storage.from("progress").remove([path]); // pas de fichier orphelin
    throw new Error("Enregistrement de la photo impossible.");
  }
}

export async function loadProgressPhotos(userId: string): Promise<ProgressPhoto[]> {
  const { data } = await supabase
    .from("progress_photos")
    .select("id, date, path")
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  const rows = (data as { id: string; date: string; path: string }[]) ?? [];
  if (rows.length === 0) return [];
  const { data: signed } = await supabase.storage.from("progress").createSignedUrls(rows.map((r) => r.path), 3600);
  return rows.map((r, i) => ({ ...r, url: signed?.[i]?.signedUrl ?? "" })).filter((p) => p.url);
}

export async function deleteProgressPhoto(id: string, path: string): Promise<void> {
  await supabase.from("progress_photos").delete().eq("id", id);
  await supabase.storage.from("progress").remove([path]);
}
