import {
  FieldDescriptor, FormStructure, ProcessedElement, ProcessedSection, RadioLikeGroup, RawElement,
  RawFieldNode, RawGroupNode, RawSectionNode, RawTableHeaderCell, RawTableNode,
  RawTextNode, UnifiedField, UnifiedTable, UnifiedTableCell, UnifiedTableHeaderCell,
  UnifiedTableHeaderRowCell, UnifiedText,
} from './render-model';
import { sanitizeText } from './form-render.utils';
import { isChoiceFieldType, isPlaceholderCheckboxLabel } from './render-tokens';
import { Form } from '../Response/form.model';
import { CustomerData } from '../Response/customer-data.model';

// Pure, framework-agnostic engine: turns a raw V2 form (elements tree + customer
// data) into a flat, depth-tagged structural model plus the baseline values.
// No Angular dependency -> directly unit-testable.
export class FormStructureBuilder {

  build(form: Form, customerData: CustomerData[]): FormStructure {
    const sections = this.processForm(form);
    const customerDataMap = this.buildCustomerDataMap(form, customerData);
    const fieldDescriptors = this.collectDescriptors(sections);
    return {
      metadata: form.metadata,
      formId: form.metadata.formId,
      formInstance: form.metadata.formInstance,
      sections,
      fieldDescriptors,
      initialValues: this.buildInitialValues(fieldDescriptors, customerDataMap),
    };
  }

  // -- Structure: flatten-with-depth -------------------------------------------

  private processForm(form: Form): ProcessedSection[] {
    const sections: ProcessedSection[] = [];
    const preamble: ProcessedElement[] = [];
    const elements = (form.elements || []) as RawElement[];

    // Sections flatten recursively (depth-tagged); non-section elements before
    // any section are collected into an "Introduction" preamble.
    for (const el of elements) {
      if (this.isSection(el)) { this.flattenSection(el, sections, 0); }
      else { preamble.push(...this.processElements([el], '')); }
    }

    if (preamble.length > 0) {
      sections.unshift({ id: 'section-intro', title: 'Introduction', elements: preamble, depth: 0 });
    }
    if (sections.length === 0) {
      sections.push(this.buildSection('section-0', form.metadata.formName, elements, 0));
    }
    return sections;
  }

  // Recursively flattens a section tree into a flat, depth-tagged list (preorder).
  private flattenSection(section: RawSectionNode, out: ProcessedSection[], depth: number, parentTitle?: string): void {
    const ownElements: RawElement[] = [];
    const nestedSections: RawSectionNode[] = [];

    for (const el of section.elements || []) {
      if (this.isSection(el)) { nestedSections.push(el); }
      else { ownElements.push(el); }
    }

    if (ownElements.length > 0 || nestedSections.length > 0) {
      out.push(this.buildSection(`section-${out.length}`, section.title, ownElements, depth, parentTitle));
    }
    for (const nested of nestedSections) {
      this.flattenSection(nested, out, depth + 1, section.title);
    }
  }

  // Builds a section and extracts a leading unlabeled checkbox/radio as the inline control (R8).
  private buildSection(id: string, title: string, rawElements: RawElement[], depth: number, parentTitle?: string): ProcessedSection {
    let elements = this.processElements(rawElements, title);
    let inlineControl: UnifiedField | undefined;

    const first = elements[0];
    if (first && first.kind === 'field-row' && first.fields.length === 1) {
      const f = first.fields[0];
      if (f.isChoice && isPlaceholderCheckboxLabel(f.label)) {
        inlineControl = f;
        elements = elements.slice(1);
      }
    }
    return { id, title, elements, depth, parentTitle, inlineControl };
  }

  // -- Classification: text | field-row | radio-group | table ------------------

  private processElements(rawElements: RawElement[], sectionTitle: string): ProcessedElement[] {
    const elements: ProcessedElement[] = [];
    const { radioFieldNames, fieldsByName } = this.analyzeGroups(rawElements);
    const emitted = new Set<string>();

    for (const el of rawElements) {
      if (this.isText(el)) { elements.push({ kind: 'text', element: this.toUnifiedText(el) }); continue; }
      if (this.isTable(el)) { elements.push({ kind: 'table', table: this.convertTable(el, sectionTitle) }); continue; }
      if (this.isGroup(el)) { elements.push(...this.classifyGroup(el, radioFieldNames, fieldsByName, emitted, sectionTitle)); }
    }
    return elements;
  }

  // One group -> its classified elements (field-rows, radio-groups, inline text).
  private classifyGroup(
    group: RawGroupNode,
    radioFieldNames: Set<string>,
    fieldsByName: Map<string, RawFieldNode[]>,
    emitted: Set<string>,
    sectionTitle: string,
  ): ProcessedElement[] {
    const out: ProcessedElement[] = [];
    let row: UnifiedField[] = [];
    const flushRow = () => { if (row.length) { out.push({ kind: 'field-row', fields: row }); row = []; } };

    for (const child of group.elements || []) {
      if (this.isText(child)) { flushRow(); out.push({ kind: 'text', element: this.toUnifiedText(child) }); continue; }
      if (!this.isField(child) || this.shouldSkipField(child)) { continue; }

      if (radioFieldNames.has(child.fieldName)) {
        // Collapse the radio set once, on first encounter.
        if (!emitted.has(child.fieldName)) {
          emitted.add(child.fieldName);
          out.push({ kind: 'radio-group', group: this.toRadioGroup(child.fieldName, fieldsByName.get(child.fieldName) || []) });
        }
      } else {
        row.push(this.toUnifiedField(child, this.fieldControlKey(child), sectionTitle));
      }
    }
    flushRow();
    return out;
  }

  // Collapse rule: same fieldName + >=2 distinct exportValues + all within ONE group.
  private analyzeGroups(rawElements: RawElement[]): { radioFieldNames: Set<string>; fieldsByName: Map<string, RawFieldNode[]> } {
    const fieldsByName = new Map<string, RawFieldNode[]>();
    const groupIndices = new Map<string, Set<number>>();

    rawElements.forEach((el, groupIdx) => {
      if (!this.isGroup(el)) { return; }
      for (const child of el.elements || []) {
        if (this.isField(child) && isChoiceFieldType(child.fieldType) && child.exportValue) {
          const list = fieldsByName.get(child.fieldName);
          if (list) { list.push(child); } else { fieldsByName.set(child.fieldName, [child]); }
          const groups = groupIndices.get(child.fieldName);
          if (groups) { groups.add(groupIdx); } else { groupIndices.set(child.fieldName, new Set([groupIdx])); }
        }
      }
    });

    const radioFieldNames = new Set<string>();
    for (const [name, fields] of fieldsByName) {
      const uniqueExports = new Set(fields.map(f => f.exportValue));
      const groupCount = groupIndices.get(name)?.size ?? 1;
      if (uniqueExports.size >= 2 && groupCount === 1) { radioFieldNames.add(name); }
    }
    return { radioFieldNames, fieldsByName };
  }

  // -- Converters --------------------------------------------------------------

  private toUnifiedField(f: RawFieldNode, controlKey: string, sectionTitle: string): UnifiedField {
    const isChoice = isChoiceFieldType(f.fieldType);
    const label = sanitizeText(f.label?.text || '');
    return {
      fieldName: f.fieldName,
      fieldType: f.fieldType,
      label,
      displayLabel: isChoice && isPlaceholderCheckboxLabel(label) ? sectionTitle : label,
      isChoice,
      isMultiline: !!f.multiline || (f.relativeHeight ?? 1) > 1,
      altLabel: f.label?.altText,
      description: f.description?.text ? sanitizeText(f.description.text) : undefined,
      exportValue: f.exportValue,
      formatMask: f.formatMask,
      multiline: f.multiline,
      relativeWidth: f.relativeWidth ?? 1,
      relativeHeight: f.relativeHeight ?? 1,
      controlKey,
    };
  }

  private fieldControlKey(f: RawFieldNode): string {
    return isChoiceFieldType(f.fieldType) ? `check-${f.fieldName}` : f.fieldName;
  }

  private toUnifiedText(t: RawTextNode): UnifiedText {
    return {
      text: sanitizeText(t.text || ''),
      style: t.style || 'body',
      relativeWidth: t.relativeWidth ?? 1,
      relativeHeight: t.relativeHeight ?? 1,
    };
  }

  private toRadioGroup(fieldName: string, fields: RawFieldNode[]): RadioLikeGroup {
    return {
      fieldName,
      controlKey: `radio-${fieldName}`,
      options: fields.map(f => ({
        exportValue: f.exportValue || '',
        label: this.firstLine(sanitizeText(f.label?.text || '')),
        description: f.description?.text ? sanitizeText(f.description.text) : undefined,
      })),
    };
  }

  private convertTable(t: RawTableNode, sectionTitle: string): UnifiedTable {
    const header = (t.header || []).map(h => this.convertHeaderCell(h));
    return {
      relativeWidth: t.relativeWidth ?? 1,
      headerRows: this.buildHeaderRows(header),
      rows: (t.rows || []).map((r, ri) => ({ cells: (r.cells || []).map((c, ci) => this.convertCell(c, `r${ri}`, ci, sectionTitle)) })),
      footer: t.footer ? { cells: (t.footer.cells || []).map((c, ci) => this.convertCell(c, 'footer', ci, sectionTitle)) } : undefined,
    };
  }

  // -- Table header layout (colspan/rowspan from the nested header tree) --------

  private buildHeaderRows(header: UnifiedTableHeaderCell[]): UnifiedTableHeaderRowCell[][] {
    const maxDepth = this.headerMaxDepth(header);
    const rows: UnifiedTableHeaderRowCell[][] = Array.from({ length: maxDepth }, () => []);

    const populate = (cells: UnifiedTableHeaderCell[], rowIndex: number) => {
      for (const cell of cells) {
        if (cell.subHeaders && cell.subHeaders.length > 0) {
          rows[rowIndex].push({ text: cell.text, colspan: this.countLeafColumns(cell), rowspan: 1 });
          populate(cell.subHeaders, rowIndex + 1);
        } else {
          rows[rowIndex].push({ text: cell.text, colspan: 1, rowspan: maxDepth - rowIndex, relativeWidth: cell.relativeWidth });
        }
      }
    };
    populate(header, 0);
    return rows;
  }

  private headerMaxDepth(cells: UnifiedTableHeaderCell[], depth = 1): number {
    let max = depth;
    for (const c of cells) { if (c.subHeaders?.length) { max = Math.max(max, this.headerMaxDepth(c.subHeaders, depth + 1)); } }
    return max;
  }

  private countLeafColumns(cell: UnifiedTableHeaderCell): number {
    if (!cell.subHeaders || cell.subHeaders.length === 0) { return 1; }
    return cell.subHeaders.reduce((sum, sub) => sum + this.countLeafColumns(sub), 0);
  }

  private convertHeaderCell(h: RawTableHeaderCell): UnifiedTableHeaderCell {
    return {
      text: sanitizeText(h.text || ''),
      relativeWidth: h.relativeWidth ?? 1,
      subHeaders: h.subHeaders?.map(s => this.convertHeaderCell(s)),
    };
  }

  // Text cells get a unique control key (fieldName may repeat across cells/rows).
  private convertCell(c: RawFieldNode | RawTextNode, rowKey: string, cellIndex: number, sectionTitle: string): UnifiedTableCell {
    if (this.isField(c)) {
      const controlKey = c.fieldType === 'text' ? `text-${c.fieldName}-${rowKey}-c${cellIndex}` : this.fieldControlKey(c);
      return { field: this.toUnifiedField(c, controlKey, sectionTitle) };
    }
    return { text: sanitizeText((c as RawTextNode).text || '') };
  }

  // -- Filtering (reset/signature by name; keeps e.g. SignTitle, signaddr) -----

  private shouldSkipField(f: RawFieldNode): boolean {
    const name = (f.fieldName || '').toLowerCase();
    const label = (f.label?.text || '').toLowerCase();
    if (name.includes('btnreset') || /\breset\b/.test(name)) { return true; }
    if (/signature/.test(name)) { return true; }
    if (/\bsign\b|_sign_|\.sign\.|\.sign$|^sign\./.test(name)) { return true; }
    if (label.includes('signature')) { return true; }
    if (/signdate/.test(name)) { return true; }
    if (/signinitials/.test(name)) { return true; }
    return false;
  }

  // -- Value baseline (customer data -> keyed by controlKey) -------------------

  private buildCustomerDataMap(form: Form, customerData: CustomerData[]): Record<string, string> {
    const match = (customerData || []).find(
      c => c.formId === form.metadata.formId && c.formInstance === form.metadata.formInstance
    );
    const map: Record<string, string> = {};
    (match?.fields || []).forEach(f => { map[f.fieldName] = f.fieldValue; });
    return map;
  }

  // Single traversal of every control: its FormGroup key + original V2 field name.
  private collectDescriptors(sections: ProcessedSection[]): FieldDescriptor[] {
    const descriptors: FieldDescriptor[] = [];
    const addField = (f: UnifiedField) => descriptors.push({ controlKey: f.controlKey, fieldName: f.fieldName });

    for (const section of sections) {
      if (section.inlineControl) { addField(section.inlineControl); }
      for (const el of section.elements) {
        switch (el.kind) {
          case 'field-row': el.fields.forEach(addField); break;
          case 'radio-group': descriptors.push({ controlKey: el.group.controlKey, fieldName: el.group.fieldName }); break;
          case 'table':
            el.table.rows.forEach(r => r.cells.forEach(c => { if (c.field) { addField(c.field); } }));
            el.table.footer?.cells.forEach(c => { if (c.field) { addField(c.field); } });
            break;
          case 'text': break;
        }
      }
    }
    return descriptors;
  }

  // Baseline values derived from the descriptors (no second traversal).
  private buildInitialValues(descriptors: FieldDescriptor[], map: Record<string, string>): Record<string, string> {
    const values: Record<string, string> = {};
    for (const d of descriptors) { values[d.controlKey] = map[d.fieldName] ?? ''; }
    return values;
  }

  // -- Helpers + type guards ---------------------------------------------------

  private firstLine(text: string): string { return (text || '').split('\n')[0].trim(); }
  private isSection(el: RawElement): el is RawSectionNode { return el.type === 'section'; }
  private isText(el: RawElement): el is RawTextNode { return el.type === 'text'; }
  private isGroup(el: RawElement): el is RawGroupNode { return el.type === 'group'; }
  private isTable(el: RawElement): el is RawTableNode { return el.type === 'table'; }
  private isField(el: RawElement): el is RawFieldNode { return 'fieldName' in el && 'fieldType' in el; }
}
