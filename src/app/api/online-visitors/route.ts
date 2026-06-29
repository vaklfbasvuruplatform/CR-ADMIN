import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const threshold = Date.now() - 10000;

    const dmnCookie = request.cookies.get('dmn')?.value;
    const isAuthorized = dmnCookie === 'dmn';

    const hardIpFilter = isAuthorized ? '' : `
      AND REPLACE(TRIM(c.ip), '::ffff:', '') NOT IN (
        SELECT REPLACE(TRIM(l.ip), '::ffff:', '') FROM logs l WHERE l.is_hard = 1
      )
    `;

    const result: any = await query(
      `SELECT 
        c.ip, 
        c.sayfa as page,
        (
          SELECT SUM(ci.cart_total) 
          FROM cart_items ci
          WHERE REPLACE(TRIM(ci.ip_address), '::ffff:', '') = REPLACE(TRIM(c.ip), '::ffff:', '') COLLATE utf8mb4_0900_ai_ci
        ) as cart_tutar
       FROM cevrimici_tablosu c
       WHERE CAST(c.onlineTimer AS UNSIGNED) >= ? ${hardIpFilter}`,
      [threshold]
    );

    const onlineVisitors = result.map((row: any) => ({
      ip: row.ip ? row.ip.replace("::ffff:", "").trim() : "",
      page: row.page || "Bilinmiyor",
      tutar: row.cart_tutar || null,
    }));

    return NextResponse.json(onlineVisitors);
  } catch (error) {
    console.error("Online visitors fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch online visitors" },
      { status: 500 }
    );
  }
}
