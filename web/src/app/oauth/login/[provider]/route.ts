import { NextRequest, NextResponse } from 'next/server';

function buildCandidates(authBase: string, provider: string): string[] {
  const base = authBase.replace(/\/$/, '');
  const prov = provider.trim();
  return [
    `${base}/Auth/external/${prov}`,
    `${base}/auth/external/${prov}`,
  ];
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!provider) {
    return NextResponse.json({ message: 'Provider is required' }, { status: 400 });
  }

  const authApi = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:5219/api';
  const candidates = buildCandidates(authApi, provider);

  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'manual' });
      if (res.ok || (res.status >= 300 && res.status < 400)) {
        return NextResponse.redirect(url, 302);
      }
    } catch {}
  }

  return NextResponse.json({ message: 'OAuth endpoint not found', tried: candidates }, { status: 502 });
}


