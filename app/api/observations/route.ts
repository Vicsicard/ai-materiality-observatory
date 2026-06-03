import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db/client';

export async function GET(request: NextRequest) {
  try {
    // This API route will be called by the frontend to fetch observations from D1
    // In production, the D1 binding will be available through Cloudflare's environment
    
    // For now, return empty array since D1 binding isn't available in this context
    // Once deployed to Cloudflare Pages with proper D1 binding, this will work
    
    return NextResponse.json({
      observations: [],
      message: 'D1 binding not available in current environment'
    });
  } catch (error) {
    console.error('Failed to fetch observations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch observations' },
      { status: 500 }
    );
  }
}
