"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userName, password }),
      });

      if (response.ok) {
        router.push("/admin/dashboard");
      } else {
        const data = await response.json();
        setError(data.message);
      }
    } catch (error) {
      console.error(error);
      setError("An unexpected error occurred.");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left container - hidden on small screens */}
      <div className="hidden md:block w-1/2 bg-gradient-to-b from-[#c9d6ff] to-[#99bddf]"></div>

      {/* Right container - full width on small screens, half width on md and up */}
      <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex flex-col justify-center text-black">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-2xl md:text-3xl font-semibold mb-4 md:mb-6">PenguExpress Login</h1>
          <h2 className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8">
            Welcome to PenguExpress
          </h2>
          {error && (
            <div className="mb-4 text-red-600 text-center">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="userName"
                className="block text-sm font-medium text-gray-700"
              >
                User&apos;s name
              </label>
              <input
                id="userName"
                name="userName"
                type="text"
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}