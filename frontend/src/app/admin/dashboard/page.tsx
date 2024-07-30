'use client'

import React, { useState } from 'react';
import DashboardAdd from '../components/AddParcel/Dashboard/DashboardAdd';
import DashboardTracking from '../components/TrackingParcel/Dashboard/DashboardTracking';

const Dashboard: React.FC = () => {
  const [parcelsUpdated, setParcelsUpdated] = useState(false);

  const handleParcelCreated = () => {
    setParcelsUpdated(prev => !prev);
  };

  return (
    <div className="bg-gradient-to-r from-[#c9d6ff] to-[#99bddf] min-h-screen p-8 text-black">
      <h1 className="text-3xl font-bold mb-8">PenguExpress Dashboard</h1>
      
      <DashboardAdd onParcelCreated={handleParcelCreated} />
      <DashboardTracking key={parcelsUpdated.toString()} />
    </div>
  );
};

export default Dashboard;