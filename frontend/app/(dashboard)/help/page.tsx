import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
        <p className="text-muted-foreground">Get help using Synchro.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick help</CardTitle>
          <CardDescription>Common things you might be looking for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Where do I see notifications?</div>
            <div className="text-sm text-muted-foreground">
              Go to <Link className="underline underline-offset-4 hover:text-primary" href="/inbox">Inbox</Link>.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">How do I manage my tasks?</div>
            <div className="text-sm text-muted-foreground">
              Use <Link className="underline underline-offset-4 hover:text-primary" href="/tasks">My Tasks</Link> to track and update work.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">How do I browse projects?</div>
            <div className="text-sm text-muted-foreground">
              Visit <Link className="underline underline-offset-4 hover:text-primary" href="/projects">Projects</Link>.
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">How do I update my name/avatar?</div>
            <div className="text-sm text-muted-foreground">
              Open <Link className="underline underline-offset-4 hover:text-primary" href="/accounts">Accounts</Link>.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/inbox">Open Inbox</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tasks">Open My Tasks</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/projects">Open Projects</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
