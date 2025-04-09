import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { fetchMenuRecords, fetchWorkflowTransitionsByStatus } from '@/lib/api';
import { fetchWorkflowDetails } from '@/lib/workflow-api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Calendar, Check, ChevronRight, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { TransitionFormDialog } from '@/components/TransitionFormDialog';
import { WorkflowDiagram } from '@/components/WorkflowDiagram';

type FieldValue = string | number | string[] | boolean | null;

interface FieldData {
  id: string;
  name: string;
  value: FieldValue;
  field_type: string;
}

export default function RecordDetailPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ recordId: string, menuId: string, workflowId: string }>();
  const { recordId, menuId, workflowId } = params;
  
  // State cho thông tin transitions
  const [currentStatusId, setCurrentStatusId] = useState<string>("");
  
  // State cho hiển thị biểu đồ workflow
  const [showWorkflowDiagram, setShowWorkflowDiagram] = useState<boolean>(false);
  
  // Format thời gian từ timestamp hoặc string
  const formatDate = (timestamp: number | string) => {
    if (!timestamp) return '-';
    const date = typeof timestamp === 'number' ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Lấy thông tin chi tiết record
  const { data: recordData, isLoading, error } = useQuery({
    queryKey: ['/api/record-detail', recordId],
    queryFn: async () => {
      const response = await fetchMenuRecords(menuId, 100, 0, recordId);
      return response.data.core_core_menu_records?.[0] || null;
    },
    enabled: !!recordId && !!menuId
  });

  // Cập nhật statusId khi có dữ liệu
  useEffect(() => {
    if (recordData?.core_dynamic_status?.id) {
      setCurrentStatusId(recordData.core_dynamic_status.id);
    }
  }, [recordData]);
  
  // Lấy transitions từ API nếu có workflowId
  const { data: transitionsData } = useQuery({
    queryKey: ['workflow-transitions', workflowId, currentStatusId],
    queryFn: async () => {
      console.log('Fetching transitions with variables:', { workflowId, fromStatusId: currentStatusId });
      if (!workflowId) return { data: { core_core_dynamic_workflow_transitions: [] } };
      const result = await fetchWorkflowTransitionsByStatus(workflowId, currentStatusId);
      // Đảm bảo transitions data không bao giờ là null
      if (!result.data?.core_core_dynamic_workflow_transitions) {
        result.data = { core_core_dynamic_workflow_transitions: [] };
      }
      return result;
    },
    enabled: !!workflowId && !!currentStatusId
  });
  
  // Lấy thông tin chi tiết workflow để hiển thị diagram
  const { data: workflowData } = useQuery({
    queryKey: ['workflow-details', workflowId],
    queryFn: async () => {
      console.log('Fetching workflow details with workflowId:', workflowId);
      if (!workflowId) return { data: { core_core_dynamic_workflows_by_pk: null } };
      const result = await fetchWorkflowDetails(workflowId);
      return result;
    },
    enabled: !!workflowId && showWorkflowDiagram
  });

  // Tìm field tiêu đề nếu có
  const getTitleField = (): string => {
    if (!recordData?.data) return '';
    
    // Tìm trường tiêu đề theo tên
    const titleField = recordData.data.find((field: FieldData) => 
      field.name.toLowerCase().includes('tiêu đề') || 
      field.name.toLowerCase() === 'title' ||
      field.name.toLowerCase() === 'tên' ||
      field.name.toLowerCase() === 'chủ đề'
    );
    
    return titleField ? String(titleField.value || '') : '';
  };

  // Render giá trị field
  const renderFieldValue = (value: FieldValue, fieldType: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (fieldType) {
      case 'DATE':
        return formatDate(value as number);
      case 'MULTI_CHOICE':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return String(value);
    }
  };

  // Xử lý quay lại trang trước
  const handleGoBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('actions.back', 'Quay lại')}
              </Button>
            </div>
            <CardTitle>
              <Skeleton className="h-7 w-[300px]" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-5 w-[200px]" />
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !recordData) {
    return (
      <div className="container py-6">
        <Card className="border-destructive">
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="mr-2"
                onClick={() => window.history.back()}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('actions.back', 'Quay lại')}
              </Button>
            </div>
            <CardTitle className="text-destructive">
              {t('error.title', 'Đã xảy ra lỗi')}
            </CardTitle>
            <CardDescription>
              {t('error.failedToLoad', 'Không thể tải dữ liệu biểu mẫu')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const titleField = getTitleField();

  return (
    <div className="container max-w-full h-[calc(100vh-4rem)] flex flex-col">
      <Card className="border shadow-sm flex-1 flex flex-col overflow-hidden">
        <CardHeader className="pb-4 flex-shrink-0">
          <div className="flex items-center mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-2"
              onClick={() => window.history.back()}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('actions.back', 'Quay lại')}
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold text-primary flex flex-wrap items-center">
                {recordData.code && (
                  <span className="mr-2 text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">
                    {recordData.code}
                  </span>
                )}
                {titleField || t('recordDetail.untitled', 'Biểu mẫu không có tiêu đề')}
              </CardTitle>
              
              <CardDescription className="mt-1 flex items-center flex-wrap gap-2">
                <span className="text-xs text-muted-foreground">
                  {t('recordDetail.createdAt', 'Ngày tạo')}: {formatDate(new Date(recordData.created_at).getTime())}
                </span>
                {recordData.core_user && (
                  <span className="text-xs text-muted-foreground">
                    {t('recordDetail.createdBy', 'Người tạo')}: {recordData.core_user.username}
                  </span>
                )}
              </CardDescription>
            </div>
            
            {/* Hiển thị trạng thái */}
            {recordData.core_dynamic_status && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary font-semibold px-3 py-1 text-sm self-start md:self-center">
                  {recordData.core_dynamic_status.name || t('recordDetail.noStatus', 'Chưa có trạng thái')}
                </Badge>
                
                {/* Nút hiển thị biểu đồ workflow nếu có workflowId */}
                {workflowId && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex items-center gap-1"
                    onClick={() => setShowWorkflowDiagram(true)}
                  >
                    <Activity className="h-4 w-4" />
                    {t('workflow.viewDiagram', 'Xem biểu đồ workflow')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        {showWorkflowDiagram && (
          <div className="flex-shrink-0">
            <WorkflowDiagram
              workflowId={workflowId}
              workflowName={workflowData?.data?.core_core_dynamic_workflows_by_pk?.name || 'Workflow'}
              currentStatusId={currentStatusId}
              onClose={() => setShowWorkflowDiagram(false)}
              useDialogStyle={true}
            />
          </div>
        )}
        
        {/* Workflow actions */}
        {workflowId && transitionsData && transitionsData.data?.core_core_dynamic_workflow_transitions?.length > 0 && (
          <div className="px-6 py-3 bg-muted/20 border-y flex-shrink-0">
            <div className="w-full mb-1 text-sm font-medium text-primary">
              {t('workflow.availableActions', 'Hành động có sẵn:')}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {transitionsData.data.core_core_dynamic_workflow_transitions.map((transition: any) => (
                <TransitionFormDialog
                  key={transition.id}
                  transitionId={transition.id}
                  recordId={recordData.id}
                  transitionName={transition.name}
                  onSubmit={() => {
                    // Refresh lại trang sau khi thực hiện transition
                    window.location.reload();
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
        )}

        <CardContent className="pt-6 flex-1 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Desktop view - table format */}
            <div className="hidden md:flex flex-1 overflow-hidden">
              <div className="w-full overflow-auto rounded-md">
                <table className="w-full border-collapse min-w-[500px]">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="bg-muted/30">
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-r border-border whitespace-nowrap">
                        {t('recordDetail.fieldName', 'Tên trường')}
                      </th>
                      <th className="p-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border whitespace-nowrap">
                        {t('recordDetail.fieldValue', 'Giá trị')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recordData.data && recordData.data.map((field: FieldData, index: number) => (
                      <tr 
                        key={`desktop-${field.id}`}
                        className={`transition-colors duration-150 ${
                          index % 2 === 0 ? 'bg-background/50' : 'bg-background/80'
                        } hover:bg-primary/5`}
                      >
                        <td className="p-3 border-r border-border align-top sticky left-0 bg-inherit">
                          <div className="font-medium text-sm text-primary">
                            {field.name}
                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground inline-block">
                              {field.field_type}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 border-border min-w-[300px]">
                          <div className="text-sm py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                            <div className="break-all whitespace-pre-wrap">
                              {typeof field.value === 'string' ? (
                                <div className="text-muted-foreground">
                                  {field.field_type === 'PHOTO' ? (
                                    <div className="text-xs">
                                      {field.value || <span className="italic">Chưa có dữ liệu</span>}
                                    </div>
                                  ) : (
                                    <div>
                                      {field.value || <span className="italic text-xs">Chưa có dữ liệu</span>}
                                    </div>
                                  )}
                                </div>
                              ) : Array.isArray(field.value) ? (
                                field.value.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {field.value.map((v: string, i: number) => (
                                      <span 
                                        key={i} 
                                        className="inline-flex items-center px-2 py-1 bg-primary/10 rounded break-all"
                                      >
                                        {v}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground italic text-xs">Chưa có dữ liệu</span>
                                )
                              ) : (
                                <div className="text-muted-foreground">
                                  {String(field.value) || <span className="italic text-xs">Chưa có dữ liệu</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Mobile view - card format */}
            <div className="md:hidden flex-1 overflow-auto">
              <div className="space-y-4 pb-4">
                {recordData.data && recordData.data.map((field: FieldData, index: number) => (
                  <div 
                    key={`mobile-${field.id}`}
                    className="border border-border rounded-md overflow-hidden bg-card"
                  >
                    <div className="p-2 bg-muted/20 border-b border-border sticky top-0 z-10">
                      <div className="font-medium text-sm text-primary flex items-center flex-wrap">
                        {field.name}
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {field.field_type}
                        </span>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="text-sm py-3 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-md">
                        <div className="break-all whitespace-pre-wrap">
                          {typeof field.value === 'string' ? (
                            <div className="text-muted-foreground">
                              {field.field_type === 'PHOTO' ? (
                                <div className="text-xs">
                                  {field.value || <span className="italic">Chưa có dữ liệu</span>}
                                </div>
                              ) : (
                                <div>
                                  {field.value || <span className="italic text-xs">Chưa có dữ liệu</span>}
                                </div>
                              )}
                            </div>
                          ) : Array.isArray(field.value) ? (
                            field.value.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {field.value.map((v: string, i: number) => (
                                  <span 
                                    key={i} 
                                    className="inline-flex items-center px-2 py-1 bg-primary/10 rounded break-all"
                                  >
                                    {v}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">Chưa có dữ liệu</span>
                            )
                          ) : (
                            <div className="text-muted-foreground">
                              {String(field.value) || <span className="italic text-xs">Chưa có dữ liệu</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(!recordData.data || recordData.data.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                {t('recordDetail.noData', 'Không có dữ liệu field nào')}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex items-center gap-1"
          >
            {t('actions.close', 'Đóng')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}