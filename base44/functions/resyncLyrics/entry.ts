import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { songId } = await req.json();
    if (!songId) return Response.json({ error: 'songId required' }, { status: 400 });

    // Reuse the same providers + word-cap sync, preserving existing translations
    await base44.functions.invoke('resilientLyricsPipeline', { songId });

    return Response.json({ success: true, message: 'Resync triggered' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});