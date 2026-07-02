import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';

export default function NavDropdown({ icon: Icon, label, items }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isActive = items.some((item) => pathname.startsWith(item.path));

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="h-4 w-4" />
        <span className="hidden md:inline">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 min-w-[160px] rounded-xl border border-border bg-card shadow-lg py-1 z-50">
          {items.map((item) => {
            const ItemIcon = item.icon;
            const active = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ItemIcon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}