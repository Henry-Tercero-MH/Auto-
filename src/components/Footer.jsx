export default function Footer() {
  return (
    <footer className="bg-primary text-white py-4 mt-8 shadow-inner">
      <div className="container mx-auto text-center text-sm">
        © {new Date().getFullYear()} DriveBot. Todos los derechos reservados.
      </div>
    </footer>
  );
}
