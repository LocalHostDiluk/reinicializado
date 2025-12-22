export const DashboardPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Sección Hero con fondo púrpura */}
      <div className="relative h-[350px] overflow-hidden -mt-16">
        {/* Fondo púrpura base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4338ca] via-[#7c3aed] to-[#a855f7]" />

        {/* Círculos decorativos */}
        <div
          className="absolute -top-20 right-20 w-[500px] h-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(196, 181, 253, 0.4) 0%, rgba(167, 139, 250, 0.2) 40%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div
          className="absolute top-40 right-60 w-[380px] h-[380px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(233, 213, 255, 0.35) 0%, rgba(196, 181, 253, 0.15) 50%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        <div
          className="absolute top-28 left-20 w-[420px] h-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(199, 210, 254, 0.3) 0%, rgba(165, 180, 252, 0.15) 50%, transparent 70%)",
            filter: "blur(55px)",
          }}
        />

        <div
          className="absolute top-10 left-1/2 w-[300px] h-[300px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(221, 214, 254, 0.25) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        <div
          className="absolute -top-32 -left-20 w-[450px] h-[450px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(165, 180, 252, 0.25) 0%, rgba(129, 140, 248, 0.1) 50%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Resto del contenido con fondo blanco */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <p className="text-slate-600">Próximas secciones aquí...</p>
        </div>
      </div>
    </div>
  );
};
