import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FieldValue } from '@/lib/types';
import { Edit, X, Save, Eye, Calendar, Table, LayoutGrid, Search, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { fetchMenuViewForm, fetchWorkflowTransitionsByStatus } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { TransitionFormDialog } from '@/components/TransitionFormDialog';

interface FieldData {
  id: string;
  name: string;
  value: FieldValue;
  field_type: string;
}

type ViewMode = 'card' | 'table';

interface SubmissionDataTableProps {
  data: any[];
  onSave?: (data: FieldData[]) => Promise<boolean | void>;
  readOnly?: boolean;
  viewMode?: ViewMode;
  menuId?: string; // ID của menu để lấy thông tin form
  workflowId?: string; // ID của workflow để lấy transitions
  formData?: any; // Data của form VIEW từ API fetchMenuViewForm
}

export function SubmissionDataTable({ 
  data, 
  onSave, 
  readOnly = true, // Mặc định là chỉ xem
  viewMode, // Không đặt giá trị mặc định để tự động phát hiện dựa trên kích thước màn hình
  menuId,
  workflowId,
  formData
}: SubmissionDataTableProps) {

  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FieldData[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(data.length === 0);
  // Phát hiện thiết bị di động và sử dụng chế độ card cho mobile, table cho desktop
  const { isMobile, screenWidth } = useIsMobile();
  const screenSize = useScreenSize();
  
  // Tự động hiển thị loading state khi không có dữ liệu
  useEffect(() => {
    // Set loading state dựa vào data length
    setIsLoading(data.length === 0);
    
    // Sau 2 giây, nếu vẫn không có dữ liệu thì tắt loading state để hiển thị "Không có dữ liệu"
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [data]);
  
  // Ưu tiên viewMode từ props, nếu không có thì dùng card cho mobile, table cho desktop/tablet
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(
    viewMode || (screenSize === 'mobile' ? 'card' : 'table')
  );
  
  // Log kích thước màn hình cho debugging
  useEffect(() => {
    console.log('Current screen size:', screenSize);
  }, [screenSize]);
  
  // Theo dõi thay đổi của screenSize để cập nhật chế độ xem
  useEffect(() => {
    if (!viewMode) { // Chỉ tự động thay đổi khi không có viewMode từ props
      // Với màn hình lớn luôn hiển thị dạng bảng (table), màn hình mobile hiển thị dạng card
      const newViewMode = screenSize === 'mobile' ? 'card' : 'table';
      setCurrentViewMode(newViewMode);
      console.log('View mode updated to:', newViewMode, 'based on screen size:', screenSize);
    }
  }, [screenSize, viewMode]);
  
  // State cho tìm kiếm và lọc
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [dataChanged, setDataChanged] = useState(false);
  const [filterFields, setFilterFields] = useState<{id: string, name: string, field_type: string, option_values?: any}[]>([]);
  
  // Lấy thông tin form từ API nếu có menuId và không có formData từ props
  const { data: formDataFromAPI } = useQuery({
    queryKey: ['menu-view-form', menuId],
    queryFn: () => menuId ? fetchMenuViewForm(menuId) : Promise.resolve(null),
    enabled: !!menuId && !formData
  });
  
  // Cập nhật danh sách fields cho bộ lọc
  useEffect(() => {
    // Ưu tiên sử dụng formData từ prop, nếu không có thì dùng formDataFromAPI
    const formDataToUse = formData || formDataFromAPI;
    
    if (formDataToUse?.data?.core_core_dynamic_menu_forms?.[0]?.core_dynamic_form?.core_dynamic_form_fields) {
      const fields = formDataToUse.data.core_core_dynamic_menu_forms[0].core_dynamic_form.core_dynamic_form_fields
        .filter((ff: any) => ff.core_dynamic_field && ff.core_dynamic_field.field_type)
        .map((ff: any) => ({
          id: ff.core_dynamic_field.id,
          name: ff.core_dynamic_field.name,
          field_type: ff.core_dynamic_field.field_type,
          option_values: ff.core_dynamic_field.option_values
        }));
      
      setFilterFields(fields);
    }
  }, [formData, formDataFromAPI]);
  
  // State cho thông tin transitions
  const [currentStatusId, setCurrentStatusId] = useState<string>("");
  
  // Lấy transitions từ API nếu có workflowId
  // Không cần điều kiện !!currentStatusId vì API đã xử lý trường hợp không có statusId
  const { data: transitionsData } = useQuery({
    queryKey: ['workflow-transitions', workflowId, currentStatusId],
    queryFn: () => {
      console.log('Fetching transitions with variables:', { workflowId, fromStatusId: currentStatusId });
      return workflowId ? fetchWorkflowTransitionsByStatus(workflowId, currentStatusId) : Promise.resolve(null);
    },
    enabled: !!workflowId
  });

  // Format thời gian từ timestamp
  const formatDate = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Xử lý khi nhấn nút chỉnh sửa tất cả
  const handleEdit = (submission: any) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.data)) {
      setEditedData([...submission.data]);
    } else {
      setEditedData([]);
    }
    setDialogOpen(true);
    setIsEditing(false);
  };

  // Xử lý khi nhấn nút xem tất cả - Chuyển hướng đến trang chi tiết
  const handleView = (submission: any) => {
    console.log('Viewing submission:', submission);
    
    // Ghi log thông tin submission trước khi chuyển hướng
    if (Array.isArray(submission.data)) {
      console.log('All fields in submission data:', submission.data.map((f: FieldData) => `${f.name} (${f.field_type}): ${JSON.stringify(f.value)}`));
      
      // Lưu statusId nếu có để sử dụng sau này
      if (submission.core_dynamic_status && submission.core_dynamic_status.id) {
        console.log('Using status ID from core_dynamic_status:', submission.core_dynamic_status.id);
        setCurrentStatusId(submission.core_dynamic_status.id);
      }
    }
    
    // Xác định URL điều hướng đến trang chi tiết
    let redirectUrl = `/record/${menuId}/${submission.id}`;
    
    // Nếu có workflowId, thêm vào URL
    if (workflowId) {
      redirectUrl += `/workflow/${workflowId}`;
    }
    
    // Chuyển hướng đến trang chi tiết
    window.location.href = redirectUrl;
  };
  
  // Xử lý khi nhấn vào một trường cụ thể để chỉnh sửa
  const handleEditField = (submission: any, fieldId: string) => {
    setSelectedSubmission(submission);
    if (Array.isArray(submission.data)) {
      // Tìm field cần chỉnh sửa trong data
      const fieldToEdit = submission.data.find((field: FieldData) => field.id === fieldId);
      if (fieldToEdit) {
        // Chỉ lấy trường cụ thể để chỉnh sửa
        setEditedData([fieldToEdit]);
        setDialogOpen(true);
        setIsEditing(true); // Mở chế độ chỉnh sửa ngay lập tức
      }
    }
  };

  // Xử lý khi thay đổi giá trị field
  const handleValueChange = (index: number, value: FieldValue) => {
    const newData = [...editedData];
    // Kiểm tra xem giá trị có thay đổi không để tối ưu render
    if (JSON.stringify(newData[index].value) !== JSON.stringify(value)) {
      newData[index] = { ...newData[index], value };
      setEditedData(newData);
      setDataChanged(true); // Đánh dấu dữ liệu đã thay đổi
    }
  };
  
  // Theo dõi sự thay đổi dữ liệu và tối ưu re-render
  useEffect(() => {
    if (dataChanged) {
      // Sử dụng requestAnimationFrame để đảm bảo UI mượt mà
      const timerId = requestAnimationFrame(() => {
        setDataChanged(false);
      });
      return () => cancelAnimationFrame(timerId);
    }
  }, [dataChanged]);

  // Xử lý khi lưu thay đổi
  const handleSave = async () => {
    if (onSave && selectedSubmission) {
      try {
        if (editedData.length === 1 && Array.isArray(selectedSubmission.data)) {
          // Nếu đang chỉnh sửa một trường duy nhất, cần cập nhật đúng trường đó trong tất cả dữ liệu
          const allSubmissionData = [...selectedSubmission.data];
          const editedFieldIndex = allSubmissionData.findIndex(field => field.id === editedData[0].id);
          
          if (editedFieldIndex !== -1) {
            // Cập nhật trường đã chỉnh sửa trong tất cả dữ liệu
            allSubmissionData[editedFieldIndex] = editedData[0];
            // Gửi tất cả dữ liệu để cập nhật
            await onSave(allSubmissionData);
          } else {
            // Nếu không tìm thấy, vẫn gửi dữ liệu đã chỉnh sửa
            await onSave(editedData);
          }
        } else {
          // Trường hợp chỉnh sửa tất cả các trường
          await onSave(editedData);
        }
        
        setDialogOpen(false);
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving data:', error);
      }
    }
  };

  // Lấy các lựa chọn từ dữ liệu option_values hoặc từ dữ liệu trường form
  const getChoices = (fieldType: string, fieldId?: string): { label: string; value: string }[] => {
    // Tìm trong filterFields nếu có sẵn
    if (fieldId && filterFields.length > 0) {
      const field = filterFields.find(f => f.id === fieldId);
      if (field?.option_values) {
        try {
          let options = field.option_values;
          
          // Nếu là chuỗi JSON thì parse
          if (typeof options === 'string') {
            options = JSON.parse(options);
          }
          
          // Đảm bảo options có định dạng đúng {label, value}
          if (Array.isArray(options)) {
            if (options.length > 0 && typeof options[0] === 'object' && 'label' in options[0] && 'value' in options[0]) {
              return options;
            } else {
              // Chuyển đổi mảng đơn giản thành định dạng {label, value}
              return options.map((opt: any) => {
                if (typeof opt === 'string') {
                  return { label: opt, value: opt };
                }
                return { label: String(opt), value: String(opt) };
              });
            }
          }
        } catch (error) {
          console.error('Error parsing option_values from filterFields:', error);
        }
      }
    }
    
    // Nếu có dữ liệu form từ API
    if (formData?.core_dynamic_form?.core_dynamic_form_fields) {
      // Tìm trường trong form fields
      const formField = formData.core_dynamic_form.core_dynamic_form_fields.find(
        (ff: any) => ff.core_dynamic_field.id === fieldId || ff.core_dynamic_field.field_type === fieldType
      );
      
      if (formField?.core_dynamic_field?.option_values) {
        // Xử lý option_values có thể là chuỗi hoặc mảng
        try {
          let options = formField.core_dynamic_field.option_values;
          
          // Nếu là chuỗi JSON thì parse
          if (typeof options === 'string') {
            options = JSON.parse(options);
          }
          
          // Đảm bảo options có định dạng đúng {label, value}
          if (Array.isArray(options)) {
            if (options.length > 0 && typeof options[0] === 'object' && 'label' in options[0] && 'value' in options[0]) {
              return options;
            } else {
              // Chuyển đổi mảng đơn giản thành định dạng {label, value}
              return options.map((opt: any) => {
                if (typeof opt === 'string') {
                  return { label: opt, value: opt };
                }
                return { label: String(opt), value: String(opt) };
              });
            }
          }
        } catch (error) {
          console.error('Error parsing option_values:', error);
        }
      }
    }
    
    // Duyệt qua tất cả các trường trong dữ liệu để tìm các lựa chọn
    const uniqueValues = new Set<string>();
    const result: { label: string; value: string }[] = [];
    
    data.forEach(submission => {
      if (Array.isArray(submission.data)) {
        submission.data.forEach((field: FieldData) => {
          if (field.field_type === fieldType && field.value) {
            if (typeof field.value === 'string' && !uniqueValues.has(field.value)) {
              uniqueValues.add(field.value);
              result.push({ label: field.value, value: field.value });
            } else if (Array.isArray(field.value)) {
              field.value.forEach(v => {
                if (!uniqueValues.has(v)) {
                  uniqueValues.add(v);
                  result.push({ label: v, value: v });
                }
              });
            }
          }
        });
      }
    });
    
    return result.length > 0 ? result : [
      { label: 'Không có dữ liệu', value: '' }
    ];
  };

  // Render form field dựa vào loại
  const renderFieldInput = (field: FieldData, index: number) => {
    if (isEditing) {
      switch (field.field_type) {
        case 'TEXT':
          return (
            <div className="border rounded-md p-4 w-full">
              <Input
                placeholder="Nhập văn bản"
                value={field.value as string || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full border-none focus:ring-0 p-0"
              />
            </div>
          );
        case 'PARAGRAPH':
          return (
            <div className="border rounded-md p-4 w-full">
              <Textarea
                placeholder="Nhập đoạn văn bản dài"
                value={field.value as string || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full border-none focus:ring-0 p-0 min-h-[100px]"
              />
            </div>
          );
        case 'NUMBER':
          return (
            <div className="border rounded-md p-4 w-full">
              <Input
                type="number"
                placeholder="0"
                value={field.value as number || 0}
                onChange={(e) => handleValueChange(index, Number(e.target.value))}
                className="w-full border-none focus:ring-0 p-0"
              />
            </div>
          );
        case 'DATE':
          return (
            <div className="border rounded-md p-4 w-full">
              <div className="flex items-center">
                <Calendar className="mr-2 h-4 w-4" />
                <Input
                  type="date"
                  placeholder="Chọn một ngày"
                  value={field.value ? new Date(field.value as number).toISOString().slice(0, 10) : ''}
                  onChange={(e) => handleValueChange(index, new Date(e.target.value).getTime())}
                  className="w-full border-none focus:ring-0 p-0"
                />
              </div>
            </div>
          );
        case 'SINGLE_CHOICE':
          return (
            <div className="border rounded-md p-4 w-full">
              <div className="space-y-2">
                {getChoices(field.field_type).map((choice) => (
                  <div key={choice.value} className="flex items-center">
                    <input
                      type="radio"
                      id={`choice-${field.id}-${choice.value}`}
                      name={`choice-group-${field.id}`}
                      value={choice.value}
                      checked={field.value === choice.value}
                      onChange={() => handleValueChange(index, choice.value)}
                      className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                    />
                    <label 
                      htmlFor={`choice-${field.id}-${choice.value}`}
                      className="ml-2 text-sm font-medium"
                    >
                      {choice.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        case 'MULTI_CHOICE':
          const selectedValues = Array.isArray(field.value) ? field.value : 
                                field.value ? [field.value as string] : [];
          
          return (
            <div className="border rounded-md p-4 w-full">
              <div className="space-y-2">
                {getChoices(field.field_type).map((choice) => (
                  <div key={choice.value} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`multi-choice-${field.id}-${choice.value}`}
                      value={choice.value}
                      checked={selectedValues.includes(choice.value)}
                      onChange={(e) => {
                        let newValues = [...selectedValues];
                        if (e.target.checked) {
                          newValues.push(choice.value);
                        } else {
                          newValues = newValues.filter(v => v !== choice.value);
                        }
                        handleValueChange(index, newValues);
                      }}
                      className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <label 
                      htmlFor={`multi-choice-${field.id}-${choice.value}`}
                      className="ml-2 text-sm font-medium"
                    >
                      {choice.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          );
        default:
          return (
            <div className="border rounded-md p-4 w-full">
              <Input
                value={field.value as string || ''}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="w-full border-none focus:ring-0 p-0"
              />
            </div>
          );
      }
    } else {
      // Chế độ xem
      switch (field.field_type) {
        case 'DATE':
          return formatDate(field.value as number);
        case 'MULTI_CHOICE':
          return Array.isArray(field.value) ? 
            field.value.map(v => {
              const choice = getChoices(field.field_type).find(c => c.value === v);
              return choice ? choice.label : v;
            }).join(', ') : 
            field.value;
        case 'SINGLE_CHOICE':
          const choice = getChoices(field.field_type).find(c => c.value === field.value);
          return choice ? choice.label : field.value;
        default:
          return field.value;
      }
    }
  };

  // Không cần hàm toggleViewMode vì chỉ sử dụng chế độ bảng

  // Lấy danh sách tất cả loại trường duy nhất từ dữ liệu
  const getUniqueFieldTypes = () => {
    const fieldTypes = new Set<string>();
    data.forEach(submission => {
      if (Array.isArray(submission.data)) {
        submission.data.forEach((field: FieldData) => {
          fieldTypes.add(field.name);
        });
      }
    });
    return Array.from(fieldTypes);
  };
  
  // Lọc dữ liệu dựa trên truy vấn tìm kiếm và bộ lọc
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() && activeFilters.length === 0) {
      return data;
    }
    
    return data.filter(submission => {
      if (!Array.isArray(submission.data)) {
        return false;
      }
      
      // Lọc theo bộ lọc hoạt động
      if (activeFilters.length > 0) {
        const hasAllActiveFilters = activeFilters.every(filterName => {
          return submission.data.some((field: FieldData) => field.name === filterName);
        });
        
        if (!hasAllActiveFilters) {
          return false;
        }
      }
      
      // Lọc theo truy vấn tìm kiếm
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        
        // Tìm trong tất cả các trường
        return submission.data.some((field: FieldData) => {
          const fieldValue = field.value;
          
          if (fieldValue === null || fieldValue === undefined) {
            return false;
          }
          
          // Kiểm tra giá trị dựa vào loại dữ liệu
          if (typeof fieldValue === 'string') {
            return fieldValue.toLowerCase().includes(query);
          } else if (typeof fieldValue === 'number') {
            return fieldValue.toString().includes(query);
          } else if (Array.isArray(fieldValue)) {
            return fieldValue.some(item => 
              item !== null && 
              item !== undefined && 
              item.toString().toLowerCase().includes(query)
            );
          }
          
          return false;
        });
      }
      
      return true;
    });
  }, [data, searchQuery, activeFilters]);

  // Hiển thị giá trị của trường
  const renderFieldValue = (value: FieldValue, fieldType: string) => {
    if (value === null || value === undefined || value === '') return <span className="text-sm text-muted-foreground break-words">-</span>;
    
    switch (fieldType) {
      case 'DATE':
        return formatDate(value as number);
      case 'MULTI_CHOICE':
        return Array.isArray(value) ? value.join(', ') : String(value);
      default:
        return typeof value === 'string' 
          ? value 
          : Array.isArray(value) 
            ? value.join(', ') 
            : String(value);
    }
  };
  
  // Hiển thị các nút action (transitions) từ workflow - đã bị ẩn khỏi trang chính
  const renderActionButtons = () => {
    // Không hiển thị các nút hành động ở trang chính
    return null;
    
    // Hiển thị trạng thái hiện tại nếu có
    const currentStatus = selectedSubmission?.core_dynamic_status?.name || '';
    const statusSection = (
      <div className="mb-4">
        <p className="text-sm font-medium text-muted-foreground mb-2">
          {t('workflow.currentStatus', 'Trạng thái hiện tại:')}
        </p>
        <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full inline-block text-sm font-medium">
          {currentStatus || t('workflow.noStatus', 'Chưa có trạng thái')}
        </div>
      </div>
    );
    
    // Nếu không có transitions, chỉ hiển thị trạng thái hiện tại và thông báo
    if ((transitionsData?.data?.core_core_dynamic_workflow_transitions || []).length === 0) {
      return (
        <div className="flex flex-col gap-2 py-4 px-2 border-b border-border bg-muted/20">
          {statusSection}
          <div className="w-full text-sm text-muted-foreground italic">
            {t('workflow.noActions', 'Không có hành động nào khả dụng cho trạng thái hiện tại.')}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-2 py-4 px-2 border-b border-border bg-muted/20">
        {statusSection}
        <div className="w-full mb-2 text-sm font-medium text-primary">
          {t('workflow.availableActions', 'Hành động có sẵn:')}
        </div>
        <div className="flex flex-wrap gap-2">
          {(transitionsData?.data?.core_core_dynamic_workflow_transitions || []).map((transition: { id: string, name: string, form_id: string, to_status_id: string }) => (
            <TransitionFormDialog
              key={transition.id}
              transitionId={transition.id}
              recordId={selectedSubmission?.id || ''}
              transitionName={transition.name}
              onSubmit={() => {
                // Đóng dialog và reload dữ liệu sau khi thực hiện transition
                setDialogOpen(false);
                // Reload data nếu cần
              }}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 bg-background hover:bg-primary hover:text-white transition-colors"
                >
                  {transition.name}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              }
            />
          ))}
        </div>
      </div>
    );
  };

  // Ưu tiên sử dụng trường dữ liệu từ API fetchMenuViewForm
  const viewFormFields = useMemo(() => {
    // Ưu tiên sử dụng formData từ prop, nếu không có thì dùng formDataFromAPI
    const formDataToUse = formData || formDataFromAPI;
    
    if (formDataToUse?.data?.core_core_dynamic_menu_forms?.[0]?.core_dynamic_form?.core_dynamic_form_fields) {
      return formDataToUse.data.core_core_dynamic_menu_forms[0].core_dynamic_form.core_dynamic_form_fields.map(
        (ff: any) => ff.core_dynamic_field?.name
      ).filter(Boolean);
    }
    return [];
  }, [formData, formDataFromAPI]);
  
  // Render chế độ xem dạng bảng
  const renderTableView = () => {
    // Sử dụng trường từ API nếu có, nếu không sử dụng các trường từ dữ liệu
    const fieldNames = viewFormFields.length > 0 ? viewFormFields : getUniqueFieldTypes();
    
    // Responsive table với hai phiên bản: desktop và mobile
    return (
      <div className="w-full rounded-md border border-border">
        {/* Phiên bản desktop - hiển thị bảng đầy đủ với scroll cả ngang và dọc */}
        <div className="w-full overflow-auto rounded-md">
          <table className="w-full border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-muted/70 text-primary-foreground">
                {/* Cố định cột code */}
                <th className="sticky left-0 bg-muted/70 p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-r border-border whitespace-nowrap z-10">
                  <div className="flex items-center">
                    <span className="inline-block normal-case">Code</span>
                  </div>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-r border-border whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="inline-block normal-case">Trạng thái</span>
                  </div>
                </th>
                {fieldNames.map((fieldName: string) => (
                  <th key={fieldName} className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-r border-border whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="inline-block normal-case">{fieldName}</span>
                    </div>
                  </th>
                ))}
                {/* Cố định cột thao tác bên phải */}
                <th className="sticky right-0 bg-muted/70 p-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border whitespace-nowrap z-10">
                  <div className="flex items-center justify-center">
                    <span className="inline-block normal-case">{t('actions.actions', 'Thao tác')}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {filteredData.map((submission, rowIndex) => {
                if (!Array.isArray(submission.data)) return null;
                
                // Row background classes alternate
                const rowBgClass = rowIndex % 2 === 0 ? 'bg-background/40' : 'bg-background/80';
                
                return (
                  <tr 
                    key={submission.id} 
                    className={`group transition-colors duration-150 ${rowBgClass} hover:bg-primary/5`}
                  >
                    {/* Cột code - cố định bên trái */}
                    <td className="sticky left-0 p-3 border-r border-border text-sm relative whitespace-nowrap z-10">
                      <div className={`relative px-2 py-1 ${rowBgClass}`}>
                        <div className="font-mono">
                          {submission.code || (submission.id ? submission.id.substring(0, 8) : '-')}
                        </div>
                      </div>
                    </td>
                    
                    {/* Cột trạng thái */}
                    <td className="p-3 border-r border-border text-sm relative whitespace-nowrap">
                      <div className="relative">
                        <div>
                          {submission.core_dynamic_status ? (
                            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {submission.core_dynamic_status.name || '-'}
                            </span>
                          ) : '-'}
                        </div>
                      </div>
                    </td>
                    
                    {/* Các cột dữ liệu */}
                    {fieldNames.map((fieldName: string) => {
                      const field = submission.data.find(
                        (f: FieldData) => f.name === fieldName
                      );
                      
                      return (
                        <td 
                          key={`${submission.id}-${fieldName}`} 
                          className={`p-3 border-r border-border text-sm ${
                            field && !readOnly ? 'cursor-pointer hover:bg-primary/10' : ''
                          }`}
                          onClick={() => field && !readOnly && handleEditField(submission, field.id)}
                        >
                          {field ? (
                            <div className="relative w-full min-w-[200px]">
                              <div className="break-all whitespace-pre-wrap pr-8">
                                {typeof field.value === 'string' 
                                  ? (
                                    <div className="text-sm text-muted-foreground">
                                      {field.value || <span className="italic text-xs">Chưa có dữ liệu</span>}
                                    </div>
                                  )
                                  : Array.isArray(field.value) 
                                    ? field.value.length > 0 
                                      ? (
                                        <div className="flex flex-wrap gap-1">
                                          {field.value.map((v: string, i: number) => (
                                            <span 
                                              key={i} 
                                              className="inline-flex items-center px-2 py-1 bg-primary/10 text-sm rounded break-all"
                                            >
                                              {v}
                                            </span>
                                          ))}
                                        </div>
                                      )
                                      : <span className="text-muted-foreground italic text-xs">Chưa có dữ liệu</span>
                                    : (
                                      <div className="text-sm text-muted-foreground">
                                        {String(field.value) || <span className="italic text-xs">Chưa có dữ liệu</span>}
                                      </div>
                                    )}
                              </div>
                              {!readOnly && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                  <Edit className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground break-words">-</span>
                          )}
                        </td>
                      );
                    })}
                    
                    {/* Cột thao tác - cố định bên phải */}
                    <td className="sticky right-0 p-2 text-center z-10">
                      <div className={`flex justify-center gap-1 px-2 py-1 ${rowBgClass}`}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleView(submission)}
                          className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!readOnly && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(submission)}
                            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render chế độ xem dạng card
  // Render chế độ xem dạng card theo yêu cầu:
  // - Nền trắng
  // - Bóng đổ
  // - Bo góc
  // - Có padding
  // - Mỗi dòng là key-value
  // - Có nút xem chi tiết ở cuối card
  const renderCardView = () => {
    return (
      <div className="space-y-4 w-full overflow-auto">
        {filteredData.map((submission) => (
          <div 
            key={submission.id} 
            className="group mb-4 p-4 border dark:border-gray-700 bg-card dark:bg-card rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
          >
            {Array.isArray(submission.data) ? (
              <div className="space-y-2">
                {/* Header với code và status */}
                <div className="flex justify-between items-center mb-3">
                  <span className="font-mono font-medium text-sm">
                    {submission.code || (submission.id ? submission.id.substring(0, 8) : '-')}
                  </span>
                  {submission.core_dynamic_status ? (
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {submission.core_dynamic_status.name || '-'}
                    </span>
                  ) : '-'}
                </div>
                
                {/* Field data trong format key-value */}
                {submission.data.map((field: FieldData) => (
                  <div 
                    key={field.id} 
                    className="border-b border-gray-100 py-2 last:border-b-0"
                    onClick={() => !readOnly && handleEditField(submission, field.id)}
                    title={readOnly ? undefined : t('submission.clickToEdit', 'Nhấp để chỉnh sửa trường này')}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm text-primary mb-2 inline-flex items-center">
                        {field.name}
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {field.field_type}
                        </span>
                      </span>
                      {!readOnly && (
                        <Edit className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity duration-200" />
                      )}
                    </div>
                    <div className="mt-1">
                      {typeof field.value === 'string' 
                        ? (
                          <div className="break-all text-sm text-muted-foreground whitespace-pre-wrap">
                            {field.value || <span className="italic text-xs">Chưa có dữ liệu</span>}
                          </div>
                        )
                        : Array.isArray(field.value) 
                          ? field.value.length > 0 
                            ? (
                              <div className="flex flex-wrap gap-1">
                                {field.value.map((v: string, i: number) => (
                                  <span 
                                    key={i} 
                                    className="inline-flex items-center px-2 py-1 bg-primary/10 text-sm rounded break-all"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            )
                            : <span className="text-muted-foreground italic text-xs">Chưa có dữ liệu</span>
                          : (
                            <div className="break-all text-sm text-muted-foreground whitespace-pre-wrap">
                              {String(field.value) || <span className="italic text-xs">Chưa có dữ liệu</span>}
                            </div>
                          )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs overflow-auto max-h-40 p-3 bg-muted rounded-md font-mono">
                {JSON.stringify(submission.data, null, 2)}
              </pre>
            )}
            <div className="flex justify-end gap-2 mt-6 pt-3 border-t">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleView(submission)}
                className="flex items-center hover:bg-primary/10 hover:text-primary transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                {t('actions.view', 'Xem')}
              </Button>
              {!readOnly && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEdit(submission)}
                  className="flex items-center border-primary/20 hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {t('actions.edit', 'Sửa')}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-card w-full h-full flex flex-col border shadow-sm overflow-hidden overflow-x-hidden">
        <div className="py-3 px-4 bg-muted/30 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
          <h3 className="text-lg font-semibold text-primary">
            {t('submission.title', 'Dữ liệu đã nộp')}
          </h3>
        </div>

        {/* Thanh tìm kiếm - flex-shrink-0 để không bị co khi content dài */}
        <div className="px-4 py-3 border-b border-border/80 bg-background/70 flex-shrink-0">
          <div className="flex flex-col gap-3 items-start">
            <div className={`relative w-full transition-all duration-200`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('search.placeholder', 'Tìm kiếm trong dữ liệu...')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className="w-full pl-9 bg-background border-muted pr-10 focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

          </div>
          
          {/* Hiển thị kết quả tìm kiếm */}
          {searchQuery.trim() && (
            <div className="mt-2 text-sm text-muted-foreground">
              {t('search.results', 'Hiển thị {count} kết quả cho "{query}"', { 
                count: filteredData.length,
                query: searchQuery.trim()
              })}
            </div>
          )}
        </div>
        
        {/* Hiển thị các action buttons */}
        {renderActionButtons()}
        
        <div className="p-4 flex-1 overflow-auto overflow-x-hidden">
          {isLoading ? (
          <div className="py-20 px-4 text-center h-full flex items-center justify-center">
            <div className="mx-auto max-w-md flex flex-col items-center">
              <div className="relative w-16 h-16 mb-4">
                <svg className="animate-spin h-16 w-16 text-primary/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="text-lg font-medium text-foreground">{t('loading.title', 'Đang tải dữ liệu...')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('loading.description', 'Vui lòng đợi trong giây lát')}</p>
            </div>
          </div>
        ) : data.length === 0 ? (
            <div className="py-20 px-4 text-center bg-background/50 rounded-lg border border-dashed">
              <div className="mx-auto max-w-md">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="42" 
                  height="42" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mx-auto mb-4 text-muted-foreground/50"
                >
                  <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2z"></path>
                  <path d="M7 7h10"></path>
                  <path d="M7 11h10"></path>
                  <path d="M7 15h4"></path>
                </svg>
                <p className="text-muted-foreground font-medium mb-2">
                  {t('submission.noData', 'Chưa có dữ liệu nào được gửi')}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {t('submission.noDataDescription', 'Các biểu mẫu đã nộp sẽ hiển thị ở đây.')}
                </p>
              </div>
            </div>
          ) : filteredData.length === 0 && (searchQuery || activeFilters.length > 0) ? (
            <div className="py-16 px-4 text-center bg-background/50 rounded-lg border border-dashed">
              <div className="mx-auto max-w-md">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="42" 
                  height="42" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="mx-auto mb-4 text-muted-foreground/50"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
                <p className="text-muted-foreground font-medium mb-2">
                  {t('search.noResults', 'Không tìm thấy kết quả nào')}
                </p>
                <p className="text-sm text-muted-foreground/70">
                  {t('search.noResultsDescription', 'Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc để xem tất cả dữ liệu.')}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => { setSearchQuery(''); setActiveFilters([]); }}
                  className="mt-4 border-primary/20 hover:border-primary hover:bg-primary/10 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t('search.resetFilters', 'Xóa tất cả bộ lọc')}
                </Button>
              </div>
            </div>
          ) : (
            currentViewMode === 'table' ? renderTableView() : renderCardView()
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-none md:max-w-5xl lg:max-w-6xl w-[95vw] sm:w-[calc(100vw-4rem)] max-h-[90vh] overflow-y-auto border-none shadow-lg p-0 gap-0">
          <DialogHeader className="border-b">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-bold text-primary">
                  {isEditing 
                    ? editedData.length === 1
                      ? t('submission.editSingleField', 'Chỉnh sửa trường: {fieldName}', { fieldName: editedData[0]?.name })
                      : t('submission.editData', 'Chỉnh sửa dữ liệu biểu mẫu')
                    : editedData.length === 1
                      ? t('submission.viewSingleField', 'Xem trường: {fieldName}', { fieldName: editedData[0]?.name })
                      : t('submission.viewData', 'Xem dữ liệu biểu mẫu')}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  {isEditing 
                    ? editedData.length === 1
                      ? t('submission.editSingleFieldDescription', 'Chỉnh sửa giá trị cho trường này.')
                      : t('submission.editDescription', 'Chỉnh sửa thông tin của biểu mẫu đã nộp.')
                    : t('submission.viewDescription', 'Chi tiết thông tin của biểu mẫu đã nộp.')}
                </DialogDescription>
              </div>
              
              {/* Hiển thị trạng thái */}
              {selectedSubmission && selectedSubmission.core_dynamic_status && (
                <div className="flex items-center">
                  <Badge variant="outline" className="bg-primary/10 text-primary font-semibold px-3 py-1 text-xs">
                    {selectedSubmission.core_dynamic_status.name || 'Chưa có trạng thái'}
                  </Badge>
                </div>
              )}
            </div>
          </DialogHeader>
          
          {/* Hiển thị action buttons workflow từ transitions */}
          {!isEditing && workflowId && (
            <>
              {transitionsData?.data?.core_core_dynamic_workflow_transitions?.length > 0 ? (
                <div className="flex flex-wrap gap-2 py-3 px-4 border-b border-border bg-muted/20">
                  <div className="w-full mb-1 text-sm font-medium text-primary">
                    {t('workflow.availableActions', 'Hành động có sẵn:')}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {transitionsData?.data?.core_core_dynamic_workflow_transitions?.map((transition: any) => (
                      <TransitionFormDialog
                        key={transition.id}
                        transitionId={transition.id}
                        recordId={selectedSubmission?.id || ''}
                        transitionName={transition.name}
                        onSubmit={() => {
                          // Đóng dialog sau khi thực hiện transition
                          setDialogOpen(false);
                        }}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1 bg-background hover:bg-primary hover:text-white transition-colors"
                          >
                            {transition.name}
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        }
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 py-3 px-4 border-b border-border bg-muted/20">
                  <div className="w-full text-sm text-muted-foreground italic">
                    {t('workflow.loading', 'Đang tải các hành động cho trạng thái...')}
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="divide-y divide-border px-6 py-0">
            {editedData.map((field, index) => (
              <div 
                key={field.id} 
                className={`pb-3 ${isEditing ? 'hover:bg-muted/40' : ''} rounded-md transition-colors`}
              >
                <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-6 pt-3">
                  <div className="w-full md:w-1/3 flex items-center">
                    <span className="font-medium text-sm text-primary inline-flex items-center flex-wrap">
                      {field.name}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {field.field_type}
                      </span>
                    </span>
                  </div>
                  <div className="w-full md:w-2/3 flex-1 bg-slate-50 dark:bg-slate-800/50 py-2 px-3 rounded-md">
                    {renderFieldInput(field, index)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex justify-between border-t">
            {!readOnly && (
              <>
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-1 border-gray-300"
                    >
                      <X className="h-4 w-4" />
                      <span>{t('actions.cancel', 'Hủy')}</span>
                    </Button>
                    <Button 
                      onClick={handleSave}
                      className="flex items-center gap-1 bg-primary hover:bg-primary/90 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{t('actions.save', 'Lưu')}</span>
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 bg-primary hover:bg-primary/90 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{t('actions.edit', 'Chỉnh sửa')}</span>
                  </Button>
                )}
              </>
            )}
            {(readOnly || !isEditing) && (
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
                className="flex items-center gap-1 border-gray-300"
              >
                <span>{t('actions.close', 'Đóng')}</span>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}