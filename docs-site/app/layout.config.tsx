import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: '🎯 JD Matcher 文档',
  },
  links: [
    {
      text: '项目仓库',
      url: 'https://github.com',
      active: 'nested-url',
    },
  ],
};
