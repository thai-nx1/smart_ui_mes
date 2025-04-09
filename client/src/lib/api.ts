import { 
  GraphQLResponse, 
  FormsListResponse, 
  FormDetailsResponse, 
  FormSubmission,
  MenusResponse,
  MenusWithChildrenResponse,
  WorkflowResponse,
  SubmissionFormsResponse,
  DEFAULT_ORGANIZATION_ID,
  DEFAULT_USER_ID
} from './types';

// Dựa vào kiểm tra schema, backend đã hoạt động và có các trường cần thiết
const GRAPHQL_ENDPOINT = 'https://delicate-herring-66.hasura.app/v1/graphql';
// Sử dụng token xác thực
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mbyI6eyJ1c2VyVHlwZSI6IlNZU1RFTV9VU0VSIiwidXNlcklkIjoiOTViZDhhMTMtOTE0Zi00ZDAyLTg3ZTMtMGMyNjIyYjg4MmFlIiwic2VydmljZUlkIjoiZTQ2NDU5YzItZTkxMy00MGMxLTgzODMtOGY5YmYzZTdhZGEwIiwib3JnYW5pemF0aW9uSWQiOiJhOWU5ODczNC1lNWQyLTQ4NTEtODRmMy01ZjFjOWE5Y2QyYTciLCJidXNpbmVzc1JvbGVJZHMiOlsiYzk0MGU2MjgtNmFmZC00MzRhLTgwZjMtZGJkNjdiN2ZiNGEyIl19LCJpYXQiOjE3NDMzOTg2OTAsImV4cCI6MjA1ODc1ODY5MH0.RYMF__ddVq4T6CWCNfM6sD0LHr_OpvVvJgoKW5zAhgQ';
console.log('Using GraphQL endpoint:', GRAPHQL_ENDPOINT);

/**
 * Execute a GraphQL query
 */
export async function executeGraphQLQuery<T>(query: string, variables?: Record<string, any>): Promise<T> {
  try {
    console.log('Executing GraphQL query with variables:', variables);
    
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}` // Thêm header xác thực
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('GraphQL result:', result);

    if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors.map((e: any) => e.message).join('\n'));
    }

    return result as T;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

/**
 * Tạo mới một trường (field)
 */
export async function createField(field: {
  name: string;
  field_type: string;
  description?: string;
  organization_id: string;
  status?: string;
}): Promise<GraphQLResponse<any>> {
  const query = `
    mutation CreateField($field: core_core_dynamic_fields_insert_input!) {
      insert_core_core_dynamic_fields_one(object: $field) {
        id
        name
        field_type
        description
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery(query, { field });
}

/**
 * Cập nhật thông tin trường (field)
 */
export async function updateField(
  fieldId: string, 
  updates: {
    name?: string;
    description?: string;
    status?: string;
  }
): Promise<GraphQLResponse<any>> {
  const query = `
    mutation UpdateField($fieldId: uuid!, $updates: core_core_dynamic_fields_set_input!) {
      update_core_core_dynamic_fields_by_pk(
        pk_columns: { id: $fieldId }, 
        _set: $updates
      ) {
        id
        name
        field_type
        description
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery(query, { fieldId, updates });
}

/**
 * Xóa một trường (field) khỏi một form cụ thể
 */
export async function removeFieldFromForm(formFieldId: string): Promise<GraphQLResponse<any>> {
  const query = `
    mutation RemoveFieldFromForm($formFieldId: uuid!) {
      delete_core_core_dynamic_form_fields_by_pk(id: $formFieldId) {
        id
        dynamic_field_id
        dynamic_form_id
      }
    }
  `;

  return executeGraphQLQuery(query, { formFieldId });
}

/**
 * Đọc thông tin chi tiết của một trường (field)
 */
export async function fetchFieldDetails(fieldId: string): Promise<GraphQLResponse<any>> {
  const query = `
    query GetFieldDetails($fieldId: uuid!) {
      core_core_dynamic_fields_by_pk(id: $fieldId) {
        id
        name
        field_type
        description
        configuration
        organization_id
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery(query, { fieldId });
}

/**
 * Fetch all forms - Deprecated, use fetchMenuForms instead
 * This function is now disabled as per user request
 */
export async function fetchForms(limit = 20, offset = 0): Promise<GraphQLResponse<FormsListResponse>> {
  console.warn('fetchForms is deprecated and disabled. Use fetchMenuForms instead.');
  return Promise.resolve({
    data: {
      core_core_dynamic_forms: []
    }
  } as GraphQLResponse<FormsListResponse>);
}

/**
 * Fetch forms by menu ID and form type (CREATE/EDIT/VIEW)
 */
export async function fetchMenuForms(menuId: string, formType: 'CREATE' | 'EDIT' | 'VIEW'): Promise<GraphQLResponse<any>> {
  // Sử dụng đúng tên field theo query mẫu bạn cung cấp
  const query = `
    query GetFormsByMenu($menuId: uuid!, $formType: String!) {
      core_core_dynamic_menu_forms(where: {menu_id: {_eq: $menuId}, form_type: {_eq: $formType}, deleted_at: {_is_null: true}}) {
        id
        form_type
        form_id
        menu_id
        core_dynamic_form {
          id
          name
          code
          core_dynamic_form_fields {
            id
            is_required
            position
            core_dynamic_field {
              id
              code
              field_type
              configuration
              description
              name
              status
              option_values
            }
          }
        }
      }
    }
  `;

  // Chỉ sử dụng các tham số cần thiết theo yêu cầu
  const variables = {
    menuId,
    formType
  };

  console.log("Fetching menu forms with:", variables);
  return executeGraphQLQuery(query, variables);
}

/**
 * Fetch form fields by form ID
 */
export async function fetchFormFields(formId: string): Promise<GraphQLResponse<FormDetailsResponse>> {
  // Sử dụng đúng format truy vấn GraphQL từ mẫu được cung cấp
  const query = `
    query FormDetail($id: uuid!) {
      core_core_dynamic_forms_by_pk(id: $id) {
        id
        name
        description
        organization_id
        status
        core_dynamic_form_fields {
          id
          dynamic_field_id
          dynamic_form_id
          core_dynamic_field {
            id
            name
            description
            field_type
            configuration
            organization_id
            status
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `;

  console.log("Fetching form details with ID:", formId);
  return executeGraphQLQuery<GraphQLResponse<FormDetailsResponse>>(query, { id: formId });
}

/**
 * Submit form data using GraphQL mutation
 */
export async function submitFormData(submission: FormSubmission & { workflowId?: string, menuId?: string, formId?: string }): Promise<GraphQLResponse<any>> {
  // Áp dụng logic cho tất cả submenu, giống như cách xử lý cho submenu khiếu nại (ID: "ss")
  const query = `
    mutation InsertMenuRecord($menuId: String!, $userId: String!, $organizationId: String!, $title: String!, $submissionData: JSON) {
insert_menu_record(args: {
menu_id: $menuId,
user_id: $userId,
organization_id: $organizationId,
title: $title,
submission_data: $submissionData
}) {
id
code
menu_id
organization_id
user_id
workflow_id
data
}
}
  `;

  // Biến đổi dữ liệu cho phù hợp với định dạng mutation mới
  const submissionFields = Object.entries(submission.data).map(([fieldId, fieldData]) => {
    // fieldData giờ đây là một đối tượng có chứa value, name, và field_type
    return {
      id: fieldId,
      name: fieldData.name,
      field_type: fieldData.field_type,
      value: fieldData.value
    };
  });

  // Tạo tiêu đề từ dữ liệu đã nhập hoặc sử dụng tiêu đề mặc định
  // Tìm field có tên hoặc field_type là TEXT để dùng làm tiêu đề
  let title = "Khiếu nại mới";
  const titleField = Object.values(submission.data).find(field => 
    field.name.toLowerCase().includes("tiêu đề") || 
    field.name.toLowerCase().includes("title")
  );
  
  if (titleField && titleField.value) {
    title = String(titleField.value);
  }

  // QUAN TRỌNG: Cần sử dụng ID của submenu thay vì workflowId
  // Theo yêu cầu, cần sử dụng menuId từ tham số truyền vào
  const menuId = submission.menuId || submission.workflowId || "7ffe9691-7f9b-430d-a945-16e0d9b173c4";
  
  console.log("Using menuId for submission:", menuId);
  
  // Nếu có formId từ tham số, sử dụng nó
  const formId = submission.formId;

  if (formId) {
    console.log("Using formId for submission:", formId);
  }

  // Sử dụng các ID mặc định từ types.ts
  const variables = {
    menuId: menuId,
    userId: DEFAULT_USER_ID, // Sử dụng hằng số từ types.ts
    organizationId: DEFAULT_ORGANIZATION_ID, // Sử dụng hằng số từ types.ts
    title: title,
    submissionData: submissionFields
  };

  console.log("Submitting form with data:", variables);
  return executeGraphQLQuery(query, variables);
}

/**
 * Fetch main menus (parent menus)
 */
export async function fetchMainMenus(): Promise<GraphQLResponse<MenusWithChildrenResponse>> {
  const query = `
    query GetMainMenus {
      core_core_dynamic_menus(
        where: {parent_id: {_is_null: true}, deleted_at: {_is_null: true}}
        limit: 20
      ) {
        id
        code
        name
        workflow_id
      }
    }
  `;

  return executeGraphQLQuery<GraphQLResponse<MenusWithChildrenResponse>>(query);
}

/**
 * Fetch all menus 
 */
export async function fetchAllMenus(): Promise<GraphQLResponse<MenusResponse>> {
  const query = `
    query GetAllMenus {
      core_core_dynamic_menus(where: {deleted_at: {_is_null: true}}) {
        id
        code
        name
        parent_id
        workflow_id
        description
      }
    }
  `;

  console.log("Fetching all menus from API...");
  const response = await executeGraphQLQuery<GraphQLResponse<MenusResponse>>(query);
  console.log("Successfully fetched menus:", response.data?.core_core_dynamic_menus?.length || 0, "items");
  return response;
}

/**
 * Fetch workflows related to a specific menu
 */
export async function fetchMenuWorkflows(menuId: string): Promise<GraphQLResponse<WorkflowResponse>> {
  const query = `
    query GetWorkflowsByMenu($menuId: uuid!) {
      core_core_dynamic_workflows(
        where: {menu_id: {_eq: $menuId}, deleted_at: {_is_null: true}}
      ) {
        id
        name
        description
        status
        __typename
      }
    }
  `;

  return executeGraphQLQuery<GraphQLResponse<WorkflowResponse>>(query, { menuId });
}

/**
 * Fetch submission forms for a specific workflow
 */
export async function fetchSubmissionForms(workflowId: string): Promise<GraphQLResponse<SubmissionFormsResponse>> {
  const query = `
    query GetSubmissionForms($workflowId: uuid!, $organizationId: uuid!, $userId: uuid!) {
      core_core_submission_forms(where: {
        workflow_id: {_eq: $workflowId},
        organization_id: {_eq: $organizationId},
        user_id: {_eq: $userId}
      }) {
        id
        submission_data
        workflow_id
        form_id
        __typename
      }
    }
  `;
  
  const variables = {
    workflowId,
    organizationId: DEFAULT_ORGANIZATION_ID,
    userId: DEFAULT_USER_ID
  };

  return executeGraphQLQuery<GraphQLResponse<SubmissionFormsResponse>>(query, variables);
}

/**
 * Update submission form data
 */
export async function updateSubmissionForm(submissionId: string, updatedData: any[]): Promise<GraphQLResponse<any>> {
  const query = `
    mutation UpdateMenuRecord($recordId: uuid!, $data: jsonb!) {
      update_core_core_menu_records_by_pk(
        pk_columns: { id: $recordId },
        _set: { data: $data }
      ) {
        id
        data
        title
        __typename
      }
    }
  `;

  const variables = {
    recordId: submissionId,
    data: updatedData
  };

  return executeGraphQLQuery(query, variables);
}

/**
 * Fetch menu records by menu ID
 */
export async function fetchMenuRecords(
  menuId: string, 
  limit: number | null = null, 
  offset: number | null = null,
  recordId?: string
): Promise<GraphQLResponse<any>> {
  // Tạo câu truy vấn GraphQL với hoặc không có điều kiện recordId
  let query;
  
  if (recordId) {
    // Nếu có recordId, tìm chính xác record và lọc deleted_at is null
    query = `
      query QueryMenuRecord($menuId: uuid!, $limit: Int, $offset: Int, $recordId: uuid!) {
        core_core_menu_records(
          limit: $limit
          offset: $offset
          where: { menu_id: { _eq: $menuId }, id: { _eq: $recordId }, deleted_at: { _is_null: true } }
        ) {
          id
          code
          title
          data
          created_at
          created_by
          core_dynamic_status {
            id
            code
            name
          }
          core_user {
            id
            username
            email
          }
        }
      }
    `;
  } else {
    // Nếu không có recordId, truy vấn như bình thường và lọc deleted_at is null
    query = `
      query QueryMenuRecord($menuId: uuid!, $limit: Int, $offset: Int) {
        core_core_menu_records(
          limit: $limit
          offset: $offset
          where: { menu_id: { _eq: $menuId }, deleted_at: { _is_null: true } }
        ) {
          id
          code
          title
          data
          created_at
          created_by
          core_dynamic_status {
            id
            code
            name
          }
          core_user {
            id
            username
            email
          }
        }
      }
    `;
  }

  const variables = {
    menuId,
    limit,
    offset,
    ...(recordId && { recordId })
  };

  return executeGraphQLQuery(query, variables);
}

/**
 * Fetch workflow transitions by status
 */
export async function fetchWorkflowTransitionsByStatus(
  workflowId: string,
  fromStatusId: string
): Promise<GraphQLResponse<any>> {
  console.log('Calling API fetchWorkflowTransitionsByStatus with workflowId:', workflowId);
  console.log('Menu information:', {
    menuIdFromQuery: workflowId,
    currentSubmenuId: workflowId,
    menuIdToUse: workflowId,
    workflowId: workflowId
  });
  
  // Xử lý 2 trường hợp cho query:
  // 1. Nếu có fromStatusId: lấy các transitions từ status này
  // 2. Nếu không có fromStatusId: lấy các transitions có from_status_id là null (trạng thái khởi tạo)
  const query = fromStatusId 
    ? `
      query GetTransitionByStatus($workflowId: uuid!, $fromStatusId: uuid!) {
        core_core_dynamic_workflow_transitions(
          where: {
            from_status_id: { _eq: $fromStatusId },
            workflow_id: { _eq: $workflowId },
            deleted_at: { _is_null: true }
          }
        ) {
          id
          name
          form_id
          from_status_id
          to_status_id
        }
      }
    `
    : `
      query GetAllTransitionsForWorkflow($workflowId: uuid!) {
        core_core_dynamic_workflow_transitions(
          where: {
            from_status_id: { _is_null: true },
            workflow_id: { _eq: $workflowId },
            deleted_at: { _is_null: true }
          }
        ) {
          id
          name
          form_id
          from_status_id
          to_status_id
        }
      }
    `;

  const variables = fromStatusId
    ? { workflowId, fromStatusId }
    : { workflowId };

  console.log('Fetching transitions with variables:', variables);
  return executeGraphQLQuery(query, variables);
}

/**
 * Fetch form by transition ID
 */
export async function fetchTransitionForm(transitionId: string): Promise<GraphQLResponse<any>> {
  const query = `
    query MyQuery2($transitionId: uuid!) {
      core_core_dynamic_workflow_transitions_by_pk(id: $transitionId) {
        id
        name
        organization_id
        workflow_id
        core_dynamic_form {
          id
          name
          status
          code
          core_dynamic_form_fields {
            id
            is_required
            position
            core_dynamic_field {
              id
              code
              field_type
              configuration
              description
              name
              status
              option_values
            }
          }
        }
      }
    }
  `;

  const variables = { transitionId };
  return executeGraphQLQuery(query, variables);
}

/**
 * Submit transition form data
 */
export async function submitTransitionForm(
  transitionId: string,
  recordId: string,
  userId: string = DEFAULT_USER_ID, // Sử dụng giá trị mặc định từ constants
  name: string,
  submissionData: any[]
): Promise<GraphQLResponse<any>> {
  const query = `
    mutation insert_submission_form($transitionId: String!, $recordId: String!, $userId: String!, $name: String!, $submissionData: JSON) {
      insert_submission_form(
        args: {
          name: $name,
          transition_id: $transitionId,
          record_id: $recordId,
          user_id: $userId,
          submission_data: $submissionData
        }
      ) {
        id
        code
        submission_data
      }
    }
  `;

  const variables = {
    transitionId,
    recordId,
    userId,
    name,
    submissionData
  };
  
  console.log("Submitting transition form with data:", variables);
  return executeGraphQLQuery(query, variables);
}

/**
 * Fetch menu view form fields for column headers
 */
export async function fetchMenuViewForm(menuId: string): Promise<GraphQLResponse<any>> {
  const query = `
    query FetchMenuViewForm($menuId: uuid!) {
      core_core_dynamic_menu_forms(
        where: {menu_id: {_eq: $menuId}, form_type: {_eq: "VIEW"}, deleted_at: {_is_null: true}}
      ) {
        id
        form_type
        form_id
        menu_id
        core_dynamic_form {
          id
          name
          code
          core_dynamic_form_fields {
            id
            is_required
            position
            core_dynamic_field {
              id
              code
              field_type
              configuration
              description
              name
              status
              option_values
            }
          }
        }
      }
    }
  `;

  const variables = {
    menuId
  };

  return executeGraphQLQuery(query, variables);
}

/**
 * API request helper
 */
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }

  return res;
}
