import { NextResponse } from 'next/server'

export async function POST(req: Request){
  try{
    const data = await req.json()
    // Demo: log to console (in a real app, persist to DB or external service)
    console.log('lead:', data)
    return NextResponse.json({ success:true })
  }catch(e){
    return NextResponse.json({ success:false }, { status:500 })
  }
}