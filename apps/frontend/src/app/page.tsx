import { Card, CardBody, CardHeader } from '@heroui/react';

import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api/client';

interface HealthData {
  status: string;
}

async function getHealth(): Promise<HealthData | null> {
  try {
    return await apiRequest<HealthData>('/health');
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">remoteHask</h1>
          <p className="text-sm text-muted-foreground">
            Operator console — Next.js + HeroUI + shadcn/ui
          </p>
        </CardHeader>
        <CardBody className="gap-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
            <p className="font-medium">API status</p>
            <p className="text-muted-foreground">
              {health ? `Backend: ${health.status}` : 'Backend: unreachable (start apps/backend)'}
            </p>
          </div>
          <Button asChild>
            <a href="/dashboard">Go to dashboard</a>
          </Button>
        </CardBody>
      </Card>
    </main>
  );
}
