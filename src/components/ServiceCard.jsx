import { CategoryIcon } from '../data/servicios';

export default function ServiceCard({ title, icon, description }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center gap-2 border border-gray-100 hover:shadow-lg transition-shadow w-full max-w-xs mx-auto">
      <div className="mb-2">
        {typeof icon === 'string' ? (
          <CategoryIcon name={icon} className="w-8 h-8 text-accent" />
        ) : (
          icon
        )}
      </div>
      <h3 className="font-semibold text-lg text-primary mb-1">{title}</h3>
      <p className="text-gray-500 text-sm text-center">{description}</p>
    </div>
  );
}
