const CDN_PANOS_BASE_URL = "https://cdn.sthyra.com/AADHYA%20SERENE/interior-panos-aadhya-serene/";

function buildUpstreamUrl(pathSegments: string[]) {
  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  return `${CDN_PANOS_BASE_URL}${encodedPath}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path = [] } = await context.params;

  if (!path.length) {
    return new Response("Missing pano path.", { status: 400 });
  }

  const upstreamResponse = await fetch(buildUpstreamUrl(path), {
    cache: "force-cache",
  });

  if (!upstreamResponse.ok) {
    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: {
        "Content-Type": upstreamResponse.headers.get("Content-Type") ?? "application/octet-stream",
      },
    });
  }

  const headers = new Headers();
  const contentType = upstreamResponse.headers.get("Content-Type");
  const cacheControl = upstreamResponse.headers.get("Cache-Control");
  const etag = upstreamResponse.headers.get("ETag");
  const lastModified = upstreamResponse.headers.get("Last-Modified");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  if (cacheControl) {
    headers.set("Cache-Control", cacheControl);
  }

  if (etag) {
    headers.set("ETag", etag);
  }

  if (lastModified) {
    headers.set("Last-Modified", lastModified);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  });
}
