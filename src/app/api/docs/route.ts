import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src', 'docs', 'openapi.json')
    const content = fs.readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content)
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ message: 'OpenAPI spec introuvable' }, { status: 500 })
  }
}


