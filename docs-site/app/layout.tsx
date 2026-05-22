import 'fumadocs-ui/style.css';
import { RootProvider } from 'fumadocs-ui/provider';
import type { ReactNode } from 'react';

export const metadata = {
  title: {
    template: '%s | JD Matcher 文档',
    default: 'JD Matcher — 设计文档',
  },
  description: 'JD Matcher 项目设计文档：Harness 合规性审计、架构设计、模块文档',
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
