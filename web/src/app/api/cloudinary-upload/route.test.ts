import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route.js";

test("analyzes report uploads with ML when Cloudinary is not configured", async () => {
  const originalCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const originalApiKey = process.env.CLOUDINARY_API_KEY;
  const originalApiSecret = process.env.CLOUDINARY_API_SECRET;
  const originalAiUrl = process.env.NEXT_PUBLIC_AI_API_URL;
  const originalFetch = global.fetch;

  delete process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  process.env.NEXT_PUBLIC_AI_API_URL = "http://ml.test";

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("api.cloudinary.com")) {
      throw new Error("Cloudinary should not be called without configuration.");
    }

    if (url === "http://ml.test/ocr") {
      return new Response(JSON.stringify({
        extractedText: "Hemoglobin 13.2 WBC 7200",
        extractedValues: { hemoglobin: 13.2, wbc: 7200 },
        analysis: "OCR worked",
        flags: []
      }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    if (url === "http://ml.test/analyze-report-values") {
      return new Response(JSON.stringify({ summary: "backend fallback worked", riskLevel: "low", flags: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }

    throw new Error(`Unexpected URL: ${url}`);
  }) as typeof fetch;

  try {
    const form = new FormData();
    form.append("file", new File(["hello"], "report.pdf", { type: "application/pdf" }));
    form.append("kind", "report");
    form.append("userId", "user-123");

    const request = new Request("http://localhost/api/cloudinary-upload", {
      method: "POST",
      headers: { authorization: "Bearer token" },
      body: form
    });

    const response = await POST(request);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.analysis.analysis, "backend fallback worked");
    assert.equal(body.analysis.extracted_data.hemoglobin, 13.2);
    assert.equal(body.storage, "ml-direct");
  } finally {
    setEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME", originalCloudName);
    setEnv("CLOUDINARY_API_KEY", originalApiKey);
    setEnv("CLOUDINARY_API_SECRET", originalApiSecret);
    setEnv("NEXT_PUBLIC_AI_API_URL", originalAiUrl);
    global.fetch = originalFetch;
  }
});

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
