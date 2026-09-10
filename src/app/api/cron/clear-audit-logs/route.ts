import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Enforce strict fail-closed Authorization for Cron jobs
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'attendex_cron_secure_token_default';
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse('Unauthorized: Valid Cron Bearer token is required.', { status: 401 });
    }

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete audit logs older than 30 days
    const { error, count } = await supabase
      .from('audit_logs')
      .delete({ count: 'exact' })
      .lt('created_at', thirtyDaysAgo.toISOString());

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${count || 0} old audit logs.`,
      deletedCount: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
