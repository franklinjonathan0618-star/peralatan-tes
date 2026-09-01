// Type definitions for path aliases
declare module '@/components/ui/*' {
  import { ComponentType, SVGProps } from 'react';
  const Component: ComponentType<SVGProps<SVGSVGElement>>;
  export default Component;
}

declare module '@/contexts/*' {
  import { Context } from 'react';
  const context: Context<any>;
  export default context;
}

declare module '@/integrations/*' {
  const value: any;
  export default value;
}

declare module '@/lib/*' {
  const value: any;
  export default value;
}

declare module '@/hooks/*' {
  const value: any;
  export default value;
}
