import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AdminStats = () => (
  <Card>
    <CardHeader>
      <CardTitle>Dashboard</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Overview statistics will appear here.
      </p>
    </CardContent>
  </Card>
);

export default AdminStats;
