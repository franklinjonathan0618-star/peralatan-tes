import React, { ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle className="text-red-600">Terjadi Kesalahan</CardTitle>
              <CardDescription className="mt-2">
                {this.state.error?.message || 'Aplikasi mengalami kesalahan yang tidak diharapkan'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-gray-100 rounded p-3 text-left text-xs mb-4 overflow-auto max-h-40">
                <pre className="text-gray-700">
                  {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
                </pre>
              </div>
              <Button 
                onClick={this.handleReset}
                className="w-full"
              >
                Muat Ulang Aplikasi
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
