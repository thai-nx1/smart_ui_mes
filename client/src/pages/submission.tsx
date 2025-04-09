import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { fetchMenuRecords, updateSubmissionForm, submitFormData, fetchAllMenus, fetchMenuViewForm } from '@/lib/api';
import { SubmissionForm, FormSubmission, Menu } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import { SubmissionDataTable } from '@/components/SubmissionDataTable';
import { AddSubmissionDialog } from '@/components/AddSubmissionDialog';
import { useToast } from '@/hooks/use-toast';

export default function SubmissionPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const params = useParams<{ workflowId: string }>();
  const workflowId = params.workflowId;
  
  // Lấy menuId từ query parameter nếu có
  const getQueryParam = (name: string): string | null => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(name);
  };
  const menuIdFromQuery = getQueryParam('menuId');
  
  // Truy vấn để lấy tất cả các menu để tìm menu phù hợp
  const { data: menusData } = useQuery({
    queryKey: ['/api/all-menus'],
    queryFn: async () => {
      const response = await fetchAllMenus();
      return response.data.core_core_dynamic_menus;
    }
  });

  // Tìm submenu từ workflowId hoặc từ menuId trên URL
  const currentSubmenu = menuIdFromQuery 
    ? menusData?.find((menu: Menu) => menu.id === menuIdFromQuery) 
    : menusData?.find((menu: Menu) => menu.workflow_id === workflowId);
    
  const parentMenu = menusData?.find((menu: Menu) => menu.id === currentSubmenu?.parent_id);
  
  // Ưu tiên sử dụng menuId từ query parameter (được truyền qua URL submission?menuId=xxx)
  // Cách xử lý áp dụng cho mọi submenu, giống như cách xử lý cho submenu khiếu nại (ID: "ss")
  const menuIdToUse = menuIdFromQuery || currentSubmenu?.id || "";
  
  console.log("Menu information:", {
    menuIdFromQuery,
    currentSubmenuId: currentSubmenu?.id,
    menuIdToUse,
    workflowId
  });

  // API 1: Sử dụng API QueryMenuRecord để lấy dữ liệu records
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/menu-records', menuIdToUse],
    queryFn: async () => {
      // Gọi API theo cấu trúc:
      // query QueryMenuRecord {
      //   core_core_menu_records(
      //     limit: null
      //     offset: null
      //     where: { menu_id: { _eq: "7ffe9691-7f9b-430d-a945-16e0d9b173c4" } }
      //   ) {
      //     id
      //     code
      //     title
      //     data
      //     created_at
      //     created_by
      //     core_dynamic_status {
      //       id
      //       code
      //       name
      //     }
      //     core_user {
      //       id
      //       username
      //       email
      //     }
      //   }
      // }
      const response = await fetchMenuRecords(menuIdToUse, 100, 0); // limit=100, offset=0
      return response.data.core_core_menu_records;
    },
    enabled: !!menuIdToUse
  });
  
  // API 2: Lấy thông tin form VIEW từ menu để lấy thông tin các cột hiển thị
  const { data: formViewData } = useQuery({
    queryKey: ['/api/menu-view-form', menuIdToUse],
    queryFn: async () => {
      // API load form (CREATE/EDIT/VIEW) theo menu
      // query MyQuery {
      //   core_core_dynamic_menu_forms(where: {menu_id: {_eq: "???"}, form_type: {_eq: "VIEW"}}) {
      //     id
      //     form_type
      //     form_id
      //     menu_id
      //     core_dynamic_form {
      //       id
      //       name
      //       code
      //       core_dynamic_form_fields {
      //         id
      //         is_required
      //         position
      //         core_dynamic_field {
      //           id
      //           code
      //           field_type
      //           configuration
      //           description
      //           name
      //           status
      //         }
      //       }
      //     }
      //   }
      // }
      const response = await fetchMenuViewForm(menuIdToUse);
      return response;
    },
    enabled: !!menuIdToUse
  });

  // Mutation để cập nhật dữ liệu submission form
  const updateSubmissionMutation = useMutation({
    mutationFn: async ({ submissionId, submissionData }: { submissionId: string; submissionData: any[] }) => {
      return updateSubmissionForm(submissionId, submissionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-records', menuIdToUse] });
      toast({
        title: t('submission.updateSuccess', 'Cập nhật thành công'),
        description: t('submission.updateSuccessMessage', 'Dữ liệu biểu mẫu đã được cập nhật thành công.'),
      });
    },
    onError: (error) => {
      toast({
        title: t('submission.updateError', 'Lỗi cập nhật'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    }
  });

  // Mutation để tạo mới submission form
  const createSubmissionMutation = useMutation({
    mutationFn: async (formData: FormSubmission) => {
      console.log("Submitting form data:", formData);
      // Gọi API submitFormData với workflowId hiện tại
      return submitFormData(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-records', menuIdToUse] });
      toast({
        title: t('submission.createSuccess', 'Tạo mới thành công'),
        description: t('submission.createSuccessMessage', 'Biểu mẫu mới đã được tạo thành công.'),
      });
    },
    onError: (error) => {
      toast({
        title: t('submission.createError', 'Lỗi tạo mới'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    }
  });

  // Xử lý khi lưu dữ liệu chỉnh sửa
  const handleSaveSubmission = async (submissionId: string, submissionData: any[]) => {
    try {
      await updateSubmissionMutation.mutateAsync({ submissionId, submissionData });
      return true;
    } catch (error) {
      console.error('Error saving submission:', error);
      return false;
    }
  };

  // Xử lý khi tạo mới submission form
  const handleCreateSubmission = async (newSubmission: FormSubmission) => {
    try {
      // Ưu tiên sử dụng menuId từ query parameter hoặc từ currentSubmenu
      // Áp dụng logic giống như submenu khiếu nại (ID: "ss")
      const menuIdForSubmission = menuIdFromQuery || currentSubmenu?.id || "";
      
      console.log("Found menu/submenu for workflow:", { 
        workflowId,
        submenuId: currentSubmenu?.id,
        menuIdFromQuery,
        menuIdToUse: menuIdForSubmission
      });
      
      // Thêm workflowId và menuId vào dữ liệu submission
      await createSubmissionMutation.mutateAsync({
        ...newSubmission,
        workflowId,
        menuId: menuIdForSubmission,
        formId: newSubmission.formId
      });
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <span className="inline-block">
                <Skeleton className="h-8 w-[250px]" />
              </span>
            </CardTitle>
            <CardDescription>
              <span className="inline-block">
                <Skeleton className="h-4 w-[350px]" />
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">
              {t('error.title', 'Đã xảy ra lỗi')}
            </CardTitle>
            <CardDescription>
              {t('error.failedToLoad', 'Không thể tải dữ liệu biểu mẫu đã nộp')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const title = currentSubmenu?.name || t('submission.title', 'Dữ liệu đã nộp');

  return (
    <div className="h-full flex flex-col">
      <Card className="overflow-hidden w-full border-0 rounded-none flex flex-col flex-1">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-2 px-6">
          <div>
            <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
            <CardDescription>
              {t('submission.description', 'Danh sách các biểu mẫu đã được gửi qua workflow này')}
            </CardDescription>
          </div>
          <AddSubmissionDialog 
            onSubmit={handleCreateSubmission}
            workflowId={workflowId}
          />
        </CardHeader>
        <CardContent className="p-0 overflow-auto flex-1 max-h-[calc(100vh-130px)]">
          {data.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <p className="text-muted-foreground">{t('submission.noData', 'Chưa có dữ liệu nào được gửi qua workflow này')}</p>
            </div>
          ) : (
            <div className="h-full">
              <SubmissionDataTable 
                data={data}
                onSave={async (editedData) => {
                  // Lấy submission ID hiện tại
                  const currentSubmission = data.find((s: any) => 
                    Array.isArray(s.data) && 
                    editedData.length > 0 && 
                    s.data.some((f: any) => f.id === editedData[0].id)
                  );
                  
                  if (currentSubmission) {
                    const result = await handleSaveSubmission(currentSubmission.id, editedData);
                    return result;
                  }
                  
                  throw new Error(t('submission.noSubmissionFound', 'Không tìm thấy biểu mẫu để cập nhật'));
                }}
                menuId={menuIdToUse}
                workflowId={workflowId}
                formData={formViewData}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}