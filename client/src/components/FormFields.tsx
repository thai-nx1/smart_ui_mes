import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { InputField } from '@/components/ui/input-field';
import { Field, FieldType, FormState, FormField } from '@/lib/types';
import { submitFormData, removeFieldFromForm, updateField } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQueryClient } from '@tanstack/react-query';
import { PencilIcon, TrashIcon } from 'lucide-react';

interface FormFieldsProps {
  formId: string;
  fields: Field[];
  formFields?: FormField[]; // Array of form_fields (join table records)
  onFieldsChange?: () => void;
  readOnly?: boolean;
}

export function FormFields({ 
  formId, 
  fields, 
  formFields = [], 
  onFieldsChange, 
  readOnly = false 
}: FormFieldsProps) {
  const { toast } = useToast();
  const [formState, setFormState] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  // State for editing field
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldDescription, setEditFieldDescription] = useState<string>('');
  const [isEditingField, setIsEditingField] = useState(false);

  // State for deleting field
  const [isDeletingField, setIsDeletingField] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<{field: Field, formFieldId: string} | null>(null);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormState(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error when field is changed
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    fields.forEach(field => {
      const value = formState[field.id];
      
      switch (field.field_type) {
        case 'TEXT':
          if (!value || String(value).trim() === '') {
            newErrors[field.id] = 'Vui lòng nhập văn bản';
            isValid = false;
          }
          break;
          
        case 'PARAGRAPH':
          if (!value || String(value).trim() === '') {
            newErrors[field.id] = 'Vui lòng nhập đoạn văn bản';
            isValid = false;
          }
          break;
          
        case 'NUMBER':
          if (value === undefined || value === null || value === '') {
            newErrors[field.id] = 'Vui lòng nhập một số';
            isValid = false;
          }
          break;
          
        case 'SINGLE_CHOICE':
          if (!value) {
            newErrors[field.id] = 'Vui lòng chọn một lựa chọn';
            isValid = false;
          }
          break;
          
        case 'MULTI_CHOICE':
          if (!value || !Array.isArray(value) || value.length === 0) {
            newErrors[field.id] = 'Vui lòng chọn ít nhất một lựa chọn';
            isValid = false;
          }
          break;
          
        case 'DATE':
          if (!value) {
            newErrors[field.id] = 'Vui lòng chọn một ngày';
            isValid = false;
          }
          break;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Lỗi xác thực",
        description: "Vui lòng kiểm tra lại thông tin đã nhập",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Tạo đối tượng dữ liệu cho form submission
      // Cần bao gồm thông tin tên và loại field cho mỗi field
      const enrichedFormData: Record<string, any> = {};
      
      fields.forEach(field => {
        if (formState[field.id] !== undefined) {
          // Chuyển đổi dữ liệu tùy theo loại trường
          let fieldValue = formState[field.id];
          
          // Chuyển đổi giá trị theo loại trường
          if (field.field_type === 'NUMBER' && fieldValue !== undefined) {
            // Chuyển chuỗi sang số
            fieldValue = Number(fieldValue);
          } else if (field.field_type === 'DATE' && fieldValue) {
            // Chuyển ngày sang timestamp (milliseconds)
            if (typeof fieldValue === 'string' && fieldValue.includes('T')) {
              const date = new Date(fieldValue);
              fieldValue = date.getTime(); // Chuyển thành timestamp
            }
          }
          
          enrichedFormData[field.id] = {
            value: fieldValue,
            name: field.name,
            field_type: field.field_type
          };
        }
      });
      
      console.log("Submitting form with enriched data:", enrichedFormData);
      
      await submitFormData({
        formId,
        data: enrichedFormData
      });
      
      // Reset form after successful submission
      setFormState({});
      
      toast({
        title: "Thành công",
        description: "Đã gửi form thành công!",
        variant: "default"
      });
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi form. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormState({});
    setErrors({});
  };

  // Handle opening the edit dialog
  const handleOpenEditDialog = (field: Field) => {
    setEditingField(field);
    setEditFieldName(field.name);
    setEditFieldDescription(field.description || '');
    setIsEditDialogOpen(true);
  };

  // Handle closing the edit dialog
  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingField(null);
    setEditFieldName('');
    setEditFieldDescription('');
  };

  // Handle submitting field edits
  const handleSubmitFieldEdit = async () => {
    if (!editingField) return;
    
    setIsEditingField(true);
    
    try {
      await updateField(editingField.id, {
        name: editFieldName,
        description: editFieldDescription
      });
      
      toast({
        title: "Thành công",
        description: "Đã cập nhật trường thành công!",
      });
      
      // Refresh the form fields
      if (onFieldsChange) {
        onFieldsChange();
      }
      
      handleCloseEditDialog();
    } catch (error) {
      console.error("Error updating field:", error);
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trường. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setIsEditingField(false);
    }
  };

  // Handle opening the delete dialog
  const handleOpenDeleteDialog = (field: Field) => {
    // Kiểm tra xem đây có phải là field lưu trữ cục bộ không (ID bắt đầu bằng 'xxxxxxxx-')
    const isLocalField = field.id.startsWith('xxxxxxxx-');
    
    if (isLocalField) {
      // Không cần form_field ID cho local fields
      setFieldToDelete({
        field,
        formFieldId: field.id // Using field.id directly for localStorage
      });
      setDeleteDialogOpen(true);
    } else {
      // Tìm form_field record đối với field từ API
      const formField = formFields.find(ff => ff.dynamic_field_id === field.id);
      
      if (formField) {
        setFieldToDelete({
          field,
          formFieldId: formField.id
        });
        setDeleteDialogOpen(true);
      } else {
        toast({
          title: "Lỗi",
          description: "Không thể xác định trường để xóa.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle deleting a field
  const handleDeleteField = async () => {
    if (!fieldToDelete) return;
    
    setIsDeletingField(true);
    
    try {
      // Kiểm tra xem đây có phải field lưu trong localStorage không
      const isLocalField = fieldToDelete.field.id.startsWith('xxxxxxxx-');
      
      if (isLocalField) {
        // Xóa trường từ localStorage
        const storageKey = `local_form_fields_${formId}`;
        
        try {
          // Lấy danh sách các trường hiện tại
          const existingFields = JSON.parse(localStorage.getItem(storageKey) || '[]');
          
          // Lọc bỏ trường cần xóa (dựa trên dynamic_field_id)
          const updatedFields = existingFields.filter((item: any) => 
            item.dynamic_field_id !== fieldToDelete.field.id &&
            item.core_dynamic_field.id !== fieldToDelete.field.id
          );
          
          // Lưu lại danh sách đã cập nhật
          localStorage.setItem(storageKey, JSON.stringify(updatedFields));
          
          toast({
            title: "Thành công",
            description: "Đã xóa trường khỏi form!",
          });
          
          // Refresh bằng cách đặt lại formId để tải lại trang
          setTimeout(() => {
            if (onFieldsChange) {
              onFieldsChange();
            }
          }, 100);
        } catch (localError) {
          console.error("Error deleting local field:", localError);
          throw localError;
        }
      } else {
        // Xóa trường từ API
        await removeFieldFromForm(fieldToDelete.formFieldId);
        
        toast({
          title: "Thành công",
          description: "Đã xóa trường khỏi form!",
        });
        
        // Refresh the form fields
        if (onFieldsChange) {
          onFieldsChange();
        }
      }
      
      setDeleteDialogOpen(false);
      setFieldToDelete(null);
    } catch (error) {
      console.error("Error deleting field:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa trường. Vui lòng thử lại sau.",
        variant: "destructive"
      });
    } finally {
      setIsDeletingField(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Edit Field Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa trường</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="name" className="text-right">
                Tên trường
              </label>
              <Input
                id="name"
                value={editFieldName}
                onChange={(e) => setEditFieldName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="description" className="text-right">
                Mô tả
              </label>
              <Textarea
                id="description"
                value={editFieldDescription}
                onChange={(e) => setEditFieldDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
            {editingField && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right">
                  Loại trường
                </label>
                <div className="col-span-3">
                  <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {editingField.field_type}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseEditDialog}
              disabled={isEditingField}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleSubmitFieldEdit}
              disabled={!editFieldName || isEditingField}
            >
              {isEditingField ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Field Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa trường</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa trường <strong>{fieldToDelete?.field.name}</strong> khỏi form này?</p>
            <p className="text-sm text-gray-500 mt-2">Thao tác này không thể hoàn tác.</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeletingField}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteField}
              disabled={isDeletingField}
            >
              {isDeletingField ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Đang xóa...
                </>
              ) : (
                'Xóa trường'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fields.map((field) => (
        <div key={field.id} className="relative">
          {!readOnly && (
            <div className="absolute top-4 right-4 flex space-x-2 z-10 bg-white/90 rounded-lg px-1 shadow-sm">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100"
                onClick={() => handleOpenEditDialog(field)}
                title="Chỉnh sửa trường"
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-gray-100 text-red-500 hover:text-red-600"
                onClick={() => handleOpenDeleteDialog(field)}
                title="Xóa trường"
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
            </div>
          )}
          <InputField
            key={field.id}
            id={field.id}
            name={field.name}
            description={field.description}
            fieldType={field.field_type as FieldType}
            value={formState[field.id]}
            onChange={(value) => handleFieldChange(field.id, value)}
            options={field.options}
            error={errors[field.id]}
          />
        </div>
      ))}

      <div className={`mt-8 ${isMobile ? 'fixed bottom-0 left-0 right-0 flex p-4 bg-white border-t border-gray-200 z-10 space-x-2' : 'flex justify-end'}`}>
        {isMobile ? (
          // Mobile layout
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang gửi...' : 'Gửi Form'}
            </Button>
          </>
        ) : (
          // Desktop layout
          <>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="mr-3"
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Gửi Form
                </>
              )}
            </Button>
          </>
        )}
      </div>
      
      {/* Add padding at the bottom when on mobile to account for fixed buttons */}
      {isMobile && <div className="pb-20"></div>}
    </form>
  );
}
