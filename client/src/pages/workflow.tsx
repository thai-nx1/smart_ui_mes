import React, { useState } from 'react';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { SubmissionDataTable } from '@/components/SubmissionDataTable';
import { AddSubmissionDialog } from '@/components/AddSubmissionDialog';
import { useParams, useLocation } from 'wouter';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMenuRecords, fetchAllMenus, submitFormData } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

import { useTranslation } from 'react-i18next';

// Dữ liệu mẫu các bản ghi phê duyệt
const sampleSubmissions = [
  {
    id: 'submission1',
    code: 'PD001',
    title: 'Đề xuất 1',
    data: [
      { id: 'field1', name: 'Nội dung phê duyệt', value: 'Mua thiết bị văn phòng', field_type: 'TEXT' },
      { id: 'field2', name: 'Trong hay ngoài budget', value: 'option1', field_type: 'SINGLE_CHOICE' },
      { id: 'field3', name: 'Số tiền cần chi', value: '5000000', field_type: 'NUMBER' },
    ],
    core_dynamic_status: { id: 'status1', name: 'Chờ phê duyệt' }
  },
  {
    id: 'submission2',
    code: 'PD002',
    title: 'Đề xuất 2',
    data: [
      { id: 'field4', name: 'Nội dung phê duyệt', value: 'Thuê dịch vụ tư vấn', field_type: 'TEXT' },
      { id: 'field5', name: 'Trong hay ngoài budget', value: 'option2', field_type: 'SINGLE_CHOICE' },
      { id: 'field6', name: 'Số tiền cần chi', value: '12000000', field_type: 'NUMBER' },
    ],
    core_dynamic_status: { id: 'status2', name: 'Đã phê duyệt' }
  }
];

export default function WorkflowPage() {
  const params = useParams<{ menuId: string, subMenuId: string }>();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const menuId = params.menuId;
  const subMenuId = params.subMenuId || menuId;
  
  // Truy vấn để lấy tất cả các menu để tìm menu phù hợp
  const { data: menusData } = useQuery({
    queryKey: ['/api/all-menus'],
    queryFn: async () => {
      const response = await fetchAllMenus();
      return response.data.core_core_dynamic_menus;
    }
  });
  
  // Tìm submenu và menu cha
  const currentSubmenu = menusData?.find((menu: any) => menu.id === subMenuId);
  const parentMenu = menusData?.find((menu: any) => menu.id === currentSubmenu?.parent_id);
  
  // Lấy workflowId từ submenu nếu có
  // Đảm bảo workflowId là string hoặc undefined (không phải null)
  const workflowId = currentSubmenu?.workflow_id || undefined;
  
  // Truy vấn để lấy dữ liệu records
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/menu-records', subMenuId],
    queryFn: async () => {
      if (!subMenuId) return [];
      try {
        const response = await fetchMenuRecords(subMenuId, 100, 0);
        return response.data.core_core_menu_records;
      } catch (err) {
        console.error("Error fetching menu records:", err);
        return [];
      }
    },
    enabled: !!subMenuId
  });
  
  // Sử dụng dữ liệu API hoặc dữ liệu mẫu nếu không có dữ liệu
  const submissionData = (data && data.length > 0) ? data : sampleSubmissions;
  
  // Xử lý khi nộp form mới
  const handleSubmitForm = async (submission: any) => {
    try {
      // Gửi dữ liệu form
      await submitFormData(submission);
      
      // Hiển thị thông báo thành công
      toast({
        title: t('Thành công'),
        description: t('Biểu mẫu đã được gửi thành công.'),
        variant: 'default',
      });
      
      // Tải lại dữ liệu
      queryClient.invalidateQueries({ queryKey: ['/api/menu-records', subMenuId] });
    } catch (error) {
      console.error('Error submitting form:', error);
      
      // Hiển thị thông báo lỗi
      toast({
        title: t('Lỗi'),
        description: t('Có lỗi xảy ra khi gửi biểu mẫu. Vui lòng thử lại sau.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>{currentSubmenu?.name || "Phê duyệt tài chính"}</CardTitle>
            <CardDescription>
              Danh sách các biểu mẫu đã được gửi qua workflow này
            </CardDescription>
          </div>
          {workflowId && (
            <AddSubmissionDialog onSubmit={handleSubmitForm} workflowId={workflowId} />
          )}
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Dữ liệu đã nộp</h3>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm kiếm trong dữ liệu..."
                className="w-full pl-9 pr-4 py-2 border rounded-md"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 my-4">
            <Button variant="outline" className="text-xs bg-background hover:bg-primary/5 transition-colors text-foreground">
              Nội dung phê duyệt
            </Button>
            <Button variant="outline" className="text-xs bg-background hover:bg-primary/5 transition-colors text-foreground">
              Trong hay ngoài budget
            </Button>
            <Button variant="outline" className="text-xs bg-background hover:bg-primary/5 transition-colors text-foreground">
              Số tiền cần chi
            </Button>
          </div>
          
          {/* Sử dụng SubmissionDataTable để hiển thị dữ liệu */}
          <SubmissionDataTable
            data={isLoading ? [] : submissionData}
            readOnly={true}
            viewMode={undefined} // Để tự động chuyển đổi dựa vào kích thước màn hình
            menuId={subMenuId || undefined}
            workflowId={workflowId}
          />
        </CardContent>
      </Card>
    </div>
  );
}