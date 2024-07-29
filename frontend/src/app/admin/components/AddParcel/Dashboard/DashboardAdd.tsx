'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react';

interface CreateParcelFormProps {
  onParcelCreated: () => void;
}

const CreateParcelForm: React.FC<CreateParcelFormProps> = ({ onParcelCreated }) => {
  const [newParcel, setNewParcel] = useState({
    parcel_sender: '',
    parcel_reciever: '',
    parcel_courier: '',
    statusName: 'Processing' // Default status
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewParcel(prev => ({ ...prev, [name]: value }));
  };

  const createParcel = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Convert weight and shipping_cost to numbers
    const parcelData = {
      ...newParcel,
    };

    try {
      const response = await fetch('/api/parcels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parcelData)
      });

      if (response.ok) {
        setNewParcel({

          parcel_sender: '',
          parcel_reciever: '',
          parcel_courier: '',
          statusName: 'Processing'
        });
        onParcelCreated(); // Notify parent component to refresh the list
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
          type="text"
          name="parcel_sender"
          value={newParcel.parcel_sender}
          onChange={handleInputChange}
          placeholder="Sender"
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="parcel_reciever"
          value={newParcel.parcel_reciever}
          onChange={handleInputChange}
          placeholder="Receiver"
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="parcel_courier"
          value={newParcel.parcel_courier}
          onChange={handleInputChange}
          placeholder="Courier"
          className="border p-2 rounded"
          required
        />
        <select
          name="statusName"
          value={newParcel.statusName}
          onChange={handleInputChange}
          className="border p-2 rounded"
          required
        >
          <option value="Processing">Processing</option>
          <option value="Waiting">Waiting</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
          Add Parcel
        </button>
      </div>
    </form>
  );
};

export default CreateParcelForm;
