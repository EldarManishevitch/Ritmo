import { useEffect } from 'react';

export default function SEOHead({ title, description, ogImage, ogUrl }) {
  useEffect(() => {
    document.title = title;

    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement('meta');
      desc.name = 'description';
      document.head.appendChild(desc);
    }
    desc.content = description;

    const setOg = (prop, val) => {
      let el = document.querySelector(`meta[property="${prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', prop);
        document.head.appendChild(el);
      }
      el.content = val;
    };
    setOg('og:title', title);
    setOg('og:description', description);
    setOg('og:type', 'website');
    if (ogImage) setOg('og:image', ogImage);
    if (ogUrl) setOg('og:url', ogUrl);
  }, [title, description, ogImage, ogUrl]);

  return null;
}