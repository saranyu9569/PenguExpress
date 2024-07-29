import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import mysql, { RowDataPacket } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

interface Admin {
  id: number;
  userName: string;
  password: string;
}


export async function POST(req: NextRequest) {
  try {
    const { userName, password } = await req.json();

    if (!userName || !password) {
      return NextResponse.json({ message: 'userName and password are required' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    const [rows]: [RowDataPacket[], any] = await connection.execute('SELECT * FROM Admin WHERE userName = ?', [userName]);

    if (rows.length === 0) {
      return NextResponse.json({ message: 'Invalid userName or password' }, { status: 401 });
    }

    const user: Admin = rows[0] as Admin;

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Invalid userName or password' }, { status: 401 });
    }

    return NextResponse.json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
