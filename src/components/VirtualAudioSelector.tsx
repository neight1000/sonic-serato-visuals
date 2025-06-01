
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Headphones, Settings, Info, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { VirtualAudioRouter, AudioDevice } from '@/utils/virtualAudioRouter';

interface VirtualAudioSelectorProps {
  onDeviceSelect: (deviceId: string) => void;
  currentDeviceId?: string;
  isConnected: boolean;
}

export const VirtualAudioSelector: React.FC<VirtualAudioSelectorProps> = ({
  onDeviceSelect,
  currentDeviceId,
  isConnected
}) => {
  const [devices, setDevices] = useState<AudioDevice[]>([]);
  const [virtualDevices, setVirtualDevices] = useState<AudioDevice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [router] = useState(() => new VirtualAudioRouter());

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const [allDevices, virtualDevs] = await Promise.all([
        router.getAvailableAudioDevices(),
        router.getVirtualAudioDevices()
      ]);
      
      setDevices(allDevices);
      setVirtualDevices(virtualDevs);
      
      if (virtualDevs.length > 0) {
        toast.success(`Found ${virtualDevs.length} virtual audio device(s)!`);
      } else {
        toast.info('No virtual audio devices detected. Check setup instructions.');
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load audio devices');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    onDeviceSelect(deviceId);
    const device = devices.find(d => d.deviceId === deviceId);
    if (device) {
      toast.success(`Selected: ${device.label}`);
    }
  };

  const setupInstructions = router.getSetupInstructions();

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Headphones className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Audio Input</h3>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-600 text-white">
              <Zap className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={loadDevices}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-gray-300 border-gray-600 hover:bg-gray-700"
          >
            <Settings className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="text-gray-300 border-gray-600 hover:bg-gray-700">
                <Info className="w-4 h-4 mr-1" />
                Setup
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-gray-900 border-gray-700 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Virtual Audio Setup</SheetTitle>
                <SheetDescription className="text-gray-300">
                  Configure virtual audio routing for DJ software and music apps
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {setupInstructions.map((setup, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-semibold text-blue-400">{setup.software}</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                      {setup.instructions.map((instruction, i) => (
                        <li key={i}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="space-y-3">
        {virtualDevices.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              Virtual Audio Devices (Recommended)
            </label>
            <Select value={currentDeviceId} onValueChange={handleDeviceSelect}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select virtual audio device..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {virtualDevices.map((device) => (
                  <SelectItem 
                    key={device.deviceId} 
                    value={device.deviceId}
                    className="text-white hover:bg-gray-700"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-400" />
                      {device.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-300 mb-2 block">
            All Audio Devices
          </label>
          <Select value={currentDeviceId} onValueChange={handleDeviceSelect}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue placeholder="Select audio input device..." />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {devices.map((device) => (
                <SelectItem 
                  key={device.deviceId} 
                  value={device.deviceId}
                  className="text-white hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-blue-400" />
                    {device.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {virtualDevices.length === 0 && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            No virtual audio devices detected. Click "Setup" for installation instructions.
          </p>
        </div>
      )}
    </Card>
  );
};
