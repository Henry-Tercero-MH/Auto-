import React from 'react';

export default function Scaner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <h1 className="text-2xl font-bold text-primary mb-6">Bienvenido a DriveBot - Scaner</h1>
      <img
        src="https://media.istockphoto.com/id/2201019036/photo/portrait-of-smiling-interracial-auto-mechanic-scrolling-on-tablet-at-mechanic-workshop.jpg?s=2048x2048&w=is&k=20&c=WceBVc53kkhYNWY0GepYxOveh9tzOL03eVxE2yxS6tA="
        alt="Mecánico sonriente"
        className="rounded-xl shadow-lg max-w-md w-full mb-8"
      />
      <p className="text-gray-600 text-center">Escanea y gestiona tus servicios de taller de forma profesional.</p>
    </div>
  );
}
