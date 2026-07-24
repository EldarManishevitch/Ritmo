import { useEffect } from 'react';

export default function SEOHead({ title, description, ogImage, ogUrl, canonical }) {
  useEffect(() => {
    document.title = title;

    // Canonical URL: explicit prop wins, otherwise derive from the current pathname
    // (strips query strings — e.g. ?tab=quiz on song pages — so each URL consolidates to one canonical).
    const canonicalUrl =
      canonical || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '');

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
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    if (canonicalUrl) canonicalLink.href = canonicalUrl;

    setOg('og:title', title);
    setOg('og:description', description);
    setOg('og:type', 'website');
    if (ogImage) setOg('og:image', ogImage);
    if (ogUrl || canonicalUrl) setOg('og:url', ogUrl || canonicalUrl);
  }, [title, description, ogImage, ogUrl, canonical]);

  return null;
}