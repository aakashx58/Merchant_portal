import { Directive, inject, input, TemplateRef } from '@angular/core';

@Directive({ selector: 'ng-template[appCell]' })
export class CellDef {
  readonly key = input.required<string>({ alias: 'appCell' });
  readonly template = inject<TemplateRef<{ $implicit: unknown }>>(TemplateRef);
}
