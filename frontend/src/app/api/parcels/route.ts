import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

async function assignLockers(connection: mysql.Connection) {
  try {
    // Fetch all parcels with status "Waiting"
    const [waitingRows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT * FROM parcel WHERE status = "Waiting"'
    );

    // Fetch parcels that are not delivered
    const [rows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT * FROM parcel WHERE status != "Delivered"'
    );

    // Determine available lockers
    const usedLockers = new Set(rows.map((parcel: any) => parcel.lockerNumber));
    const allLockers = new Set(['001', '002']);
    const availableLockers = Array.from(allLockers).filter(locker => !usedLockers.has(locker));

    // Assign waiting parcels to available lockers if any
    if (availableLockers.length > 0 && waitingRows.length > 0) {
      for (const parcel of waitingRows) {
        const [firstWaiting] = waitingRows;
        if (availableLockers.length > 0) {
          const lockerToAssign = availableLockers.shift(); // Get an available locker
          await connection.execute(
            'UPDATE parcel SET status = "Processing", lockerNumber = ? WHERE parcel_ID = ?',
            [lockerToAssign, firstWaiting.parcel_ID]
          );
        }
      }
    }
  } catch (error) {
    console.error('Failed to assign lockers:', error);
    throw new Error('Failed to assign lockers');
  }
}

export async function GET(req: NextRequest) {
  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT * FROM parcel WHERE status != "Delivered"'
    );

    await assignLockers(connection); 

    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { weight, type, shipping_cost, parcel_sender, parcel_reciever, parcel_courier } = await req.json();

    if (!weight || !type || !shipping_cost || !parcel_sender || !parcel_reciever || !parcel_courier) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const parcel_ID = `PARCEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const status = 'Processing'; // Default status

    const connection = await mysql.createConnection(dbConfig);

    await connection.execute(
      'INSERT INTO parcel (parcel_ID,parcel_sender, parcel_reciever, parcel_courier, status) VALUES (?, ?, ?, ?, ?)',
      [parcel_ID, parcel_sender, parcel_reciever, parcel_courier, status]
    );

    return NextResponse.json({ message: 'Parcel created successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
