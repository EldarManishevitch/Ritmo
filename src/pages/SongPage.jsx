import React from 'react';
import { useParams } from 'react-router-dom';

export default function SongPage() {
  const { id } = useParams();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FBF9F6]">
      <h1 className="text-2xl font-bold text-[#2C2A29]">SongPage {id}</h1>
    </div>
  );
}