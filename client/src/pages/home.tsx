import React from 'react';
import { Link } from 'wouter';
import { MainLayout } from '@/components/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  
  return (
    <MainLayout title={t('app.title', 'Hệ thống Quản lý Form Động')}>
      <div className="py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold sm:text-5xl sm:tracking-tight lg:text-6xl">
            {t('app.title', 'Hệ thống Quản lý Form Động')}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            {t('home.description', 'Tạo, quản lý và gửi các biểu mẫu tùy chỉnh một cách nhanh chóng và dễ dàng.')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/forms">
              <Button size="lg" className="px-8 py-6 text-lg">
                {t('home.viewForms', 'Xem danh sách form')}
              </Button>
            </Link>
            <Link href="/workflow">
              <Button size="lg" className="px-8 py-6 text-lg" variant="outline">
                {t('home.viewWorkflow', 'Hệ thống Workflow')}
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-center mb-12">
            {t('home.fieldTypes', 'Các loại trường dữ liệu')}
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              title={t('home.features.textTitle', 'Văn bản & Đoạn văn')}
              description={t('home.features.textDescription', 'Thu thập văn bản ngắn hoặc các đoạn văn dài từ người dùng.')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  <path d="M9 9h1" />
                  <path d="M9 13h6" />
                  <path d="M9 17h6" />
                </svg>
              }
            />
            <FeatureCard
              title={t('home.features.choiceTitle', 'Lựa chọn')}
              description={t('home.features.choiceDescription', 'Cho phép người dùng chọn một hoặc nhiều tùy chọn từ danh sách.')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h8" />
                  <path d="M12 18v-9" />
                  <path d="M8 11a4 4 0 0 0 8 0" />
                  <path d="M2 12a10 10 0 0 0 20 0" />
                </svg>
              }
            />
            <FeatureCard
              title={t('home.features.numberTitle', 'Số & Ngày tháng')}
              description={t('home.features.numberDescription', 'Thu thập dữ liệu số và ngày tháng với định dạng chính xác.')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M8 14h.01" />
                  <path d="M12 14h.01" />
                  <path d="M16 14h.01" />
                  <path d="M8 18h.01" />
                  <path d="M12 18h.01" />
                  <path d="M16 18h.01" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

function FeatureCard({ title, description, icon }: FeatureCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-3">
            {icon}
          </div>
          <h3 className="text-lg font-medium">{title}</h3>
          <p className="mt-2 text-sm text-gray-500">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
