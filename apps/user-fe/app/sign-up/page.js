'use client'
import { useState } from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const [email, setEmail] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    console.log("Logging in with", { email, password });
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
  <div className="grid grid-cols-2 bg-white shadow-lg rounded-2xl p-8 w-[600px]">
    {/* Left Column - Image */}
    <div className="flex justify-center items-center border-r pr-4">
      <span className="text-lg font-bold">Image</span>
    </div>

    {/* Right Column - Login Form */}
    <div className="pl-4">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-semibold">Hello</h2>
        <p className="text-gray-500">Please create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
        <input
          type="text"
          placeholder="Username"
          value={password}
          onChange={(e) => setUser(e.target.value)}
          required
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border rounded-lg px-4 py-2 w-full bg-gray-100"
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-gray-950 text-white rounded-lg py-2 w-full">
          Login
        </button>
      </form>
    </div>
  </div>
</div>

  );
}
