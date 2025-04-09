// GraphQL API types that match the expected API response structure
export interface GraphQLResponse<T> {
  data: T;
}

// Menu related types
export interface Menu {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  workflow_id: string | null;
  __typename: string;
  core_dynamic_child_menus?: Menu[];
}

export interface MenusResponse {
  core_core_dynamic_menus: Menu[];
}

export interface MenusWithChildrenResponse {
  core_core_dynamic_menus: Menu[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: string;
  __typename: string;
}

export interface WorkflowResponse {
  core_core_dynamic_workflows: Workflow[];
}

// Constants for API calls
export const DEFAULT_ORGANIZATION_ID = "8c96bdee-09ef-40ce-b1fa-954920e71efe";
export const DEFAULT_USER_ID = "5c065b51-3862-4004-ae96-ca23245aa21e";

export interface FormsListResponse {
  core_core_dynamic_forms: Form[];
}

export interface FormDetailsResponse {
  core_core_dynamic_forms_by_pk: {
    id: string;
    name: string;
    description: string;
    organization_id: string;
    status: string;
    core_dynamic_form_fields: FormField[];
    __typename: string;
  };
}

export interface FormField {
  id: string;
  dynamic_field_id: string;
  dynamic_form_id: string;
  core_dynamic_field: Field;
  __typename: string;
}

export interface Form {
  id: string;
  name: string;
  description: string;
  status: string;
  __typename: string;
}

export interface Field {
  id: string;
  name: string;
  field_type: FieldType;
  description: string | null;
  status: string;
  __typename: string;
  options?: FieldOption[];
  option_values?: any;
  position?: number;
  is_required?: boolean;
  code?: string;
  configuration?: string;
}

export type FieldType = 'TEXT' | 'PARAGRAPH' | 'NUMBER' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'DATE' |
  'INPUT' | 'CACHE' | 'AUDIO_RECORD' | 'SCREEN_RECORD' | 'IMPORT' | 'EXPORT' |
  'QR_SCAN' | 'GPS' | 'CHOOSE' | 'SELECT' | 'SEARCH' | 'FILTER' | 'DASHBOARD' | 'PHOTO';

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface FieldSubmission {
  value: FieldValue;
  name: string;
  field_type: FieldType;
}

export interface FormSubmission {
  formId: string;
  data: Record<string, FieldSubmission>;
  workflowId?: string; // ID của workflow
  menuId?: string; // ID của menu/submenu mà submission này thuộc về
}

// Field value types for form state
export type FieldValue = string | number | boolean | string[] | null;

export interface FormState {
  [fieldId: string]: FieldValue;
}

// Colors for field types
export const fieldTypeColors: Record<FieldType, { bg: string, text: string }> = {
  'TEXT': { bg: 'bg-blue-100', text: 'text-blue-800' },
  'PARAGRAPH': { bg: 'bg-purple-100', text: 'text-purple-800' },
  'NUMBER': { bg: 'bg-green-100', text: 'text-green-800' },
  'SINGLE_CHOICE': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  'MULTI_CHOICE': { bg: 'bg-pink-100', text: 'text-pink-800' },
  'DATE': { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  'INPUT': { bg: 'bg-cyan-100', text: 'text-cyan-800' },
  'CACHE': { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  'AUDIO_RECORD': { bg: 'bg-red-100', text: 'text-red-800' },
  'SCREEN_RECORD': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'IMPORT': { bg: 'bg-lime-100', text: 'text-lime-800' },
  'EXPORT': { bg: 'bg-teal-100', text: 'text-teal-800' },
  'QR_SCAN': { bg: 'bg-violet-100', text: 'text-violet-800' },
  'GPS': { bg: 'bg-amber-100', text: 'text-amber-800' },
  'CHOOSE': { bg: 'bg-rose-100', text: 'text-rose-800' },
  'SELECT': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  'SEARCH': { bg: 'bg-sky-100', text: 'text-sky-800' },
  'FILTER': { bg: 'bg-stone-100', text: 'text-stone-800' },
  'DASHBOARD': { bg: 'bg-slate-100', text: 'text-slate-800' },
  'PHOTO': { bg: 'bg-blue-200', text: 'text-blue-900' }
};

// Mock choices for choice fields
export const mockChoices: FieldOption[] = [
  { id: '1', label: 'Lựa chọn 1', value: '1' },
  { id: '2', label: 'Lựa chọn 2', value: '2' },
  { id: '3', label: 'Lựa chọn 3', value: '3' },
  { id: '4', label: 'Lựa chọn 4', value: '4' }
];

// Submission form types
export interface SubmissionForm {
  id: string;
  submission_data: any;
  workflow_id: string;
  form_id: string;
  __typename: string;
}

export interface SubmissionFormsResponse {
  core_core_submission_forms: SubmissionForm[];
}
