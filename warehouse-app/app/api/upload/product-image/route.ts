import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { requirePermission, badRequest } from "@/lib/api/helpers";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function POST(req: NextRequest) {
  const r = await requirePermission("manageReferenceData");
  if ("response" in r) return r.response;

  const form = await req.formData();
  const file = form.get("file");

  if (!(file instanceof File)) return badRequest("Файл табылмады", 400);
  if (!ALLOWED.has(file.type)) return badRequest("JPEG, PNG немесе WEBP қана қолдау табады", 415);
  if (file.size > MAX_BYTES) return badRequest("Файл өлшемі 4 МБ-тан аспауы керек", 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = EXT[file.type];
  const id = randomBytes(8).toString("hex");
  const filename = `${Date.now()}-${id}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return NextResponse.json({ url: `/uploads/products/${filename}` });
}
