import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const ClientManager = () => (
  <Card>
    <CardHeader>
      <CardTitle>Clients</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        Client management will appear here.
      </p>
    </CardContent>
  </Card>
);

export default ClientManager;
