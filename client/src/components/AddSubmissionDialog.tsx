import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Check } from 'lucide-react';
import { fetchForms, fetchFormFields, fetchMenuForms, fetchAllMenus } from '@/lib/api';
import { Form, Field, FormField, FieldSubmission, FormSubmission } from '@/lib/types';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';

interface AddSubmissionDialogProps {
  onSubmit: (submission: FormSubmission) => Promise<void>;
  workflowId: string;
}

export function AddSubmissionDialog({ onSubmit, workflowId }: AddSubmissionDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [forms, setForms] = useState<Form[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [isLoadingFields, setIsLoadingFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Các state mới để quản lý hiển thị các màn hình và giá trị field
  const [step, setStep] = useState<'select_form' | 'enter_data'>('select_form');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  
  // Tải danh sách form khi mở dialog
  useEffect(() => {
    if (isOpen) {
      loadForms();
    }
  }, [isOpen]);
  
  // Tải danh sách fields khi chọn form
  useEffect(() => {
    if (selectedFormId) {
      loadFormFields(selectedFormId);
    } else {
      setFields([]);
    }
  }, [selectedFormId]);
  
  // Hàm tải danh sách form sử dụng API mới
  const loadForms = async () => {
    setIsLoadingForms(true);
    try {
      // Nếu có workflow id, chúng ta sẽ dùng API mới để lấy form theo menu
      if (workflowId) {
        // Thực tế sử dụng dữ liệu từ hình ảnh bạn đã cung cấp
        // workflowId: 6b1988ea-c4c5-4810-815d-1de6b06a9392 là workflow_id của menu "Khiếu nại"
        // Menu "Khiếu nại" có ID: 7ffe9691-7f9b-430d-a945-16e0d9b173c4

        // Tìm menuId dựa trên workflowId
        const findMenuIdByWorkflowId = async (wfId: string) => {
          try {
            const allMenusResponse = await fetchAllMenus();
            const allMenus = allMenusResponse.data.core_core_dynamic_menus;
            
            // Tìm menu với workflow_id trùng khớp
            const currentMenu = allMenus.find((menu: any) => menu.workflow_id === wfId);
            
            if (currentMenu) {
              console.log("Found menu for workflow:", currentMenu.id);
              return currentMenu.id;
            }
            
            // Tìm submenu
            for (const menu of allMenus) {
              if (menu.core_dynamic_child_menus) {
                const childMenu = menu.core_dynamic_child_menus.find(
                  (child: any) => child.workflow_id === wfId
                );
                if (childMenu) {
                  console.log("Found child menu for workflow:", childMenu.id);
                  return childMenu.id;
                }
              }
            }
            
            // Mặc định nếu không tìm thấy
            return "7ffe9691-7f9b-430d-a945-16e0d9b173c4";
          } catch (err) {
            console.error("Error finding menu by workflow:", err);
            return "7ffe9691-7f9b-430d-a945-16e0d9b173c4";
          }
        };
        
        const menuId = await findMenuIdByWorkflowId(workflowId);
        
        // Lấy form với loại CREATE
        console.log("Fetching forms for menu ID:", menuId);
        const response = await fetchMenuForms(menuId, 'CREATE');
        console.log("Menu forms response:", response);
        
        console.log("Full response from menu forms API:", response);
        
        if (response.data && response.data.core_core_dynamic_menu_forms) {
          // Đường dẫn đúng là core_core_dynamic_menu_forms, không phải core_dynamic_menu_forms
          const menuForms = response.data.core_core_dynamic_menu_forms.map((menuForm: any) => ({
            id: menuForm.core_dynamic_form.id,
            name: menuForm.core_dynamic_form.name,
            description: menuForm.core_dynamic_form.description || '',
            status: 'ACTIVE',
            __typename: 'core_core_dynamic_forms',
            // Lưu lại thông tin field để có thể sử dụng trong loadFormFields mà không cần gọi API lại
            core_dynamic_form_fields: menuForm.core_dynamic_form.core_dynamic_form_fields
          }));
          console.log("Processed form data:", menuForms);
          setForms(menuForms);
        } else {
          console.log("No forms data returned or incorrect structure:", response.data);
          // Không sử dụng fetchForms nữa theo yêu cầu
          setForms([]);
        }
      } else {
        // Nếu không có workflowId, sử dụng ID mặc định của menu "Khiếu nại"
        const menuId = "7ffe9691-7f9b-430d-a945-16e0d9b173c4";
        console.log("No workflowId provided, using default menu ID:", menuId);
        const response = await fetchMenuForms(menuId, 'CREATE');
        console.log("Full response for default menu:", response);
        
        if (response.data && response.data.core_core_dynamic_menu_forms) {
          const menuForms = response.data.core_core_dynamic_menu_forms.map((menuForm: any) => ({
            id: menuForm.core_dynamic_form.id,
            name: menuForm.core_dynamic_form.name,
            description: menuForm.core_dynamic_form.description || '',
            status: 'ACTIVE',
            __typename: 'core_core_dynamic_forms',
            core_dynamic_form_fields: menuForm.core_dynamic_form.core_dynamic_form_fields
          }));
          setForms(menuForms);
        } else {
          setForms([]);
        }
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    } finally {
      setIsLoadingForms(false);
    }
  };
  
  // Hàm tải thông tin chi tiết form và các fields
  const loadFormFields = async (formId: string) => {
    setIsLoadingFields(true);
    try {
      console.log('Fetching fields for form ID:', formId);
      
      // Nếu đã có dữ liệu fields từ API fetchMenuForms, dùng luôn không cần gọi API khác
      const formWithFields = forms.find(form => form.id === formId) as any;
      if (formWithFields && formWithFields.core_dynamic_form_fields) {
        // Trường hợp khi dùng API mới, dữ liệu fields đã được lấy sẵn
        
        // Sắp xếp các field theo position nếu có
        const sortedFormFields = [...formWithFields.core_dynamic_form_fields].sort((a, b) => {
          // Nếu position là null hoặc undefined, đặt vào cuối
          if (a.position === null || a.position === undefined) return 1;
          if (b.position === null || b.position === undefined) return -1;
          
          // Sắp xếp theo position
          return a.position - b.position;
        });
        
        // Debug dữ liệu option_values
        sortedFormFields.forEach((field) => {
          if (field.core_dynamic_field.field_type === 'SINGLE_CHOICE' || 
              field.core_dynamic_field.field_type === 'MULTI_CHOICE') {
            console.log(`Field ${field.core_dynamic_field.name} option_values:`, 
              field.core_dynamic_field.option_values,
              'Type:', typeof field.core_dynamic_field.option_values);
          }
        });
        
        const extractedFields = sortedFormFields.map(
          (formField: any) => ({
            ...formField.core_dynamic_field,
            position: formField.position,
            is_required: formField.is_required
          })
        );
        
        console.log('Using pre-fetched fields data:', extractedFields.length, 'fields with positions');
        setFields(extractedFields);
      } else {
        // Trường hợp sử dụng API cũ
        const response = await fetchFormFields(formId);
        
        if (response.data && response.data.core_core_dynamic_forms_by_pk) {
          const formDetails = response.data.core_core_dynamic_forms_by_pk;
          const formFields = formDetails.core_dynamic_form_fields;
          
          // Chuyển đổi dữ liệu để lấy danh sách fields
          const extractedFields = formFields.map((formField: FormField) => formField.core_dynamic_field);
          console.log('Received', extractedFields.length, 'fields for form ID', formId);
          setFields(extractedFields);
        }
      }
    } catch (error) {
      console.error('Error loading form fields:', error);
    } finally {
      setIsLoadingFields(false);
    }
  };
  
  // Hàm xử lý khi người dùng chọn một form
  const handleFormSelect = (formId: string) => {
    setSelectedFormId(formId);
    
    // Khởi tạo giá trị mặc định cho các field của form đã chọn
    const selectedForm = forms.find(form => form.id === formId) as any;
    if (selectedForm && selectedForm.core_dynamic_form_fields) {
      const initialValues: Record<string, any> = {};
      
      selectedForm.core_dynamic_form_fields.forEach((formField: any) => {
        const field = formField.core_dynamic_field;
        if (!field) return;
        
        // Tạo giá trị mặc định dựa trên loại field
        let defaultValue: any = null;
        switch (field.field_type) {
          case 'TEXT':
          case 'PARAGRAPH':
            defaultValue = '';
            break;
          case 'NUMBER':
            defaultValue = 0;
            break;
          case 'DATE':
            defaultValue = new Date().getTime();
            break;
          case 'SINGLE_CHOICE':
            // Lấy giá trị đầu tiên từ option_values nếu có
            if (field.option_values) {
              try {
                const options = typeof field.option_values === 'string' 
                  ? JSON.parse(field.option_values) 
                  : field.option_values;
                if (Array.isArray(options) && options.length > 0) {
                  defaultValue = options[0].value || 'option1';
                } else {
                  defaultValue = 'option1';
                }
              } catch (e) {
                defaultValue = 'option1';
              }
            } else {
              defaultValue = 'option1';
            }
            break;
          case 'MULTI_CHOICE':
            defaultValue = [];
            break;
          case 'SCREEN_RECORD':
          case 'PHOTO':
          case 'IMPORT':
          case 'EXPORT':
          case 'QR_SCAN':
          case 'GPS':
          case 'AUDIO_RECORD':
          case 'CACHE':
            defaultValue = '';
            break;
          default:
            defaultValue = null;
        }
        
        initialValues[field.id] = defaultValue;
      });
      
      console.log("Setting initial field values:", initialValues);
      setFieldValues(initialValues);
    }
  };
  
  // Hàm xử lý khi người dùng chuyển sang bước nhập dữ liệu
  const handleNextStep = () => {
    if (selectedFormId && fields.length > 0) {
      setStep('enter_data');
    }
  };
  
  // Hàm xử lý khi người dùng quay lại bước chọn form
  const handleBackStep = () => {
    setStep('select_form');
  };
  
  // Hàm xử lý khi người dùng thay đổi giá trị của field
  const handleFieldValueChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  // Hàm xử lý khi người dùng submit form
  const handleCreateSubmission = async () => {
    if (!selectedFormId) return;
    
    setIsSubmitting(true);
    try {
      // Tạo dữ liệu submission từ danh sách fields và giá trị đã nhập
      const submissionData: Record<string, FieldSubmission> = {};
      
      fields.forEach(field => {
        // Sử dụng giá trị đã nhập hoặc giá trị mặc định
        const fieldValue = fieldValues[field.id] !== undefined ? fieldValues[field.id] : null;
        
        // Thêm field vào dữ liệu submission
        submissionData[field.id] = {
          name: field.name,
          value: fieldValue,
          field_type: field.field_type
        };
      });
      
      // Gọi hàm callback để submit form với dữ liệu mở rộng
      await onSubmit({
        formId: selectedFormId,
        data: submissionData,
        workflowId // Truyền workflowId được cung cấp từ props
      });
      
      // Đóng dialog sau khi submit thành công
      setIsOpen(false);
      setSelectedFormId(null);
      setStep('select_form');
      setFieldValues({});
    } catch (error) {
      console.error('Error creating submission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Reset state khi đóng dialog
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSelectedFormId(null);
      setFields([]);
      setStep('select_form');
      setFieldValues({});
      setIsLoadingFields(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors">
          <PlusCircle className="h-4 w-4" />
          {t('submission.addNew', 'Thêm mới')}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] p-0 border-none shadow-lg rounded-lg overflow-hidden">
        <DialogHeader className="bg-muted/30 border-b p-6">
          <DialogTitle className="text-xl font-bold text-primary">
            {step === 'select_form' ? 
              t('submission.createNew', 'Tạo biểu mẫu mới') : 
              t('submission.enterData', 'Nhập dữ liệu')
            }
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            {step === 'select_form' ? 
              t('submission.selectFormDescription', 'Chọn loại biểu mẫu bạn muốn tạo.') : 
              t('submission.enterDataDescription', 'Vui lòng nhập thông tin vào biểu mẫu.')
            }
          </DialogDescription>
        </DialogHeader>
        
        {/* Bước 1: Chọn loại form */}
        {step === 'select_form' && (
          <div className="p-6">
            {isLoadingForms ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-16 h-16">
                  <Loader2 className="h-16 w-16 animate-spin text-primary/30 absolute" />
                  <Loader2 className="h-16 w-16 animate-spin text-primary absolute animate-delay-100" style={{animationDelay: "0.1s"}} />
                </div>
                <span className="mt-4 text-muted-foreground font-medium">
                  {t('common.loading', 'Đang tải...')}
                </span>
              </div>
            ) : (
              <>
                <h3 className="mb-4 text-sm font-medium text-foreground flex items-center">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                  {t('submission.availableForms', 'Các biểu mẫu có sẵn:')}
                </h3>
                
                <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-2 scroll-smooth">
                  {forms.length > 0 ? (
                    forms.map((form) => (
                      <div 
                        key={form.id}
                        className={`group p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedFormId === form.id 
                            ? 'bg-primary/10 border-primary shadow-sm' 
                            : 'hover:bg-background/80 hover:border-primary/20 hover:shadow-sm'
                        }`}
                        onClick={() => handleFormSelect(form.id)}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${selectedFormId === form.id ? 'text-primary' : ''}`}>
                            {form.name}
                          </h4>
                          {selectedFormId === form.id ? (
                            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center">
                              <Check className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 group-hover:border-primary/40 transition-colors"></div>
                          )}
                        </div>
                        {form.description && (
                          <p className="text-sm text-muted-foreground mt-1.5">{form.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 px-4 border border-dashed rounded-lg">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        width="36" 
                        height="36" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="1" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        className="mx-auto mb-4 text-muted-foreground/50"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <path d="M14 2v6h6"></path>
                        <path d="M5 12h14"></path>
                        <path d="M5 18h8"></path>
                      </svg>
                      <p className="text-muted-foreground font-medium">
                        {t('submission.noFormsAvailable', 'Không có biểu mẫu nào.')}
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {isLoadingFields && (
              <div className="flex items-center justify-center py-4 mt-4 border-t">
                <div className="relative">
                  <Loader2 className="h-5 w-5 animate-spin text-primary/30 absolute" />
                  <Loader2 className="h-5 w-5 animate-spin text-primary absolute animate-delay-100" style={{animationDelay: "0.1s"}} />
                </div>
                <span className="ml-8 text-sm text-muted-foreground">
                  {t('submission.loadingFormFields', 'Đang tải thông tin biểu mẫu...')}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Bước 2: Nhập dữ liệu cho form */}
        {step === 'enter_data' && (
          <div className="p-6">
            <div className="space-y-6 max-h-[450px] overflow-y-auto pr-2 scroll-smooth">
              {fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  {!(field.field_type === 'SCREEN_RECORD' || 
                    field.field_type === 'PHOTO' || 
                    field.field_type === 'IMPORT' || 
                    field.field_type === 'EXPORT' || 
                    field.field_type === 'QR_SCAN' || 
                    field.field_type === 'GPS' || 
                    field.field_type === 'AUDIO_RECORD' || 
                    field.field_type === 'CACHE') && (
                    <div className="flex justify-between items-center">
                      <div>
                        {field.name}
                        {field.description && (
                          <span className="ml-2 text-xs text-muted-foreground">({field.description})</span>
                        )}
                      </div>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                        {field.field_type}
                      </span>
                    </div>
                  )}
                  
                  {/* Render input based on field type */}
                  {field.field_type === 'TEXT' && (
                    <input
                      id={field.id}
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                    />
                  )}
                  
                  {field.field_type === 'PARAGRAPH' && (
                    <textarea
                      id={field.id}
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary min-h-[100px]"
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                    />
                  )}
                  
                  {field.field_type === 'NUMBER' && (
                    <input
                      id={field.id}
                      type="number"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={fieldValues[field.id] || 0}
                      onChange={(e) => handleFieldValueChange(field.id, Number(e.target.value))}
                    />
                  )}
                  
                  {field.field_type === 'DATE' && (
                    <input
                      id={field.id}
                      type="date"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      value={fieldValues[field.id] ? new Date(fieldValues[field.id]).toISOString().slice(0, 10) : ''}
                      onChange={(e) => handleFieldValueChange(field.id, new Date(e.target.value).getTime())}
                    />
                  )}
                  
                  {field.field_type === 'SCREEN_RECORD' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">SCREEN_RECORD</div>
                      </div>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'string' && fieldValues[field.id].startsWith('data:video/') ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <video 
                            className="w-full h-auto" 
                            controls
                            src={fieldValues[field.id]}
                          ></video>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-primary border-primary hover:bg-primary/10 transition-colors duration-200"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            Xóa video
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                          placeholder="Nhấn để ghi màn hình"
                          readOnly
                          onClick={async () => {
                            try {
                              toast({
                                title: "Đang chuẩn bị ghi màn hình",
                                description: "Vui lòng chọn màn hình hoặc cửa sổ muốn ghi",
                              });
                              
                              // Import và sử dụng hàm ghi màn hình
                              const { recordScreen } = await import('../lib/special-field-handlers');
                              const result = await recordScreen();
                              
                              if (result.success && result.data) {
                                // Lưu dữ liệu video (base64)
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Ghi màn hình thành công",
                                  description: "Video đã được lưu",
                                });
                              } else {
                                toast({
                                  title: "Ghi màn hình thất bại",
                                  description: result.message || "Không thể ghi màn hình",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi ghi màn hình:", error);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'PHOTO' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">PHOTO</div>
                      </div>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'string' && fieldValues[field.id].startsWith('data:image/') ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <img 
                            className="w-full h-auto" 
                            src={fieldValues[field.id]} 
                            alt="Ảnh đã chụp" 
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-primary border-primary hover:bg-primary/10 transition-colors duration-200"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            Xóa ảnh
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                          placeholder="Nhấn để chụp ảnh"
                          readOnly
                          onClick={async () => {
                            try {
                              toast({
                                title: "Đang mở camera",
                                description: "Vui lòng cho phép quyền truy cập camera",
                              });
                              
                              // Import và sử dụng hàm chụp ảnh
                              const { capturePhoto } = await import('../lib/special-field-handlers');
                              const result = await capturePhoto();
                              
                              if (result.success && result.data) {
                                // Lưu dữ liệu ảnh (base64)
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Chụp ảnh thành công",
                                });
                              } else {
                                toast({
                                  title: "Chụp ảnh thất bại",
                                  description: result.message || "Không thể chụp ảnh",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi chụp ảnh:", error);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'IMPORT' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">IMPORT</div>
                      </div>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'object' ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <p className="font-medium">File đã nhập:</p>
                          <p>Tên: {fieldValues[field.id].fileName}</p>
                          <p>Loại: {fieldValues[field.id].fileType}</p>
                          <p>Kích thước: {Math.round(fieldValues[field.id].fileSize / 1024)} KB</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-primary border-primary hover:bg-primary/10 transition-colors duration-200"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            Xóa file
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                          placeholder="Nhấn để nhập dữ liệu"
                          readOnly
                          onClick={async () => {
                            try {
                              
                              
                              // Import và sử dụng hàm nhập dữ liệu
                              const { importData } = await import('../lib/special-field-handlers');
                              const result = await importData();
                              
                              if (result.success && result.data) {
                                // Lưu thông tin file
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Nhập dữ liệu thành công",
                                  description: `Đã nhập file ${result.data.fileName}`,
                                });
                              } else {
                                if (result.message !== 'Người dùng đã hủy chọn file.') {
                                  toast({
                                    title: "Nhập dữ liệu thất bại",
                                    description: result.message || "Không thể nhập dữ liệu",
                                    variant: "destructive",
                                  });
                                }
                              }
                            } catch (error) {
                              console.error("Lỗi khi nhập dữ liệu:", error);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'EXPORT' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">EXPORT</div>
                      </div>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                        placeholder="Nhấn để xuất dữ liệu"
                        readOnly
                        onClick={async () => {
                          try {
                            
                            
                            // Lấy tất cả các giá trị hiện tại từ các trường khác để xuất
                            const dataToExport = Object.entries(fieldValues).reduce((acc, [key, value]) => {
                              const fieldInfo = fields.find(f => f.id === key);
                              if (fieldInfo && key !== field.id) {
                                acc[fieldInfo.name || key] = value;
                              }
                              return acc;
                            }, {} as Record<string, any>);
                            
                            // Import và sử dụng hàm xuất dữ liệu
                            const { exportData } = await import('../lib/special-field-handlers');
                            const result = await exportData(dataToExport, 'json', `form_data_${new Date().getTime()}.json`);
                            
                            if (result.success) {
                              toast({
                                title: "Xuất dữ liệu thành công",
                                description: "Dữ liệu đã được tải xuống",
                              });
                              
                              // Đánh dấu là đã xuất dữ liệu thành công
                              handleFieldValueChange(field.id, {
                                exportedAt: new Date().toISOString(),
                                format: 'json',
                              });
                            } else {
                              toast({
                                title: "Xuất dữ liệu thất bại",
                                description: result.message || "Không thể xuất dữ liệu",
                                variant: "destructive",
                              });
                            }
                          } catch (error) {
                            console.error("Lỗi khi xuất dữ liệu:", error);
                          }
                        }}
                      />
                    </>
                  )}
                  
                  {field.field_type === 'QR_SCAN' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">QR_SCAN</div>
                      </div>
                      {fieldValues[field.id] ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <p className="font-medium">Dữ liệu QR:</p>
                          <p className="break-all">{fieldValues[field.id]}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-primary border-primary hover:bg-primary/10 transition-colors duration-200"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            Quét lại
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                          placeholder="Nhấn để quét QR"
                          readOnly
                          onClick={async () => {
                            try {
                              
                              
                              toast({
                                title: "Đang mở camera",
                                description: "Vui lòng cho phép quyền truy cập camera và hướng camera vào mã QR",
                              });
                              
                              // Import và sử dụng hàm quét QR
                              const { scanQRCode } = await import('../lib/special-field-handlers');
                              const result = await scanQRCode();
                              
                              if (result.success && result.data) {
                                // Lưu dữ liệu QR
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Quét QR thành công",
                                });
                              } else {
                                toast({
                                  title: "Quét QR thất bại",
                                  description: result.message || "Không thể quét mã QR",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi quét QR:", error);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'GPS' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">GPS</div>
                      </div>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'object' ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <p className="font-medium">Vị trí GPS:</p>
                          <p>Vĩ độ: {fieldValues[field.id].latitude.toFixed(6)}</p>
                          <p>Kinh độ: {fieldValues[field.id].longitude.toFixed(6)}</p>
                          <p>Độ chính xác: {Math.round(fieldValues[field.id].accuracy)} m</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-primary border-primary hover:bg-primary/10 transition-colors duration-200"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            Xác định lại
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                          placeholder="Nhấn để xác định vị trí GPS"
                          readOnly
                          onClick={async () => {
                            try {
                              
                              
                              toast({
                                title: "Đang xác định vị trí",
                                description: "Vui lòng cho phép quyền truy cập vị trí",
                              });
                              
                              // Import và sử dụng hàm lấy vị trí GPS
                              const { getGPSLocation } = await import('../lib/special-field-handlers');
                              const result = await getGPSLocation();
                              
                              if (result.success && result.data) {
                                // Lưu dữ liệu vị trí
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Xác định vị trí thành công",
                                });
                              } else {
                                toast({
                                  title: "Xác định vị trí thất bại",
                                  description: result.message || "Không thể xác định vị trí",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi xác định vị trí GPS:", error);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'AUDIO_RECORD' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">AUDIO_RECORD</div>
                      </div>
                      {fieldValues[field.id] && typeof fieldValues[field.id] === 'string' && fieldValues[field.id].startsWith('data:audio/') ? (
                        <div className="border border-gray-200 rounded-md p-2 mb-2">
                          <audio 
                            className="w-full" 
                            controls
                            src={fieldValues[field.id]}
                          ></audio>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full text-primary border-primary hover:bg-primary/10 transition-colors duration-200"
                            onClick={() => handleFieldValueChange(field.id, '')}
                          >
                            Xóa bản ghi
                          </Button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                          placeholder="Nhấn để ghi âm"
                          readOnly
                          onClick={async () => {
                            try {
                              
                              
                              toast({
                                title: "Đang chuẩn bị ghi âm",
                                description: "Vui lòng cho phép quyền truy cập microphone",
                              });
                              
                              // Import và sử dụng hàm ghi âm
                              const { recordAudio } = await import('../lib/special-field-handlers');
                              const result = await recordAudio();
                              
                              if (result.success && result.data) {
                                // Lưu dữ liệu âm thanh (base64)
                                handleFieldValueChange(field.id, result.data);
                                toast({
                                  title: "Ghi âm thành công",
                                });
                              } else {
                                toast({
                                  title: "Ghi âm thất bại",
                                  description: result.message || "Không thể ghi âm",
                                  variant: "destructive",
                                });
                              }
                            } catch (error) {
                              console.error("Lỗi khi ghi âm:", error);
                            }
                          }}
                        />
                      )}
                    </>
                  )}
                  
                  {field.field_type === 'CACHE' && (
                    <>
                      <div className="flex justify-between items-center">
                        <div>{field.name}</div>
                        <div className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">CACHE</div>
                      </div>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-200 rounded-md bg-white text-center text-gray-500"
                        placeholder="Dữ liệu bộ nhớ đệm"
                        readOnly
                        value={fieldValues[field.id] ? JSON.stringify(fieldValues[field.id]).substring(0, 30) + '...' : ''}
                        onClick={() => {
                          // Hiển thị toast thông báo
                          
                          toast({
                            title: "Trường dữ liệu cache",
                            description: "Trường này được sử dụng để lưu trữ dữ liệu tạm thời và không thể chỉnh sửa trực tiếp.",
                          });
                        }}
                      />
                    </>
                  )}
                  
                  {field.field_type === 'SINGLE_CHOICE' && (
                    <div className="space-y-2">
                      {/* Sử dụng option_values nếu có, ngược lại sử dụng giá trị mặc định */}
                      {(() => {
                        // Xử lý option_values có thể là mảng hoặc chuỗi JSON
                        let options = ['1', '2', '3', '4'];
                        
                        if (field.option_values) {
                          if (Array.isArray(field.option_values)) {
                            // Nếu option_values là mảng đối tượng JavaScript
                            options = field.option_values;
                          } else if (typeof field.option_values === 'string') {
                            // Nếu option_values là chuỗi JSON
                            try {
                              const parsed = JSON.parse(field.option_values);
                              if (Array.isArray(parsed)) {
                                options = parsed;
                              }
                            } catch (error) {
                              console.error('Error parsing option_values:', error);
                            }
                          }
                        }
                        
                        return options.map((option: any) => {
                          const value = typeof option === 'object' ? option.value : option;
                          const label = typeof option === 'object' ? option.label : `Lựa chọn ${option}`;
                          
                          return (
                            <div key={value} className="flex items-center">
                              <input
                                id={`${field.id}-${value}`}
                                type="radio"
                                name={`choice-group-${field.id}`}
                                value={value}
                                checked={fieldValues[field.id] === value}
                                onChange={() => handleFieldValueChange(field.id, value)}
                                className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                              />
                              <label 
                                htmlFor={`${field.id}-${value}`}
                                className="ml-2 text-sm font-medium"
                              >
                                {label}
                              </label>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                  
                  {field.field_type === 'MULTI_CHOICE' && (
                    <div className="space-y-2">
                      {/* Sử dụng option_values nếu có, ngược lại sử dụng giá trị mặc định */}
                      {(() => {
                        // Xử lý option_values có thể là mảng hoặc chuỗi JSON
                        let options = ['1', '2', '3', '4'];
                        
                        if (field.option_values) {
                          if (Array.isArray(field.option_values)) {
                            // Nếu option_values là mảng đối tượng JavaScript
                            options = field.option_values;
                          } else if (typeof field.option_values === 'string') {
                            // Nếu option_values là chuỗi JSON
                            try {
                              const parsed = JSON.parse(field.option_values);
                              if (Array.isArray(parsed)) {
                                options = parsed;
                              }
                            } catch (error) {
                              console.error('Error parsing option_values for multi choice:', error);
                            }
                          }
                        }
                        
                        return options.map((option: any) => {
                          const value = typeof option === 'object' ? option.value : option;
                          const label = typeof option === 'object' ? option.label : `Lựa chọn ${option}`;
                          
                          const selectedValues = Array.isArray(fieldValues[field.id]) 
                            ? fieldValues[field.id] 
                            : fieldValues[field.id] ? [fieldValues[field.id]] : [];
                          
                          return (
                            <div key={value} className="flex items-center">
                              <input
                                id={`multi-${field.id}-${value}`}
                                type="checkbox"
                                value={value}
                                checked={selectedValues.includes(value)}
                                onChange={(e) => {
                                  let newValues = [...selectedValues];
                                  if (e.target.checked) {
                                    newValues.push(value);
                                  } else {
                                    newValues = newValues.filter(v => v !== value);
                                  }
                                  handleFieldValueChange(field.id, newValues);
                                }}
                                className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <label 
                                htmlFor={`multi-${field.id}-${value}`}
                                className="ml-2 text-sm font-medium"
                              >
                                {label}
                              </label>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <DialogFooter className="border-t p-4 flex-row justify-between gap-2">
          {step === 'select_form' ? (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsOpen(false)}
                className="border-gray-300 hover:bg-background flex items-center gap-1"
              >
                <span>{t('actions.cancel', 'Hủy')}</span>
              </Button>
              <Button
                onClick={handleNextStep}
                disabled={!selectedFormId || isLoadingFields}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors"
              >
                <span>{t('actions.next', 'Tiếp theo')}</span>
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={handleBackStep}
                className="border-gray-300 hover:bg-background flex items-center gap-1"
              >
                <span>{t('actions.back', 'Quay lại')}</span>
              </Button>
              <Button
                onClick={handleCreateSubmission}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 transition-colors"
              >
                {isSubmitting ? (
                  <div className="relative">
                    <Loader2 className="h-4 w-4 animate-spin text-white/30 absolute" />
                    <Loader2 className="h-4 w-4 animate-spin text-white absolute animate-delay-100" style={{animationDelay: "0.1s"}} />
                  </div>
                ) : (
                  <PlusCircle className="h-4 w-4" />
                )}
                <span>{t('submission.create', 'Tạo biểu mẫu')}</span>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}