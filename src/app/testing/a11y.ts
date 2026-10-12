/**
 * Lightweight accessibility assertions for component tests (no axe dependency).
 * Returns a list of problems; an empty list means the basics are fine.
 */
export function a11yProblems(root: HTMLElement): string[] {
  const problems: string[] = [];
  const named = (el: Element) =>
    !!(
      el.getAttribute('aria-label') ||
      el.getAttribute('aria-labelledby') ||
      el.textContent?.trim()
    );

  for (const control of Array.from(root.querySelectorAll('input, select, textarea'))) {
    const input = control as HTMLInputElement;
    if (input.type === 'hidden') continue;
    const labelled =
      input.getAttribute('aria-label') ||
      input.getAttribute('aria-labelledby') ||
      input.closest('label') ||
      (input.id && root.querySelector(`label[for="${input.id}"]`)) ||
      input.closest('mat-form-field')?.querySelector('mat-label');
    if (!labelled) problems.push(`form control without a label: ${input.outerHTML.slice(0, 80)}`);
  }

  for (const button of Array.from(root.querySelectorAll('button'))) {
    if (!named(button))
      problems.push(`button without an accessible name: ${button.outerHTML.slice(0, 80)}`);
  }

  for (const link of Array.from(root.querySelectorAll('a[href], a[routerLink]'))) {
    if (!named(link))
      problems.push(`link without an accessible name: ${link.outerHTML.slice(0, 80)}`);
  }

  for (const img of Array.from(root.querySelectorAll('img'))) {
    if (!img.hasAttribute('alt')) problems.push('img without alt');
  }

  return problems;
}
