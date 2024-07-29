import { NextRequest, NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

export async function PATCH(req: NextRequest) {
  try {
    const id = req.nextUrl.pathname.split('/').pop() || '';
    const { status } = await req.json();

    if (!status) {
      return NextResponse.json({ message: 'Status is required' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    // Update parcel status
    await connection.execute(
      'UPDATE parcel SET status = ? WHERE parcel_ID = ?',
      [status, id]
    );

    // Reassign waiting parcels if necessary
    const [waitingRows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT * FROM parcel WHERE status = "Waiting"'
    );

    // Determine available lockers
    const [rows]: [RowDataPacket[], any] = await connection.execute(
      'SELECT * FROM parcel WHERE status != "Delivered"'
    );
    const usedLockers = new Set(rows.map((parcel: any) => parcel.lockerNumber));
    const allLockers = new Set(['001', '002']);
    const availableLockers = Array.from(allLockers).filter(locker => !usedLockers.has(locker));

    if (availableLockers.length > 0 && waitingRows.length > 0) {
      for (const parcel of waitingRows) {
        const [firstWaiting] = waitingRows;
        if (availableLockers.length > 0) {
          const lockerToAssign = availableLockers.shift(); // Get an available locker
          await connection.execute(
            'UPDATE parcel SET status = "Processing", lockerNumber = ? WHERE parcel_ID = ?',
            [lockerToAssign, firstWaiting.parcel_ID]
          );
          // Remove the firstWaiting from the array after processing
          waitingRows.shift();
        }
      }
    }

    return NextResponse.json({ message: 'Status updated successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
