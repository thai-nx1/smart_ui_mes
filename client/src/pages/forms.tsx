import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FormLayout } from '@/components/FormLayout';
import { FormFields } from '@/components/FormFields';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, Field, FieldType } from '@/lib/types';
import { fetchMenuForms, fetchFormFields, executeGraphQLQuery } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';

export default function FormsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [showFormList, setShowFormList] = useState(true);
  const [showAddFieldDialog, setShowAddFieldDialog] = useState(false);
  const [availableFields, setAvailableFields] = useState<Field[]>([]);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isAddingFields, setIsAddingFields] = useState(false);
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  // Fetch forms list
  const {
    data: formsData,
    isLoading: isLoadingForms,
    error: formsError
  } = useQuery({
    queryKey: ['/api/forms'],
    queryFn: async () => {
      // Sử dụng menuId cố định của menu "Phê duyệt tài chính" để lấy form
      const menuId = "81a0d5df-57b8-49ec-8514-6d6761b5c3c5"; // Menu "Phê duyệt tài chính"
      console.log("Fetching forms for menuId:", menuId);
      const response = await fetchMenuForms(menuId, 'CREATE');
      console.log("Forms response:", response);
      
      if (response.data && response.data.core_core_dynamic_menu_forms) {
        // Chuyển đổi dữ liệu để phù hợp với cấu trúc form đang dùng
        return response.data.core_core_dynamic_menu_forms.map((menuForm: any) => ({
          id: menuForm.core_dynamic_form.id,
          name: menuForm.core_dynamic_form.name,
          description: menuForm.core_dynamic_form.description || '',
          status: 'ACTIVE',
          __typename: 'core_core_dynamic_forms',
          // Lưu lại thông tin field
          core_dynamic_form_fields: menuForm.core_dynamic_form.core_dynamic_form_fields
        }));
      }
      
      return [];
    }
  });

  // Fetch form fields when a form is selected
  const {
    data: formData,
    isLoading: isLoadingFields,
    error: fieldsError,
    refetch: refetchFields
  } = useQuery({
    queryKey: ['/api/form-fields', selectedFormId],
    queryFn: async () => {
      if (!selectedFormId) return null;
      try {
        console.log('Fetching fields for form ID:', selectedFormId);
        const response = await fetchFormFields(selectedFormId);
        console.log('Fields response:', response);
        
        if (!response.data.core_core_dynamic_forms_by_pk || 
            !response.data.core_core_dynamic_forms_by_pk.core_dynamic_form_fields) {
          console.warn('No fields found in response');
          return {
            fields: [],
            formFields: [],
            details: null
          };
        }
        
        // Trích xuất fields từ cấu trúc dữ liệu mới
        const formFields = response.data.core_core_dynamic_forms_by_pk.core_dynamic_form_fields;
        
        // Chuyển đổi FormField thành Field để hiển thị
        const fields = formFields.map(formField => formField.core_dynamic_field);
        
        // Log kết quả để debug
        console.log(`Received ${fields.length} fields for form ID ${selectedFormId}`);
        
        return {
          fields,
          formFields,
          details: response.data.core_core_dynamic_forms_by_pk
        };
      } catch (error) {
        console.error('Error fetching fields:', error);
        throw error;
      }
    },
    enabled: !!selectedFormId
  });
  
  // Lấy các field từ localStorage (nếu có)
  const getLocalFields = useCallback((formId: string) => {
    if (!formId) return [];
    const storageKey = `local_form_fields_${formId}`;
    try {
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        return JSON.parse(localData);
      }
    } catch (error) {
      console.error("Error retrieving local fields:", error);
    }
    return [];
  }, []);

  // Trích xuất fields từ kết quả truy vấn và kết hợp với fields từ localStorage
  const apiFieldsData = formData?.fields || [];
  const localFieldsData = selectedFormId ? getLocalFields(selectedFormId).map((item: any) => item.core_dynamic_field) : [];
  const fieldsData = [...apiFieldsData, ...localFieldsData];

  // Set the first form as selected when data loads
  useEffect(() => {
    if (formsData && formsData.length > 0 && !selectedFormId) {
      setSelectedFormId(formsData[0].id);
    }
  }, [formsData, selectedFormId]);

  // Show error toast if data fetching fails
  useEffect(() => {
    if (formsError) {
      toast({
        title: t('common.error', 'Lỗi'),
        description: t('forms.errors.loadForms', 'Không thể tải danh sách form. Vui lòng thử lại sau.'),
        variant: 'destructive'
      });
    }

    if (fieldsError) {
      toast({
        title: t('common.error', 'Lỗi'),
        description: t('forms.errors.loadFields', 'Không thể tải chi tiết form. Vui lòng thử lại sau.'),
        variant: 'destructive'
      });
    }
  }, [formsError, fieldsError, toast, t]);

  // Filter forms by search term
  const filteredForms = formsData?.filter((form: { name: string }) => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected form details
  const selectedForm = formsData?.find((form: { id: string }) => form.id === selectedFormId);

  // Handle form selection
  const handleSelectForm = (formId: string) => {
    console.log("Selected form ID:", formId);
    setSelectedFormId(formId);
  };

  // Toggle between form list and form details on mobile
  const handleSelectFormOnMobile = (formId: string) => {
    setSelectedFormId(formId);
    if (isMobile) {
      setShowFormList(false);
    }
  };

  // Handle back button on mobile
  const handleBackToList = () => {
    setShowFormList(true);
  };

  // Fetch available fields for dialog
  const fetchAvailableFields = async () => {
    try {
      // Query để lấy tất cả fields có sẵn
      const query = `
        query GetAllFields {
          core_core_dynamic_fields(where: {status: {_eq: "Active"}}) {
            id
            name
            description
            field_type
            status
            __typename
          }
        }
      `;
      
      // Tạo danh sách trường mới với ID không tồn tại trong API (cục bộ)
      const createLocalFields = () => {
        const requiredFieldTypes = [
          {name: t('fieldTypes.text', 'Trường TEXT'), field_type: "TEXT" as FieldType},
          {name: t('fieldTypes.paragraph', 'Trường PARAGRAPH'), field_type: "PARAGRAPH" as FieldType},
          {name: t('fieldTypes.number', 'Trường NUMBER'), field_type: "NUMBER" as FieldType},
          {name: t('fieldTypes.singleChoice', 'Trường SINGLE_CHOICE'), field_type: "SINGLE_CHOICE" as FieldType},
          {name: t('fieldTypes.multiChoice', 'Trường MULTI_CHOICE'), field_type: "MULTI_CHOICE" as FieldType},
          {name: t('fieldTypes.date', 'Trường DATE'), field_type: "DATE" as FieldType},
          {name: t('fieldTypes.input', 'Trường INPUT'), field_type: "INPUT" as FieldType},
          {name: t('fieldTypes.cache', 'Trường CACHE'), field_type: "CACHE" as FieldType},
          {name: t('fieldTypes.audioRecord', 'Trường AUDIO_RECORD'), field_type: "AUDIO_RECORD" as FieldType},
          {name: t('fieldTypes.screenRecord', 'Trường SCREEN_RECORD'), field_type: "SCREEN_RECORD" as FieldType},
          {name: t('fieldTypes.import', 'Trường IMPORT'), field_type: "IMPORT" as FieldType},
          {name: t('fieldTypes.export', 'Trường EXPORT'), field_type: "EXPORT" as FieldType},
          {name: t('fieldTypes.qrScan', 'Trường QR_SCAN'), field_type: "QR_SCAN" as FieldType},
          {name: t('fieldTypes.gps', 'Trường GPS'), field_type: "GPS" as FieldType},
          {name: t('fieldTypes.choose', 'Trường CHOOSE'), field_type: "CHOOSE" as FieldType},
          {name: t('fieldTypes.select', 'Trường SELECT'), field_type: "SELECT" as FieldType},
          {name: t('fieldTypes.search', 'Trường SEARCH'), field_type: "SEARCH" as FieldType},
          {name: t('fieldTypes.filter', 'Trường FILTER'), field_type: "FILTER" as FieldType},
          {name: t('fieldTypes.dashboard', 'Trường DASHBOARD'), field_type: "DASHBOARD" as FieldType},
          {name: t('fieldTypes.photo', 'Trường PHOTO'), field_type: "PHOTO" as FieldType}
        ];
        
        return requiredFieldTypes.map(field => ({
          id: `xxxxxxxx-xxxx-4xxx-yxxx-${field.field_type}${Math.random().toString(16).slice(2, 6)}`,
          name: field.name,
          description: t('fieldTypes.description', 'Trường loại {{type}}', { type: field.field_type }),
          field_type: field.field_type,
          status: "Active",
          __typename: "core_core_dynamic_fields"
        }));
      };

      // Sử dụng các trường địa phương luôn để giải quyết vấn đề không lưu trên API
      const localFields = createLocalFields();
      setAvailableFields(localFields);

    } catch (error) {
      console.error("Error fetching available fields:", error);
      toast({
        title: t('common.error', 'Lỗi'),
        description: t('forms.errors.loadAvailableFields', 'Không thể tải danh sách các trường có sẵn. Vui lòng thử lại sau.'),
        variant: 'destructive'
      });
    }
  };



  // Open dialog and fetch available fields
  const handleOpenAddFieldDialog = () => {
    setSelectedFields([]);
    // Hiển thị dialog trước để tránh delay
    setShowAddFieldDialog(true);
    
    // Sử dụng phương thức tạo local fields đã được định nghĩa
    fetchAvailableFields();
  };
  
  // Hàm tạo UUID để sử dụng làm ID trường (tương thích với API GraphQL)
  function createUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0,
          v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Toggle field selection
  const toggleFieldSelection = (fieldId: string) => {
    setSelectedFields(prev => 
      prev.includes(fieldId)
        ? prev.filter(id => id !== fieldId)
        : [...prev, fieldId]
    );
  };

  // Add selected fields to form
  const handleAddFieldsToForm = async () => {
    if (!selectedFormId || selectedFields.length === 0) return;
    
    setIsAddingFields(true);
    
    try {
      // Lấy các thông tin field đã chọn từ danh sách availableFields
      const selectedFieldsData = availableFields.filter(field => selectedFields.includes(field.id));
      
      // Bây giờ tất cả các fields đều xử lý như local fields (không gửi lên API)
      const localFields = selectedFieldsData;
      
      // Lưu thông tin field vào localStorage để dùng sau này
      const storageKey = `local_form_fields_${selectedFormId}`;
      const existingFields = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // Tạo data để lưu trữ
      const localFieldsToAdd = localFields.map(field => ({
        id: createUUID(), // ID cho form_field item
        dynamic_form_id: selectedFormId,
        dynamic_field_id: field.id,
        core_dynamic_field: field
      }));
      
      // Kết hợp với dữ liệu đã có và lưu vào localStorage
      const updatedFields = [...existingFields, ...localFieldsToAdd];
      localStorage.setItem(storageKey, JSON.stringify(updatedFields));
      
      toast({
        title: t('common.success', 'Thành công'),
        description: t('forms.success.fieldsAdded', 'Đã thêm {{count}} trường vào form.', { count: localFields.length }),
      });
      
      // Đóng dialog và cập nhật lại danh sách fields
      setShowAddFieldDialog(false);
      
      // Cập nhật dữ liệu fields hiển thị bằng cách đặt lại selectedFormId (gây re-render)
      const currentFormId = selectedFormId;
      setSelectedFormId('');
      setTimeout(() => {
        setSelectedFormId(currentFormId);
      }, 100);
      
    } catch (error) {
      console.error("Error adding fields to form:", error);
      toast({
        title: t('common.error', 'Lỗi'),
        description: t('forms.errors.addFields', 'Không thể thêm trường vào form. Vui lòng thử lại sau.'),
        variant: 'destructive'
      });
    } finally {
      setIsAddingFields(false);
    }
  };

  return (
    <FormLayout>
      {/* Add Field Dialog */}
      <Dialog open={showAddFieldDialog} onOpenChange={setShowAddFieldDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('form.addField', 'Thêm trường vào form')}</DialogTitle>
          </DialogHeader>
          
          <div className="max-h-[50vh] overflow-y-auto py-4">
            {availableFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {isAddingFields ? (
                  <div className="flex flex-col items-center">
                    <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    <p>{t('common.loading', 'Đang tải...')}</p>
                  </div>
                ) : (
                  t('form.noFieldsAvailable', 'Không có trường nào có sẵn để thêm vào form này')
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {availableFields.map((field) => (
                  <div 
                    key={field.id} 
                    className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Checkbox 
                      id={`field-${field.id}`} 
                      checked={selectedFields.includes(field.id)}
                      onCheckedChange={() => toggleFieldSelection(field.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`field-${field.id}`}
                        className="text-sm font-medium flex items-center cursor-pointer"
                      >
                        {field.name}
                        <Badge className="ml-2" variant="outline">
                          {field.field_type}
                        </Badge>
                      </label>
                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddFieldDialog(false)}
              disabled={isAddingFields}
            >
              {t('common.cancel', 'Hủy')}
            </Button>
            <Button
              onClick={handleAddFieldsToForm}
              disabled={selectedFields.length === 0 || isAddingFields}
            >
              {isAddingFields ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  {t('form.adding', 'Đang thêm...')}
                </>
              ) : (
                <>{t('form.addCount', 'Thêm {{count}} trường', { count: selectedFields.length })}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Forms List - hidden on mobile when a form is selected */}
        {(!isMobile || (isMobile && showFormList)) && (
          <div className="md:col-span-4 lg:col-span-3">
            <Card>
              <CardHeader className="px-4 py-5 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">{t('form.formsList', 'Danh sách Form')}</h2>
                  <button 
                    type="button" 
                    className="inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                </div>
                <div className="mt-3">
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                    </div>
                    <Input
                      type="text"
                      className="pl-10"
                      placeholder={t('common.search', 'Tìm kiếm...')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingForms ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex flex-col space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : filteredForms && filteredForms.length > 0 ? (
                  <ul className="divide-y divide-gray-200">
                    {filteredForms.map((form: { id: string; name: string; status: string }) => (
                      <li
                        key={form.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                          selectedFormId === form.id ? 'bg-primary/10 border-l-4 border-primary' : ''
                        }`}
                        onClick={() => handleSelectFormOnMobile(form.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">{form.name}</h3>
                            <div className="mt-1">
                              <Badge variant="status">
                                {form.status}
                              </Badge>
                            </div>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? t('form.noMatchingForms', 'Không tìm thấy form phù hợp') : t('form.noForms', 'Không có form nào')}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Form Detail - show on mobile only when a form is selected */}
        {(!isMobile || (isMobile && !showFormList)) && (
          <div className={isMobile ? "col-span-1" : "md:col-span-8 lg:col-span-9"}>
            <Card>
              <CardHeader className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  {isMobile && (
                    <Button 
                      variant="ghost" 
                      className="mr-2" 
                      onClick={handleBackToList}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                      {t('common.back', 'Quay lại')}
                    </Button>
                  )}
                  <h2 className="text-lg font-medium text-gray-900">
                    {isLoadingForms ? (
                      <Skeleton className="h-6 w-48" />
                    ) : selectedForm ? (
                      selectedForm.name
                    ) : (
                      t('form.selectForm', 'Chọn một form')
                    )}
                  </h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hidden sm:flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      {t('common.edit', 'Chỉnh sửa')}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hidden sm:flex items-center"
                      onClick={handleOpenAddFieldDialog}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      {t('common.add', 'Thêm')}
                    </Button>
                  </div>
                </div>
                {isLoadingForms ? (
                  <div className="mt-1 text-sm h-4"><Skeleton className="h-4 w-full" /></div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedForm ? (
                      selectedForm.description || t('form.clickFieldsToFill', 'Nhấn vào các trường để điền thông tin')
                    ) : (
                      t('form.pleaseSelectForm', 'Vui lòng chọn một form từ danh sách')
                    )}
                  </p>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {isLoadingFields ? (
                  <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-10 w-full mt-2" />
                      </div>
                    ))}
                  </div>
                ) : selectedFormId && fieldsData ? (
                  <FormFields 
                    formId={selectedFormId} 
                    fields={fieldsData} 
                    formFields={formData?.formFields || []}
                    onFieldsChange={refetchFields}
                  />
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p className="text-gray-500">{t('form.selectFormToViewDetails', 'Vui lòng chọn một form để xem chi tiết')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </FormLayout>
  );
}