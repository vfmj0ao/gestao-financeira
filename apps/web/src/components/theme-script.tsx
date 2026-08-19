export function ThemeScript() {
  const code = `(function(){try{var p=JSON.parse(localStorage.getItem('gf_prefs')||'{}');var t=p.theme||'system';var dark=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(dark)r.classList.add('dark');if(p.contrast==='high')r.setAttribute('data-contrast','high');if(p.fontScale)r.style.fontSize=String(p.fontScale)+'%';if(p.reduceMotion==='always')r.setAttribute('data-reduce-motion','always');if(p.underlineLinks)r.setAttribute('data-underline-links','on');if(p.comfortableReading)r.setAttribute('data-reading','comfortable');if(p.plainBackground)r.setAttribute('data-plain-bg','on');}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
