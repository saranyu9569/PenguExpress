import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

interface Parcel extends mysql.RowDataPacket {
  status: string;
  locker_ID: number | null;
}

interface Locker extends mysql.RowDataPacket {
  locker_ID: number;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status } = await request.json();
    const parcel_ID = params.id;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [parcelResult] = await connection.query<Parcel[]>(
        'SELECT status, locker_ID FROM parcels WHERE parcel_ID = ?',
        [parcel_ID]
      );

      if (parcelResult.length > 0) {
        const currentStatus = parcelResult[0].status;
        const currentLockerID = parcelResult[0].locker_ID;

        if (status === 'In Locker' && currentStatus !== 'In Locker') {
          const [availableLockers] = await connection.query<Locker[]>(
            'SELECT locker_ID FROM lockers WHERE status = "Available" LIMIT 1'
          );

          if (availableLockers.length > 0) {
            const newLockerID = availableLockers[0].locker_ID;
            await connection.query(
              'UPDATE lockers SET status = "Unavailable" WHERE locker_ID = ?',
              [newLockerID]
            );
            await connection.query(
              'UPDATE parcels SET status = ?, locker_ID = ? WHERE parcel_ID = ?',
              [status, newLockerID, parcel_ID]
            );
          } else {
            throw new Error('No available lockers');
          }
        } else if (status === 'Delivered' && currentStatus === 'In Locker') {
          await connection.query(
            'UPDATE lockers SET status = "Available" WHERE locker_ID = ?',
            [currentLockerID]
          );
          await connection.query(
            'UPDATE parcels SET status = ?, locker_ID = NULL WHERE parcel_ID = ?',
            [status, parcel_ID]
          );
        } else {
          await connection.query(
            'UPDATE parcels SET status = ? WHERE parcel_ID = ?',
            [status, parcel_ID]
          );
        }

        await connection.commit();
        return NextResponse.json({ message: 'Parcel status updated successfully' });
      } else {
        return NextResponse.json({ error: 'Parcel not found' }, { status: 404 });
      }
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating parcel status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}