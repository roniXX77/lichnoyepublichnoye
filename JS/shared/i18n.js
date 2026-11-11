/* UI strings have one catalog; missing literary translations retain their original text. */
(() => {
  const key = 'personal-public:language';
  let current = 'en';
  try { current = localStorage.getItem(key) === 'ru' ? 'ru' : 'en'; } catch {}
  const catalog = window.SiteTranslations || {};
  const normalize = value => value.normalize('NFC').replace(/\s+/g, ' ').trim();
  const english = new Map(Object.entries(catalog).map(([ru, en]) => [normalize(ru), en]));
  const russian = new Map(Object.entries(catalog).map(([ru, en]) => [normalize(en), ru]));
  const translate = value => (current === 'en' ? english : russian).get(normalize(value)) || value;
  const assetRoot = new URL('../../', document.currentScript.src);
  window.SiteLanguage = { current, translate, contentURL: name => new URL(`content/${current}/${name}`, assetRoot).href };
  function apply(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement?.closest('script,style,textarea,[data-no-translate]')) return;
      const next = translate(root.nodeValue);
      if (next !== root.nodeValue) root.nodeValue = next;
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    for (const attr of ['placeholder', 'aria-label', 'title']) {
      if (root.hasAttribute(attr)) root.setAttribute(attr, translate(root.getAttribute(attr)));
    }
    for (const child of root.childNodes) apply(child);
  }
  document.addEventListener('DOMContentLoaded', () => {
    document.documentElement.lang = current;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'siteUtility siteLanguage';
    button.dataset.noTranslate = '';
    button.innerHTML = `<span class="languageOption ${current === 'en' ? 'isCurrent' : ''}">EN</span><span class="languageDivider" aria-hidden="true"></span><span class="languageOption ${current === 'ru' ? 'isCurrent' : ''}">RU</span>`;
    button.setAttribute('aria-label', current === 'en' ? 'Switch to Russian' : 'Переключить на английский');
    button.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('site:before-language-change'));
      try { localStorage.setItem(key, current === 'en' ? 'ru' : 'en'); } catch {}
      location.reload();
    });
    document.body.append(button);
    apply(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === 'characterData') apply(record.target);
        else for (const node of record.addedNodes) apply(node);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
})();
