'use client'

import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';

interface CreateParcelFormProps {
  onParcelCreated: () => void;
}

interface Courier {
  courier_ID: string;
  courier_name: string;
}

interface Locker {
  locker_ID: number;
  status: 'Available' | 'Unavailable';
}

const DashboardAdd: React.FC<CreateParcelFormProps> = ({ onParcelCreated }) => {
  const [newParcel, setNewParcel] = useState({
    sender_tel: '',
    receiver_tel: '',
    courier_ID: '',
    status: 'Processing' as 'Processing' | 'In Locker' | 'Delivered',
    locker_ID: ''
  });

  const [availableLockers, setAvailableLockers] = useState<Locker[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([]);

  useEffect(() => {
    fetchAvailableLockers();
    fetchAvailableCouriers();
  }, []);

  const fetchAvailableLockers = async () => {
    try {
      const response = await fetch('/api/lockers');
      if (response.ok) {
        const lockers = await response.json();
        setAvailableLockers(lockers);
      }
    } catch (error) {
      console.error('Failed to fetch available lockers:', error);
    }
  };

  const fetchAvailableCouriers = async () => {
    try {
      const response = await fetch("/api/parcels?action=availableCouriers");
      if (response.ok) {
        const data: Courier[] = await response.json();
        setAvailableCouriers(data);
      } else {
        console.error("Failed to fetch available couriers");
      }
    } catch (error) {
      console.error("Failed to fetch available couriers:", error);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewParcel(prev => ({ ...prev, [name]: value }));
  };

  const createParcel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/parcels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newParcel)
      });
  
      if (response.ok) {
        const result = await response.json();
        console.log('Created parcel with ID:', result.parcel_ID);
        setNewParcel({
          sender_tel: '',
          receiver_tel: '',
          courier_ID: '',
          status: 'Processing',
          locker_ID: ''
        });
        onParcelCreated();
        fetchAvailableLockers(); // Refresh available lockers
        alert("Parcel created successfully");
      } else {
        console.error('Failed to create parcel');
      }
    } catch (error) {
      console.error('Failed to create parcel:', error);
    }
  };

  return (
    <form onSubmit={createParcel} className="mb-8 bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Add New Parcel</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="tel"
          name="sender_tel"
          value={newParcel.sender_tel}
          onChange={handleInputChange}
          placeholder="Sender Telephone"
          className="border p-2 rounded"
          required
        />
        <input
          type="tel"
          name="receiver_tel"
          value={newParcel.receiver_tel}
          onChange={handleInputChange}
          placeholder="Receiver Telephone"
          className="border p-2 rounded"
          required
        />
        <select
          name="courier_ID"
          value={newParcel.courier_ID}
          onChange={handleInputChange}
          className="border p-2 rounded"
          required
        >
          <option value="">Select Courier</option>
          {availableCouriers.map(courier => (
            <option key={courier.courier_ID} value={courier.courier_ID}>
              {courier.courier_ID}
            </option>
          ))}
        </select>
        <select
          name="status"
          value={newParcel.status}
          onChange={handleInputChange}
          className="border p-2 rounded"
          required
        >
          <option value="Processing">Processing</option>
          <option value="In Locker">In Locker</option>
          <option value="Delivered">Delivered</option>
        </select>
        {newParcel.status === 'In Locker' && (
          <select
            name="locker_ID"
            value={newParcel.locker_ID}
            onChange={handleInputChange}
            className="border p-2 rounded"
            required
          >
            <option value="">Select a locker</option>
            {availableLockers.map(locker => (
              <option key={locker.locker_ID} value={locker.locker_ID}>
                Locker {locker.locker_ID}
              </option>
            ))}
          </select>
        )}
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Add Parcel
        </button>
      </div>
    </form>
  );
};

export default DashboardAdd;