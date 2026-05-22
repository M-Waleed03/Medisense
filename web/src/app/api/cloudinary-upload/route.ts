import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary is not configured on the server." }, { status: 500 });
  }

  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authentication token is required for uploads." }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") ?? "report");
  const userId = String(form.get("userId") ?? "unknown").replace(/[^\w-]/g, "");
  const declaredType = String(form.get("fileType") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  const isProfile = kind === "profile";
  const allowed = isProfile ? ["image/png", "image/jpeg", "image/webp"] : ["image/png", "image/jpeg", "image/webp", "application/pdf"];
  const fileType = file.type === "application/octet-stream" && declaredType ? declaredType : file.type;
  if (!allowed.includes(fileType)) {
    return NextResponse.json({ error: isProfile ? "Profile image must be PNG, JPG, or WEBP." : "Report must be PNG, JPG, WEBP, or PDF." }, { status: 415 });
  }

  const maxSize = isProfile ? 4 * 1024 * 1024 : 8 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File must be ${Math.round(maxSize / 1024 / 1024)}MB or smaller.` }, { status: 413 });
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = `medisense/${isProfile ? "profiles" : "reports"}/${userId}`;
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest("hex");

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", file);
  cloudinaryForm.append("api_key", apiKey);
  cloudinaryForm.append("timestamp", timestamp);
  cloudinaryForm.append("folder", folder);
  cloudinaryForm.append("signature", signature);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: cloudinaryForm
  });
  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data.error?.message ?? "Cloudinary upload failed." }, { status: response.status });
  }

  return NextResponse.json({
    secureUrl: data.secure_url,
    publicId: data.public_id,
    resourceType: data.resource_type,
    format: data.format,
    bytes: data.bytes
  });
}
