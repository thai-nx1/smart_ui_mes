import React, { useState, useEffect } from 'react';
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
import { Form, Field } from '@/lib/types';
import { fetchForms, fetchFormFields, executeGraphQLQuery } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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

  // Fetch forms list
  const {
    data: formsData,
    isLoading: isLoadingForms,
    error: formsError
  } = useQuery({
    queryKey: ['/api/forms'],
    queryFn: async () => {
      const response = await fetchForms();
      return response.data.core_core_dynamic_forms;
    }
  });

  // Fetch form fields when a form is selected
  const {
    data: fieldsData,
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
          return [];
        }
        
        // Trích xuất fields từ cấu trúc dữ liệu mới
        const formFields = response.data.core_core_dynamic_forms_by_pk.core_dynamic_form_fields;
        
        // Chuyển đổi FormField thành Field để hiển thị
        const fields = formFields.map(formField => formField.core_dynamic_field);
        
        // Log kết quả để debug
        console.log(`Received ${fields.length} fields for form ID ${selectedFormId}`);
        
        return fields;
      } catch (error) {
        console.error('Error fetching fields:', error);
        throw error;
      }
    },
    enabled: !!selectedFormId
  });

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
        title: 'Lỗi',
        description: 'Không thể tải danh sách form. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    }

    if (fieldsError) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải chi tiết form. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    }
  }, [formsError, fieldsError, toast]);

  // Filter forms by search term
  const filteredForms = formsData?.filter(form => 
    form.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected form details
  const selectedForm = formsData?.find(form => form.id === selectedFormId);

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

      const response = await executeGraphQLQuery<any>(query);
      if (response?.data?.core_core_dynamic_fields) {
        const allFields = response.data.core_core_dynamic_fields;
        
        // Nếu đã có fieldsData (fields đã có trong form), lọc ra các fields chưa được thêm vào
        if (fieldsData && fieldsData.length > 0) {
          const existingFieldIds = fieldsData.map((field: Field) => field.id);
          const filteredFields = allFields.filter((field: Field) => !existingFieldIds.includes(field.id));
          setAvailableFields(filteredFields);
        } else {
          setAvailableFields(allFields);
        }
      }
    } catch (error) {
      console.error("Error fetching available fields:", error);
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách các trường có sẵn. Vui lòng thử lại sau.',
        variant: 'destructive'
      });
    }
  };

  // Open dialog and fetch available fields
  const handleOpenAddFieldDialog = () => {
    setSelectedFields([]);
    fetchAvailableFields();
    setShowAddFieldDialog(true);
  };

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
      // Tạo các đối tượng form_field để thêm vào
      const formFieldsToAdd = selectedFields.map(fieldId => ({
        dynamic_form_id: selectedFormId,
        dynamic_field_id: fieldId
      }));
      
      // Tạo mutation để thêm trường vào form
      const mutation = `
        mutation AddFieldsToForm($objects: [core_core_dynamic_form_fields_insert_input!]!) {
          insert_core_core_dynamic_form_fields(objects: $objects) {
            affected_rows
            returning {
              id
              dynamic_field_id
              dynamic_form_id
            }
          }
        }
      `;
      
      const response = await executeGraphQLQuery<any>(mutation, { objects: formFieldsToAdd });
      
      if (response?.data?.insert_core_core_dynamic_form_fields?.affected_rows > 0) {
        toast({
          title: 'Thành công',
          description: `Đã thêm ${response.data.insert_core_core_dynamic_form_fields.affected_rows} trường vào form.`,
        });
        
        // Đóng dialog và cập nhật lại danh sách fields
        setShowAddFieldDialog(false);
        
        // Refresh fields data để hiển thị các trường mới được thêm vào
        refetchFields();
      } else {
        throw new Error('Không thể thêm trường vào form');
      }
    } catch (error) {
      console.error("Error adding fields to form:", error);
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm trường vào form. Vui lòng thử lại sau.',
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
            <DialogTitle>Thêm trường vào form</DialogTitle>
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
                    <p>Đang tải danh sách trường...</p>
                  </div>
                ) : (
                  'Không có trường nào có sẵn để thêm vào form này'
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
              Hủy
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
                  Đang thêm...
                </>
              ) : (
                <>Thêm {selectedFields.length} trường</>
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
                  <h2 className="text-lg font-medium text-gray-900">Danh sách Form</h2>
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
                      placeholder="Tìm kiếm form..."
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
                    {filteredForms.map((form) => (
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
                    {searchTerm ? 'Không tìm thấy form phù hợp' : 'Không có form nào'}
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
                      Quay lại
                    </Button>
                  )}
                  <h2 className="text-lg font-medium text-gray-900">
                    {isLoadingForms ? (
                      <Skeleton className="h-6 w-48" />
                    ) : selectedForm ? (
                      selectedForm.name
                    ) : (
                      'Chọn một form'
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
                      Chỉnh sửa
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
                      Thêm
                    </Button>
                  </div>
                </div>
                {isLoadingForms ? (
                  <div className="mt-1 text-sm h-4"><Skeleton className="h-4 w-full" /></div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedForm ? (
                      selectedForm.description || 'Nhấn vào các trường để điền thông tin'
                    ) : (
                      'Vui lòng chọn một form từ danh sách'
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
                  <FormFields formId={selectedFormId} fields={fieldsData} />
                ) : (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    <p className="text-gray-500">Vui lòng chọn một form để xem chi tiết</p>
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