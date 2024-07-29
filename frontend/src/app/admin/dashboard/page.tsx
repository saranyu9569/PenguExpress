'use client'

import React from 'react';
import CreateParcelForm from '../components/AddParcel/Dashboard/DashboardAdd';
import ParcelList from '../components/TrackingParcel/Dashboard/DashboardTracking';

const Dashboard: React.FC = () => {
  const [parcelsUpdated, setParcelsUpdated] = React.useState(false);

  const handleParcelCreated = () => {
    setParcelsUpdated(!parcelsUpdated);
  };

  const updateParcelStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/parcels/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
    } catch (error) {
      console.error('Failed to update parcel status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 text-black">
      <h1 className="text-3xl font-bold mb-8">PenguExpress Dashboard</h1>
      
      <CreateParcelForm onParcelCreated={handleParcelCreated} />
      <ParcelList updateParcelStatus={updateParcelStatus} />
    </div>
  );
};

export default Dashboard;
