import { NextRequest, NextResponse } from 'next/server';

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'content-encoding',
  'content-length',
  'host',
]);

export async function proxyToApi(request: NextRequest, path: string[]) {
  const apiOrigin = process.env.API_ORIGIN?.replace(/\/$/, '');
  if (!apiOrigin) {
    return NextResponse.json({ message: 'API de produção não configurada' }, { status: 502 });
  }

  const target = new URL(apiOrigin);
  const search = request.nextUrl.search;
  const url = `${apiOrigin}/api/${path.join('/')}${search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  headers.set('host', target.host);
  headers.set('x-forwarded-host', request.headers.get('host') ?? '');
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  });

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && key.toLowerCase() !== 'set-cookie') {
      responseHeaders.set(key, value);
    }
  });

  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });

  const cookies = upstream.headers.getSetCookie();
  for (const cookie of cookies) {
    response.headers.append('set-cookie', cookie);
  }

  return response;
}
