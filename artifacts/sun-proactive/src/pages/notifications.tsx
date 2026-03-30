import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetNotifications, useMarkNotificationRead } from "@workspace/api-client-react";
import { Bell, CheckCircle2, MessageSquare, AlertCircle, Calendar } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Notifications() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useGetNotifications({
    query: {
      queryKey: ["/api/notifications"]
    }
  });

  const markReadMutation = useMarkNotificationRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      }
    }
  });

  const handleMarkAsRead = (id: number) => {
    markReadMutation.mutate({ id });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'task_match': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'application_approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'reminder': return <Calendar className="w-5 h-5 text-indigo-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications</h1>
          <p className="text-slate-600">Updates on your tasks and platform activity.</p>
        </div>

        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <Bell className="w-12 h-12 text-slate-200 mb-4" />
                <p>You have no notifications right now.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <div key={notif.id} className={`flex gap-4 p-5 transition-colors ${notif.read ? 'bg-white' : 'bg-blue-50/30'}`}>
                    <div className="mt-0.5 shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`font-semibold text-sm ${notif.read ? 'text-slate-700' : 'text-slate-900'}`}>
                          {notif.title}
                        </h4>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className={`text-sm ${notif.read ? 'text-slate-500' : 'text-slate-700'}`}>
                        {notif.message}
                      </p>
                    </div>
                    {!notif.read && (
                      <div className="shrink-0 flex items-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          onClick={() => handleMarkAsRead(notif.id)}
                          disabled={markReadMutation.isPending}
                        >
                          Mark read
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
