import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const FileManager = () => (
  <Card>
    <CardHeader>
      <CardTitle>Files</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-sm text-muted-foreground">
        File management will appear here.
      </p>
    </CardContent>
  </Card>
);

export default FileManager;
