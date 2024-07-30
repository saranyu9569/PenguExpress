import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import twilio from 'twilio';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

interface Locker {
  locker_ID: number;
  status: 'Available' | 'Unavailable';
}

function generateParcelID() {
  const randomNumbers = Math.floor(Math.random() * 100000000000).toString().padStart(11, '0');
  return `AC${randomNumbers}`;
}

function generatePassword() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'availableCouriers') {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query(
          'SELECT courier_ID, courier_name FROM couriers WHERE status = "Available"'
        );
        return NextResponse.json(rows);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching available couriers:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  } else {
    try {
      const connection = await pool.getConnection();
      try {
        const [rows] = await connection.query('SELECT * FROM parcels');
        return NextResponse.json(rows);
      } finally {
        connection.release();
      }
    } catch (error) {
      console.error('Error fetching parcels:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sender_tel, receiver_tel, courier_ID, status } = await request.json();
    const parcel_ID = generateParcelID();
    const courierTel = '+66882856552'; // Default courier telephone number
    const parcelPassword = generatePassword(); // Generate 4-digit password

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      let locker_ID = null;
      if (status === 'In Locker') {
        const [availableLockers] = await connection.query<mysql.RowDataPacket[]>(
          'SELECT locker_ID FROM lockers WHERE status = "Available" LIMIT 1'
        );

        if (availableLockers.length > 0) {
          locker_ID = (availableLockers[0] as Locker).locker_ID;
          await connection.query(
            'UPDATE lockers SET status = "Unavailable" WHERE locker_ID = ?',
            [locker_ID]
          );
        } else {
          throw new Error('No available lockers');
        }
      }

      await connection.query(
        'INSERT INTO parcels (parcel_ID, sender_tel, receiver_tel, courier_ID, status, locker_ID, parcel_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parcel_ID, sender_tel, receiver_tel, courier_ID, status, locker_ID, parcelPassword]
      );

      // Set the selected courier's status to "Busy"
      await connection.query(
        'UPDATE couriers SET status = "Busy" WHERE courier_ID = ?',
        [courier_ID]
      );

      await connection.commit();

      // Send SMS using Twilio
      await twilioClient.messages.create({
        body: `A new parcel ${parcel_ID} has been assigned to you. Your verification code is: ${parcelPassword}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: courierTel
      });

      return NextResponse.json({ parcel_ID, message: 'Parcel created successfully', locker_ID }, { status: 201 });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating parcel:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { parcel_ID, status } = await request.json();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      if (status === 'In Locker') {
        const [availableLockers] = await connection.query<mysql.RowDataPacket[]>(
          'SELECT locker_ID FROM lockers WHERE status = "Available" LIMIT 1'
        );

        if (availableLockers.length > 0) {
          const locker_ID = (availableLockers[0] as Locker).locker_ID;
          await connection.query(
            'UPDATE lockers SET status = "Unavailable" WHERE locker_ID = ?',
            [locker_ID]
          );
          await connection.query(
            'UPDATE parcels SET status = ?, locker_ID = ? WHERE parcel_ID = ?',
            [status, locker_ID, parcel_ID]
          );
        } else {
          throw new Error('No available lockers');
        }
      } else if (status === 'Delivered') {
        await connection.query(
          'UPDATE lockers SET status = "Available" WHERE locker_ID = (SELECT locker_ID FROM parcels WHERE parcel_ID = ?)',
          [parcel_ID]
        );
        await connection.query(
          'UPDATE parcels SET status = ?, locker_ID = NULL WHERE parcel_ID = ?',
          [status, parcel_ID]
        );

        // Set the courier's status back to "Available"
        await connection.query(
          'UPDATE couriers SET status = "Available" WHERE courier_ID = (SELECT courier_ID FROM parcels WHERE parcel_ID = ?)',
          [parcel_ID]
        );
      } else {
        // For 'Processing' status or any other status
        await connection.query(
          'UPDATE parcels SET status = ? WHERE parcel_ID = ?',
          [status, parcel_ID]
        );
      }

      await connection.commit();
      return NextResponse.json({ message: 'Parcel status updated successfully' });
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
