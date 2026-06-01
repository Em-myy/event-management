type propsType = {
  label: string;
  children: React.ReactNode;
  icon: React.ReactNode;
  action: React.ReactNode;
};

const Field = ({ icon, label, action, children }: propsType) => {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5 tracking-wide uppercase">
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-slate-400">{icon}</span>
        {children}
        {action && <span className="absolute right-3">{action}</span>}
      </div>
    </div>
  );
};

export default Field;
