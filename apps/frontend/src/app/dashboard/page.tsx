import { Card, CardBody, CardHeader } from '@heroui/react';

export default function DashboardPage() {
  return (
    <main className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <h1 className="text-xl font-semibold">Dashboard</h1>
        </CardHeader>
        <CardBody>
          <p className="text-muted-foreground">
            Device list and session management will be implemented here.
          </p>
        </CardBody>
      </Card>
    </main>
  );
}
