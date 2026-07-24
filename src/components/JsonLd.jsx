import { useEffect, useRef } from 'react';

/**
 * Injects a JSON-LD <script type="application/ld+json"> block into <head>.
 * Creates the node once (keyed by `id`), updates its content when `data` changes,
 * and removes it on unmount so stale structured data doesn't leak across SPA navigations.
 */
export default function JsonLd({ data, id = 'default' }) {
  const scriptId = `jsonld-${id}`;
  const elRef = useRef(null);

  useEffect(() => {
    let el = document.getElementById(scriptId);
    if (!el) {
      el = document.createElement('script');
      el.id = scriptId;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    elRef.current = el;
    return () => {
      const node = document.getElementById(scriptId);
      if (node && node.parentNode) node.parentNode.removeChild(node);
    };
  }, [scriptId]);

  useEffect(() => {
    if (elRef.current) {
      elRef.current.textContent = JSON.stringify(data);
    }
  }, [data]);

  return null;
}