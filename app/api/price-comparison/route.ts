import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createComparisonTask, getComparisonResults, getUserComparisonHistory } from '@/lib/price-comparison-service';
import { ComparisonSearchParams } from '@/lib/types/price-comparison';

export const dynamic = 'force-dynamic';

// 启动比价任务
export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please login first to use price comparison' },
        { status: 401 }
      );
    }

    const params: ComparisonSearchParams = await request.json();

    if (!params.product_title) {
      return NextResponse.json(
        { success: false, error: 'Product title is required' },
        { status: 400 }
      );
    }

    const { record, error } = await createComparisonTask(user.id, params);

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        record_id: record.id,
        status: record.status
      }
    });

  } catch (error) {
    console.error('启动比价任务失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '启动比价任务失败' },
      { status: 500 }
    );
  }
}

// 查询比价结果
export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please login first to use price comparison' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('record_id');
    const getHistory = searchParams.get('history') === 'true';

    // 获取比价历史
    if (getHistory) {
      const { records, error } = await getUserComparisonHistory(user.id);
      if (error) {
        return NextResponse.json(
          { success: false, error },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        data: records
      });
    }

    if (!recordId) {
      return NextResponse.json(
        { success: false, error: 'record_id parameter is required' },
        { status: 400 }
      );
    }

    const { record, results, error } = await getComparisonResults(recordId);

    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        record,
        results
      }
    });

  } catch (error) {
    console.error('查询比价结果失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '查询比价结果失败' },
      { status: 500 }
    );
  }
}
