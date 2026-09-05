/**
 * Minimal allowlist sanitizer for admin-authored rich text (About Us / Policy content) before
 * it's rendered on the public site via dangerouslySetInnerHTML. Only SUPER_ADMIN/ADMIN can write
 * this content (enforced server-side), but it's still rendered to every site visitor, so this is
 * defense in depth against a compromised/malicious admin account, not just a UI nicety.
 */
const ALLOWED_TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'UL', 'OL', 'LI', 'A', 'H2', 'H3', 'DIV', 'SPAN']);

export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Element) => {
    for (const child of [...node.children]) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        child.replaceWith(...child.childNodes);
        continue;
      }
      for (const attr of [...child.attributes]) {
        const name = attr.name.toLowerCase();
        if (name.startsWith('on')) {
          child.removeAttribute(attr.name);
          continue;
        }
        if (name === 'href' || name === 'src') {
          const value = attr.value.trim().toLowerCase();
          if (value.startsWith('javascript:') || value.startsWith('data:')) {
            child.removeAttribute(attr.name);
          }
        } else if (name !== 'href') {
          child.removeAttribute(attr.name);
        }
      }
      if (child.tagName === 'A') {
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
      walk(child);
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
