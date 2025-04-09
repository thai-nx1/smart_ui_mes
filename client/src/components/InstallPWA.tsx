import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toast, ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Update UI to notify the user they can install the PWA
      setIsInstallable(true);
      
      // Show toast notification
      toast({
        title: "Cài đặt ứng dụng",
        description: "Bạn có thể cài đặt ứng dụng này lên thiết bị của mình",
        action: (
          <ToastAction altText="Cài đặt" onClick={handleInstallClick}>
            Cài đặt
          </ToastAction>
        ),
      });
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, []);

  const handleInstallClick = () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Người dùng đã chấp nhận cài đặt PWA');
      } else {
        console.log('Người dùng đã từ chối cài đặt PWA');
      }
      // We no longer need the prompt, clear it
      setDeferredPrompt(null);
      setIsInstallable(false);
    });
  };

  // Only render the button if the app is installable
  return isInstallable ? (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleInstallClick}
      className="fixed bottom-4 right-4 z-50 shadow-md"
    >
      Cài đặt ứng dụng
    </Button>
  ) : null;
}