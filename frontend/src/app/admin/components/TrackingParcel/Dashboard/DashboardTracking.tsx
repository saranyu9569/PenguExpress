'use client'

import React, { useEffect, useState } from "react";

interface Parcel {
  parcel_ID: string;
  parcel_sender: string;
  parcel_reciever: string;
  parcel_courier: string;
  status: "Processing" | "In Locker" | "Delivered" | "Waiting";
  lockerNumber?: string;
}

interface ParcelListProps {
  updateParcelStatus: (
    id: string,
    newStatus: Parcel["status"]
  ) => Promise<void>;
}

const ParcelList: React.FC<ParcelListProps> = ({ updateParcelStatus }) => {
  const [parcels, setParcels] = useState<Parcel[]>([]);

  useEffect(() => {
    const fetchParcels = async () => {
      try {
        const response = await fetch("/api/parcels");
        if (response.ok) {
          const data = await response.json();
          setParcels(
            data.filter((parcel: Parcel) => parcel.status !== "Delivered")
          );
        } else {
          console.error("Failed to fetch parcels");
        }
      } catch (error) {
        console.error("Failed to fetch parcels:", error);
      }
    };

    fetchParcels();
  }, []);

  const handleStatusChange = async (
    id: string,
    newStatus: Parcel["status"]
  ) => {
    await updateParcelStatus(id, newStatus);
    const response = await fetch("/api/parcels");
    if (response.ok) {
      const updatedParcels = await response.json();
      setParcels(
        updatedParcels.filter((parcel: Parcel) => parcel.status !== "Delivered")
      );
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
              <th className="p-2 text-left">Sender</th>
              <th className="p-2 text-left">Receiver</th>
              <th className="p-2 text-left">Courier</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Locker</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parcels.map((parcel) => (
              <tr key={parcel.parcel_ID} className="border-b">
                <td className="p-2">{parcel.parcel_ID}</td>
                <td className="p-2">{parcel.parcel_sender}</td>
                <td className="p-2">{parcel.parcel_reciever}</td>
                <td className="p-2">{parcel.parcel_courier}</td>
                <td className="p-2">{parcel.status}</td>
                <td className="p-2">{parcel.lockerNumber || "N/A"}</td>
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

export default ParcelList;
