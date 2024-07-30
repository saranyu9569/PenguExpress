'use client'

import React, { useEffect, useState } from "react";

interface Parcel {
  parcel_ID: string;
  sender_tel: string;
  receiver_tel: string;
  courier_ID: string;
  status: "Processing" | "In Locker" | "Delivered";
  locker_ID: number | null;
}

const DashboardTracking: React.FC = () => {
  const [parcels, setParcels] = useState<Parcel[]>([]);

  useEffect(() => {
    fetchParcels();
  }, []);

  const fetchParcels = async () => {
    try {
      const response = await fetch("/api/parcels");
      if (response.ok) {
        const data: Parcel[] = await response.json();
        setParcels(data);
      } else {
        console.error("Failed to fetch parcels");
      }
    } catch (error) {
      console.error("Failed to fetch parcels:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: Parcel["status"]) => {
    if (newStatus === "Delivered") {
      const confirmed = window.confirm("Are you sure you want to mark this parcel as delivered? An SMS will be sent to the courier.");
      if (!confirmed) return;
    }

    try {
      const response = await fetch('/api/parcels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parcel_ID: id, status: newStatus }),
      });

      if (response.ok) {
        await fetchParcels();
        if (newStatus === "Delivered") {
          alert("Parcel marked as delivered. An SMS has been sent to the courier with a verification code.");
        }
      } else {
        console.error("Failed to update parcel status");
      }
    } catch (error) {
      console.error("Failed to update parcel status:", error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Parcels</h2>
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Parcel ID</th>
              <th className="p-2 text-left">Sender Tel</th>
              <th className="p-2 text-left">Receiver Tel</th>
              <th className="p-2 text-left">Courier ID</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Locker ID</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => (
              <tr key={parcel.parcel_ID} className="border-b">
                <td className="p-2">{parcel.parcel_ID}</td>
                <td className="p-2">{parcel.sender_tel}</td>
                <td className="p-2">{parcel.receiver_tel}</td>
                <td className="p-2">{parcel.courier_ID}</td>
                <td className="p-2">{parcel.status}</td>
                <td className="p-2">{parcel.locker_ID || "N/A"}</td>
                <td className="p-2">
                  <select
                    value={parcel.status}
                    onChange={(e) =>
                      handleStatusChange(
                        parcel.parcel_ID,
                        e.target.value as Parcel["status"]
                      )
                    }
                    className="border p-1 rounded"
                  >
                    <option value="Processing">Processing</option>
                    <option value="In Locker">In Locker</option>
                    <option value="Delivered">Delivered</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardTracking;