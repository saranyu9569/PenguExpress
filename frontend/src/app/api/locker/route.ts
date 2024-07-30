import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function GET(request: NextRequest) {
  try {
    const [lockers] = await pool.query('SELECT * FROM lockers WHERE status = "Available"');
    return NextResponse.json(lockers);
  } catch (error) {
    console.error('Error fetching available lockers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}