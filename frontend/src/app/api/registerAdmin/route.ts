import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql, { RowDataPacket } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

export async function POST(req: NextRequest) {
  try {
    const { userName, password } = await req.json();

    if (!userName || !password) {
      return NextResponse.json({ message: 'userName and password are required' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await mysql.createConnection(dbConfig);

    await connection.execute('INSERT INTO Admin (userName, password) VALUES (?, ?)', [userName, hashedPassword]);

    return NextResponse.json({ message: 'Admin registered successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
