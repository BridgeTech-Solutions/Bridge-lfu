// src/app/api/notification/[id]/route.ts
import { NextResponse } from 'next/server';

// Ce handler minimal évite l'erreur "not a module"
export async function GET() {
  return NextResponse.json({ message: 'route id placeholder' });
}
