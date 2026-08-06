import { FormMetadata } from '../Response/form-metadata.model';

// Text style roles (R2) — mirrors the V2 contract's text/label styles.
export type TextStyle =
  | 'header-1' | 'header-2' | 'header-3'
  | 'body' | 'emphasis' | 'legal' | 'footnote';

// ── Raw V2 element nodes (shape of Form.elements; discriminated by `type`) ────
export interface RawLabel {
  text: string; altText?: string; style?: string;
  relativeWidth?: number; relativeHeight?: number;
}
export interface RawFieldNode {
  type?: 'field';
  fieldType: 'text' | 'checkbox' | 'radio';
  fieldName: string;
  label: RawLabel;
  description?: { text: string; style?: string };
  exportValue?: string;
  formatMask?: string;
  multiline?: boolean;
  relativeWidth: number;
  relativeHeight: number;
  _formFieldId?: number;
}
export interface RawTextNode {
  type: 'text'; text: string; style: string;
  relativeWidth: number; relativeHeight: number;
}
export interface RawGroupNode { type: 'group'; elements: Array<RawFieldNode | RawTextNode>; }
export interface RawSectionNode { type: 'section'; title: string; elements: RawElement[]; }
export interface RawTableHeaderCell {
  type?: 'text'; text: string; relativeWidth: number; subHeaders?: RawTableHeaderCell[];
}
export interface RawTableNode {
  type: 'table';
  relativeWidth: number;
  header: RawTableHeaderCell[];
  rows: Array<{ relativeHeight?: number; cells: Array<RawFieldNode | RawTextNode> }>;
  footer?: { relativeHeight?: number; cells: Array<RawFieldNode | RawTextNode> };
}
export type RawElement = RawSectionNode | RawGroupNode | RawFieldNode | RawTextNode | RawTableNode;

// ── Unified render-ready types (produced by FormStructureBuilder) ─────────────
export interface UnifiedField {
  fieldName: string;
  fieldType: 'text' | 'checkbox' | 'radio';
  label: string;            // sanitized original label
  displayLabel: string;     // effective label (placeholder choice -> section title)
  isChoice: boolean;        // checkbox | radio (computed once)
  isMultiline: boolean;     // multiline flag || relativeHeight > 1
  altLabel?: string;
  description?: string;
  exportValue?: string;
  formatMask?: string;
  multiline?: boolean;
  relativeWidth: number;
  relativeHeight: number;
  // Reactive Forms control key (single source for binding + serialization):
  //   text → fieldName; checkbox/radio → `check-${fieldName}`; table text cell → `text-${fieldName}-r#-c#`
  controlKey: string;
}
export interface UnifiedText {
  text: string; style: TextStyle | string;
  relativeWidth: number; relativeHeight: number;
}
export interface UnifiedTableHeaderCell {
  text: string; relativeWidth: number; subHeaders?: UnifiedTableHeaderCell[];
}
export interface UnifiedTableCell { text?: string; field?: UnifiedField; }
// Header cell already laid out for a multi-row <thead> (handles nested headers).
export interface UnifiedTableHeaderRowCell {
  text: string; colspan: number; rowspan: number; relativeWidth?: number;   // width only on leaf cells
}
export interface UnifiedTable {
  relativeWidth: number;
  headerRows: UnifiedTableHeaderRowCell[][];   // precomputed thead matrix (colspan/rowspan)
  rows: Array<{ cells: UnifiedTableCell[] }>;
  footer?: { cells: UnifiedTableCell[] };
}
export interface RadioLikeGroup {
  fieldName: string;
  controlKey: string;   // `radio-${fieldName}`
  options: Array<{ exportValue: string; label: string; description?: string }>;
}

// ── Classified element (discriminated by `kind`) ──────────────────────────────
export type ProcessedElement =
  | { kind: 'text'; element: UnifiedText }
  | { kind: 'field-row'; fields: UnifiedField[] }
  | { kind: 'radio-group'; group: RadioLikeGroup }
  | { kind: 'table'; table: UnifiedTable };

// ── Section (flattened, depth-tagged) ─────────────────────────────────────────
export interface ProcessedSection {
  id: string;          // stable key, e.g. "section-0"
  title: string;
  elements: ProcessedElement[];
  depth: number;       // 0 = top-level; visual clamp at 3 (rendering concern)
  parentTitle?: string;
  inlineControl?: UnifiedField;   // R8: leading unlabeled checkbox/radio shown next to the title
}

// ── Serialization descriptor: maps a Reactive Form control back to the original
//    V2 field name. Built once by the structure builder (single source of the
//    controlKey convention); consumed by Save/Print to serialize current values.
export interface FieldDescriptor {
  controlKey: string;   // key in the Reactive FormGroup
  fieldName: string;    // original V2 field name sent to the backend
}

// ── Framework-agnostic structural model (no Angular). The Angular value model
//    (RenderedForm, with the FormGroup) is layered on top in FormRenderService.
export interface FormStructure {
  metadata: FormMetadata;
  formId: string;
  formInstance: number;
  sections: ProcessedSection[];
  fieldDescriptors: FieldDescriptor[];      // flat controlKey→fieldName map (Save/Print)
  initialValues: Record<string, string>;    // baseline keyed by controlKey (for Reset)
}
