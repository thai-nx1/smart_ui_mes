import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import jsQR from 'jsqr';
import { 
  CalendarIcon, 
  MicIcon, 
  ScreenShareIcon, 
  ImportIcon, 
  Download, 
  QrCodeIcon, 
  MapPinIcon,
  SearchIcon,
  FilterIcon,
  BarChartIcon,
  BarChart2Icon,
  LineChartIcon,
  PieChartIcon,
  CameraIcon,
  DatabaseIcon,
  ChevronDownIcon,
  UploadIcon,
  SaveIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { fieldTypeColors, FieldType, FieldOption } from '@/lib/types';
interface InputFieldProps {
  id: string;
  name: string;
  description?: string | null;
  fieldType: FieldType;
  value: any;
  onChange: (value: any) => void;
  options?: FieldOption[];
  required?: boolean;
  error?: string;
}

export function InputField({
  id,
  name,
  description,
  fieldType,
  value,
  onChange,
  options = [],
  required = false,
  error,
}: InputFieldProps) {
  const { toast } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Util function for formatting time (shared by audio and screen recording)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Refs cho video elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // State for modal dialogs
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogContent, setDialogContent] = useState<React.ReactNode>(null);
  
  // State cho chức năng chụp ảnh
  const [photoCapture, setPhotoCapture] = useState<{
    previewUrl: string | null;
    fileData: string | null;
  }>({ previewUrl: null, fileData: null });

  // Helper function to open modal dialogs
  const openModal = (title: string, content: React.ReactNode) => {
    setDialogTitle(title);
    setDialogContent(content);
    setIsModalOpen(true);
  };

  // Default options if none provided
  const fieldOptions = options.length > 0 
    ? options 
    : Array(4).fill(0).map((_, i) => ({ 
        id: `option-${i+1}`, 
        label: `Lựa chọn ${i+1}`, 
        value: `${i+1}`
      }));

  const renderField = () => {
    switch (fieldType) {
      case "TEXT":
        return (
          <Input
            id={id}
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="Nhập văn bản"
            required={required}
          />
        );
      
      case "PARAGRAPH":
        return (
          <Textarea
            id={id}
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="Nhập đoạn văn bản dài"
            rows={3}
            required={required}
          />
        );
      
      case "NUMBER":
        return (
          <Input
            id={id}
            type="number"
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="0"
            required={required}
          />
        );
      
      case "SINGLE_CHOICE":
        return (
          <RadioGroup
            value={value || ""}
            onValueChange={onChange}
            className="mt-2 space-y-2"
          >
            {fieldOptions.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  "flex items-center space-x-2",
                  error && "border-red-500 p-2 rounded"
                )}
              >
                <RadioGroupItem id={`${id}-${option.id}`} value={option.value} />
                <Label htmlFor={`${id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      
      case "MULTI_CHOICE":
        return (
          <div className="mt-2 space-y-2">
            {fieldOptions.map((option) => (
              <div 
                key={option.id} 
                className={cn(
                  "flex items-center space-x-2",
                  error && "border-red-500 p-2 rounded"
                )}
              >
                <Checkbox
                  id={`${id}-${option.id}`}
                  checked={(value || []).includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    
                    if (checked) {
                      onChange([...currentValues, option.value]);
                    } else {
                      onChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={`${id}-${option.id}`}>{option.label}</Label>
              </div>
            ))}
          </div>
        );
      
      case "DATE":
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !value && "text-muted-foreground",
                  error && "border-red-500"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), "PPP", { locale: vi }) : "Chọn một ngày"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => onChange(date?.toISOString() || null)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );
        
      // New field types
      case "INPUT":
        return (
          <Input
            id={id}
            value={value || ""}
            onChange={handleChange}
            className={cn(error && "border-red-500")}
            placeholder="Nhập dữ liệu đầu vào"
            required={required}
          />
        );
      
      case "CACHE":
        const CACHE_KEY = `form_field_${id}`;
        
        // Load from localStorage when component mounts
        useEffect(() => {
          try {
            const savedValue = localStorage.getItem(CACHE_KEY);
            if (savedValue && !value) {
              onChange(JSON.parse(savedValue));
            }
          } catch (error) {
            console.error("Error loading cached value:", error);
          }
        }, []);
        
        // Save to localStorage when value changes
        useEffect(() => {
          if (value) {
            try {
              localStorage.setItem(CACHE_KEY, JSON.stringify(value));
            } catch (error) {
              console.error("Error saving value to cache:", error);
            }
          }
        }, [value]);
        
        // Handle cache input
        const handleCacheChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const newValue = e.target.value;
          onChange({
            value: newValue,
            cached: true,
            timestamp: new Date().toISOString()
          });
        };
        
        return (
          <div className="grid gap-2">
            <Alert className="bg-emerald-50 border border-emerald-200">
              <DatabaseIcon className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Trường này được lưu cache và hoạt động khi offline
              </AlertDescription>
            </Alert>
            
            <div className="relative">
              <Input
                id={id}
                value={value?.value || ""}
                onChange={handleCacheChange}
                className={cn(
                  error && "border-red-500",
                  "pr-10"
                )}
                placeholder="Dữ liệu sẽ được lưu cache"
                required={required}
              />
              {value?.cached && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" title="Đã lưu cache"></div>
                </div>
              )}
            </div>
            
            {value?.cached && (
              <div className="text-xs text-emerald-600 flex items-center gap-1">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-3 w-3" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
                Đã lưu cục bộ lúc {new Date(value.timestamp).toLocaleTimeString('vi-VN')}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              Dữ liệu sẽ tự động được khôi phục khi trang được tải lại, ngay cả khi không có kết nối mạng.
            </div>
          </div>
        );
      
      case "AUDIO_RECORD":
        // State for audio recording
        const [isRecording, setIsRecording] = useState(false);
        const [recordingTime, setRecordingTime] = useState(0);
        const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
        const mediaRecorderRef = useRef<MediaRecorder | null>(null);
        const audioChunksRef = useRef<BlobPart[]>([]);
        const timerRef = useRef<number | null>(null);

        // Clean up when component unmounts or modal closes
        useEffect(() => {
          return () => {
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
            }
            if (mediaRecorderRef.current && isRecording) {
              mediaRecorderRef.current.stop();
            }
          };
        }, [isRecording]);

        // Clean up when modal closes
        useEffect(() => {
          if (!isModalOpen && mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
        }, [isModalOpen, isRecording]);

        const startRecording = async () => {
          audioChunksRef.current = [];
          setRecordingTime(0);
          
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              // Create blob from recorded chunks
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
              const audioUrl = URL.createObjectURL(audioBlob);
              
              // Create a file name
              const fileName = `audio_${Date.now()}.wav`;
              
              // Create a reader to get base64 data
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = () => {
                const base64data = reader.result as string;
                
                // Set preview URL for player
                setAudioPreviewUrl(audioUrl);
                
                // Send data to form
                onChange({
                  url: audioUrl,
                  data: base64data,
                  fileName: fileName,
                  duration: recordingTime,
                  timestamp: new Date().toISOString()
                });
              };
              
              // Stop all audio tracks
              stream.getTracks().forEach(track => track.stop());
              
              // Reset recording state
              setIsRecording(false);
              if (timerRef.current) {
                window.clearInterval(timerRef.current);
                timerRef.current = null;
              }
            };
            
            // Start recording
            mediaRecorder.start();
            setIsRecording(true);
            
            // Start timer
            timerRef.current = window.setInterval(() => {
              setRecordingTime(prev => prev + 1);
            }, 1000);
            
          } catch (error) {
            console.error("Không thể truy cập micro:", error);
            toast({
              title: "Lỗi",
              description: "Không thể truy cập microphone. Vui lòng cho phép quyền và thử lại.",
              variant: "destructive"
            });
          }
        };

        const stopRecording = () => {
          if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
          }
        };

        // Using the shared formatTime function defined at the top level

        return (
          <Button 
            variant="outline"
            className="w-full py-6"
            type="button"
            onClick={() => openModal("Ghi âm", (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className={`w-32 h-32 rounded-full ${isRecording ? 'bg-red-100 animate-pulse' : 'bg-red-50'} flex items-center justify-center`}>
                  <MicIcon className={`h-16 w-16 ${isRecording ? 'text-red-600' : 'text-red-500'}`} />
                </div>
                
                {isRecording ? (
                  <div className="text-xl font-mono">{formatTime(recordingTime)}</div>
                ) : audioPreviewUrl ? (
                  <audio 
                    src={audioPreviewUrl} 
                    controls 
                    className="w-full max-w-sm"
                  />
                ) : value?.url ? (
                  <audio 
                    src={value.url} 
                    controls 
                    className="w-full max-w-sm"
                  />
                ) : null}
                
                <div className="flex gap-2 w-full">
                  {isRecording ? (
                    <Button
                      onClick={stopRecording}
                      variant="destructive"
                      className="w-full"
                    >
                      Dừng ghi âm
                    </Button>
                  ) : audioPreviewUrl || value ? (
                    <>
                      <Button
                        onClick={startRecording}
                        variant="outline"
                        className="flex-1"
                      >
                        Ghi âm lại
                      </Button>
                      <Button
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1"
                      >
                        Xác nhận
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startRecording}
                      className="w-full"
                    >
                      Bắt đầu ghi âm
                    </Button>
                  )}
                </div>
                
                {value?.fileName && !isRecording && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    <p>Đã ghi âm: {value.fileName}</p>
                    {value.duration && (
                      <p>Thời lượng: {Math.floor(value.duration / 60).toString().padStart(2, '0')}:{(value.duration % 60).toString().padStart(2, '0')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          >
            <MicIcon className="h-6 w-6 mr-2 text-red-500" />
            {value ? (
              <span>Ghi âm đã được thu ({value.duration ? 
                `${Math.floor(value.duration / 60).toString().padStart(2, '0')}:${(value.duration % 60).toString().padStart(2, '0')}`
                : 'đã ghi'})</span>
            ) : (
              "Nhấn để ghi âm"
            )}
          </Button>
        );
      
      case "SCREEN_RECORD":
        // State for screen recording
        const [isScreenRecording, setIsScreenRecording] = useState(false);
        const [screenRecordingTime, setScreenRecordingTime] = useState(0);
        const [screenRecordingPreviewUrl, setScreenRecordingPreviewUrl] = useState<string | null>(null);
        const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
        const screenChunksRef = useRef<BlobPart[]>([]);
        const screenTimerRef = useRef<number | null>(null);
        const screenVideoRef = useRef<HTMLVideoElement | null>(null);

        // Clean up when component unmounts or modal closes
        useEffect(() => {
          return () => {
            if (screenTimerRef.current) {
              window.clearInterval(screenTimerRef.current);
            }
            if (screenMediaRecorderRef.current && isScreenRecording) {
              screenMediaRecorderRef.current.stop();
            }
          };
        }, [isScreenRecording]);

        // Clean up when modal closes
        useEffect(() => {
          if (!isModalOpen && screenMediaRecorderRef.current && isScreenRecording) {
            screenMediaRecorderRef.current.stop();
            setIsScreenRecording(false);
            if (screenTimerRef.current) {
              window.clearInterval(screenTimerRef.current);
              screenTimerRef.current = null;
            }
          }
        }, [isModalOpen, isScreenRecording]);

        const startScreenRecording = async () => {
          screenChunksRef.current = [];
          setScreenRecordingTime(0);
          
          try {
            // Request screen sharing
            const displayMedia = await navigator.mediaDevices.getDisplayMedia({
              video: true,
              audio: true
            });
            
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = displayMedia;
            }
            
            const mediaRecorder = new MediaRecorder(displayMedia);
            screenMediaRecorderRef.current = mediaRecorder;
            
            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                screenChunksRef.current.push(event.data);
              }
            };
            
            mediaRecorder.onstop = () => {
              // Create blob from recorded chunks
              const videoBlob = new Blob(screenChunksRef.current, { type: 'video/webm' });
              const videoUrl = URL.createObjectURL(videoBlob);
              
              // Create a file name
              const fileName = `screen_recording_${Date.now()}.webm`;
              
              // Create a reader to get base64 data (for preview or storage)
              const reader = new FileReader();
              reader.readAsDataURL(videoBlob);
              reader.onloadend = () => {
                const base64data = reader.result as string;
                
                // Set preview URL for player
                setScreenRecordingPreviewUrl(videoUrl);
                
                // Send data to form
                onChange({
                  url: videoUrl,
                  data: base64data,
                  fileName: fileName,
                  duration: screenRecordingTime,
                  timestamp: new Date().toISOString()
                });
              };
              
              // Stop all tracks
              displayMedia.getTracks().forEach(track => track.stop());
              
              // Reset recording state
              setIsScreenRecording(false);
              if (screenTimerRef.current) {
                window.clearInterval(screenTimerRef.current);
                screenTimerRef.current = null;
              }
            };
            
            // Start recording
            mediaRecorder.start();
            setIsScreenRecording(true);
            
            // Start timer
            screenTimerRef.current = window.setInterval(() => {
              setScreenRecordingTime(prev => prev + 1);
            }, 1000);
            
          } catch (error) {
            console.error("Không thể truy cập màn hình:", error);
            toast({
              title: "Lỗi",
              description: "Không thể ghi màn hình. Vui lòng cho phép quyền và thử lại.",
              variant: "destructive"
            });
          }
        };

        const stopScreenRecording = () => {
          if (screenMediaRecorderRef.current && isScreenRecording) {
            screenMediaRecorderRef.current.stop();
          }
        };

        return (
          <Button 
            variant="outline"
            className="w-full py-6"
            type="button"
            onClick={() => openModal("Ghi màn hình", (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className={`w-full max-w-sm aspect-video border-2 rounded-md flex items-center justify-center overflow-hidden ${isScreenRecording ? 'border-orange-500 animate-pulse' : 'border-orange-200 bg-orange-50'}`}>
                  {screenRecordingPreviewUrl || (value?.url) ? (
                    <video 
                      src={screenRecordingPreviewUrl || value?.url} 
                      controls 
                      className="w-full h-full"
                    />
                  ) : isScreenRecording ? (
                    <video 
                      ref={screenVideoRef} 
                      autoPlay 
                      muted 
                      className="w-full h-full"
                    />
                  ) : (
                    <ScreenShareIcon className="h-16 w-16 text-orange-500" />
                  )}
                </div>
                
                {isScreenRecording && (
                  <div className="flex items-center gap-2 text-red-500">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                    <div className="text-xl font-mono">{Math.floor(screenRecordingTime / 60).toString().padStart(2, '0')}:{(screenRecordingTime % 60).toString().padStart(2, '0')}</div>
                  </div>
                )}
                
                <div className="flex gap-2 w-full">
                  {isScreenRecording ? (
                    <Button
                      onClick={stopScreenRecording}
                      variant="destructive"
                      className="w-full"
                    >
                      Dừng ghi màn hình
                    </Button>
                  ) : screenRecordingPreviewUrl || value?.url ? (
                    <>
                      <Button
                        onClick={startScreenRecording}
                        variant="outline"
                        className="flex-1"
                      >
                        Ghi lại màn hình
                      </Button>
                      <Button
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1"
                      >
                        Xác nhận
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={startScreenRecording}
                      className="w-full"
                    >
                      Bắt đầu ghi màn hình
                    </Button>
                  )}
                </div>
                
                {value?.fileName && !isScreenRecording && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    <p>Đã ghi màn hình: {value.fileName}</p>
                    {value.duration && (
                      <p>Thời lượng: {Math.floor(value.duration / 60).toString().padStart(2, '0')}:{(value.duration % 60).toString().padStart(2, '0')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          >
            <ScreenShareIcon className="h-6 w-6 mr-2 text-orange-500" />
            {value ? (
              <span>Ghi màn hình đã được thu {value.duration ? 
                `(${Math.floor(value.duration / 60).toString().padStart(2, '0')}:${(value.duration % 60).toString().padStart(2, '0')})` 
                : ''}
              </span>
            ) : (
              "Nhấn để ghi màn hình"
            )}
          </Button>
        );
      
      case "IMPORT":
        // State cho file input
        const [importedText, setImportedText] = useState<string | null>(null);
        const [importedFileName, setImportedFileName] = useState<string | null>(null);
        const fileInputRef = useRef<HTMLInputElement | null>(null);
        
        // Xử lý khi chọn file
        const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
          const files = e.target.files;
          if (!files || files.length === 0) return;
          
          const file = files[0];
          setImportedFileName(file.name);
          
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              const text = event.target.result as string;
              setImportedText(text);
              onChange({
                fileName: file.name,
                content: text,
                type: file.type,
                timestamp: new Date().toISOString()
              });
            }
          };
          reader.readAsText(file);
        };
        
        return (
          <div className="grid gap-2">
            <Button 
              variant="outline"
              className="w-full py-6"
              type="button"
              onClick={() => openModal("Nhập file", (
                <div className="flex flex-col items-center gap-5 py-4">
                  <div className="w-full max-w-sm border-2 border-lime-200 rounded-md flex flex-col items-center justify-center p-8 bg-lime-50">
                    <ImportIcon className="h-16 w-16 text-lime-600 mb-4" />
                    
                    {importedText || (value?.content) ? (
                      <div className="bg-white p-4 rounded-md w-full max-h-60 overflow-y-auto border border-lime-200">
                        <p className="font-medium text-sm text-lime-800 mb-2">
                          {importedFileName || value?.fileName}
                        </p>
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                          {importedText || value?.content}
                        </pre>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-lime-700 mb-2">Chọn file để nhập</p>
                        <p className="text-sm text-lime-600">Hỗ trợ file .txt, .csv, .json</p>
                      </div>
                    )}
                    
                    <input 
                      type="file"
                      className="hidden"
                      accept=".txt,.csv,.json,.md"
                      onChange={handleFileImport}
                      ref={fileInputRef}
                    />
                  </div>
                  
                  <div className="flex gap-2 w-full">
                    {importedText || value?.content ? (
                      <>
                        <Button
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                              fileInputRef.current.click();
                            }
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Nhập file khác
                        </Button>
                        <Button
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1"
                        >
                          Xác nhận
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          if (fileInputRef.current) fileInputRef.current.click();
                        }}
                        className="w-full"
                      >
                        Chọn file
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            >
              <ImportIcon className="h-6 w-6 mr-2 text-lime-600" />
              {value?.fileName ? (
                <span>Đã nhập: {value.fileName}</span>
              ) : (
                "Nhấn để nhập dữ liệu"
              )}
            </Button>
            
            {value?.content && (
              <div className="p-3 bg-lime-50 rounded-md mt-2 text-sm">
                <p className="font-medium text-lime-800">File đã nhập: {value.fileName}</p>
                {value.content.length > 100 ? (
                  <p className="text-xs text-gray-600 mt-1">{value.content.substring(0, 100)}...</p>
                ) : (
                  <p className="text-xs text-gray-600 mt-1">{value.content}</p>
                )}
              </div>
            )}
          </div>
        );
      
      case "EXPORT":
        // Chuyển đổi form hiện tại sang PDF
        const exportToPdf = async () => {
          try {
            // Import html2pdf.js dynamically
            const html2pdf = (await import('html2pdf.js')).default;
            
            // Lấy element cần in
            const element = document.querySelector('.form-content') || document.body;
            
            // Tùy chọn cho PDF
            const opt = {
              margin: 10,
              filename: `form_export_${new Date().toISOString().split('T')[0]}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };
            
            // Hiển thị thông báo
            toast({
              title: "Đang tạo PDF",
              description: "Vui lòng đợi trong giây lát...",
            });
            
            // Tạo và tải PDF
            html2pdf().from(element).set(opt).save().then(() => {
              // Cập nhật giá trị
              onChange({
                exported: true,
                fileName: opt.filename,
                timestamp: new Date().toISOString()
              });
              
              // Thông báo thành công
              toast({
                title: "Xuất file thành công",
                description: `Đã tạo file ${opt.filename}`,
                variant: "default"
              });
            });
          } catch (error) {
            console.error("Lỗi khi xuất PDF:", error);
            toast({
              title: "Lỗi xuất file",
              description: "Không thể tạo file PDF. Vui lòng thử lại sau.",
              variant: "destructive"
            });
          }
        };
        
        return (
          <div className="grid gap-2">
            <Button 
              variant="outline"
              className="w-full py-6"
              type="button"
              onClick={exportToPdf}
            >
              <Download className="h-6 w-6 mr-2 text-teal-600" />
              {value?.exported ? (
                <span>Xuất lại dữ liệu</span>
              ) : (
                "Xuất dữ liệu sang PDF"
              )}
            </Button>
            
            {value?.exported && (
              <div className="p-3 bg-teal-50 rounded-md mt-2 text-sm">
                <p className="font-medium text-teal-800">
                  Đã xuất file: {value.fileName}
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  Thời gian: {new Date(value.timestamp).toLocaleString('vi-VN')}
                </p>
              </div>
            )}
          </div>
        );
      
      case "QR_SCAN":
        // QR scanning effect
        const [isScanning, setIsScanning] = useState(false);
        const [scanResult, setScanResult] = useState<string | null>(null);
        const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
        
        // Setup and cleanup for QR scanning camera
        useEffect(() => {
          if (!isModalOpen || fieldType !== "QR_SCAN") return;
          
          let animationFrameId: number;
          let scanIntervalId: number;
          
          if (isScanning && videoRef.current) {
            // Access the camera for QR scanning
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ 
                video: { 
                  facingMode: 'environment', // Use back camera
                  width: { ideal: 1280 },
                  height: { ideal: 720 } 
                } 
              })
              .then(stream => {
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  streamRef.current = stream;
                  
                  // Set a short timeout to allow the camera to initialize
                  setTimeout(() => {
                    scanIntervalId = window.setInterval(attemptScan, 500);
                  }, 1000);
                }
              })
              .catch(err => {
                console.error("Không thể truy cập camera:", err);
                toast({
                  title: "Lỗi Camera",
                  description: "Không thể truy cập camera cho QR scanning. Vui lòng cho phép quyền camera và thử lại.",
                  variant: "destructive"
                });
                setIsScanning(false);
              });
            }
          }
          
          // Mock scanning function (in real app, would use library like jsQR)
          const attemptScan = () => {
            if (!videoRef.current || !qrCanvasRef.current || !isScanning) return;
            
            const canvas = qrCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Match canvas size to video dimensions
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            // Draw current video frame to canvas for analysis
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            try {
              // Sử dụng thư viện jsQR để quét QR code từ ảnh canvas
              // Lấy dữ liệu hình ảnh từ canvas
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Sử dụng jsQR để phân tích hình ảnh tìm QR code
              const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                {
                  inversionAttempts: "dontInvert", // Không cần đảo ngược màu
                }
              );
              
              // Nếu tìm thấy QR code
              if (code) {
                // Đọc giá trị từ QR code thực tế
                const qrDataValue = code.data;
                
                // Tạo đối tượng dữ liệu QR code với giá trị thực
                const qrData = {
                  code: qrDataValue,
                  value: qrDataValue,
                  format: code.binaryData ? "QR_CODE" : "BARCODE", // Phân biệt loại mã
                  timestamp: new Date().toISOString()
                };
                
                // Stop scanning
                clearInterval(scanIntervalId);
                setIsScanning(false);
                setScanResult(qrDataValue);
                
                // Update the form value with object structure
                onChange(qrData);
                
                // Success feedback
                toast({
                  title: "Quét thành công",
                  description: `Đã quét thành công mã: ${qrDataValue}`,
                  variant: "default"
                });
                
                // Stop camera stream
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                  streamRef.current = null;
                }
              }
            } catch (error) {
              console.error("Lỗi phân tích QR code:", error);
            }
          };
          
          // Clean up 
          return () => {
            clearInterval(scanIntervalId);
            cancelAnimationFrame(animationFrameId);
            
            // Stop camera when unmounting
            if (streamRef.current) {
              streamRef.current.getTracks().forEach(track => track.stop());
              streamRef.current = null;
            }
          };
        }, [isModalOpen, isScanning, fieldType, toast, onChange]);
        
        return (
          <Button 
            variant="outline"
            className="w-full py-6"
            type="button"
            onClick={() => openModal("Quét mã QR/Barcode", (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="w-full max-w-xs aspect-square border-2 border-violet-200 rounded-md flex items-center justify-center bg-black relative overflow-hidden">
                  {scanResult || (value && !isScanning) ? (
                    <div className="text-center bg-white p-4 rounded-md">
                      <QrCodeIcon className="h-16 w-16 text-violet-600 mx-auto mb-2" />
                      <div className="text-violet-800 font-medium">Đã quét thành công</div>
                      <div className="text-sm text-violet-600 mt-2 font-mono">
                        {scanResult || (value?.code ? value.code : value)}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Video element for camera feed */}
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Hidden canvas for image processing */}
                      <canvas 
                        ref={qrCanvasRef}
                        className="hidden"
                      />
                      
                      {/* Scanning overlay */}
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border-2 border-violet-500 opacity-50"></div>
                        <div className="absolute top-0 left-0 right-0 h-px bg-violet-500 animate-qrScanLine"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-48 h-48 border-2 border-violet-400 rounded-md"></div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="flex gap-2 w-full">
                  {scanResult || (value && !isScanning) ? (
                    <>
                      <Button
                        onClick={() => {
                          // Reset for new scan
                          setScanResult(null);
                          setIsScanning(true);
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Quét mã khác
                      </Button>
                      <Button
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1"
                      >
                        Xác nhận
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setIsScanning(true)}
                      className="w-full"
                    >
                      Bắt đầu quét
                    </Button>
                  )}
                </div>
                
                {value?.code && !isScanning && (
                  <div className="text-center text-sm text-gray-500 mt-2">
                    <p>Mã đã quét: {value.code}</p>
                    <p>Loại: {value.format || "QR"}</p>
                  </div>
                )}
              </div>
            ))}
          >
            <QrCodeIcon className="h-6 w-6 mr-2 text-violet-600" />
            {value ? (
              <span>Mã đã quét: {value.value || value.code || value}</span>
            ) : (
              "Nhấn để quét mã QR/Barcode"
            )}
          </Button>
        );
      
      case "GPS":
        return (
          <div className="grid gap-2">
            <Button 
              variant="outline"
              className="w-full py-6"
              type="button"
              onClick={() => {
                // Sử dụng Geolocation API thực tế
                if (navigator.geolocation) {
                  const locationButton = document.getElementById(`gps-btn-${id}`);
                  if (locationButton) {
                    locationButton.innerHTML = 'Đang lấy vị trí...';
                    locationButton.setAttribute('disabled', 'true');
                  }
                  
                  navigator.geolocation.getCurrentPosition(
                    async (position) => {
                      const { latitude, longitude } = position.coords;
                      try {
                        // Dùng Reverse Geocoding nếu có thể
                        let address = "Vị trí đã lấy";
                        try {
                          const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=vi`
                          );
                          if (response.ok) {
                            const data = await response.json();
                            address = data.display_name || address;
                          }
                        } catch (error) {
                          console.error("Không thể lấy địa chỉ:", error);
                        }
                        
                        onChange({ 
                          lat: latitude, 
                          lng: longitude, 
                          address: address,
                          timestamp: new Date().toISOString()
                        });
                      } catch (error) {
                        console.error("Lỗi khi xử lý thông tin vị trí:", error);
                        toast({
                          title: "Lỗi",
                          description: "Không thể lấy thông tin vị trí. Vui lòng thử lại.",
                          variant: "destructive"
                        });
                      } finally {
                        if (locationButton) {
                          locationButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' + (value ? "Cập nhật vị trí" : "Nhấn để lấy vị trí hiện tại");
                          locationButton.removeAttribute('disabled');
                        }
                      }
                    },
                    (error) => {
                      console.error("Lỗi Geolocation:", error);
                      let errorMessage = "Không thể lấy vị trí của bạn.";
                      
                      switch (error.code) {
                        case error.PERMISSION_DENIED:
                          errorMessage = "Bạn đã từ chối quyền truy cập vị trí.";
                          break;
                        case error.POSITION_UNAVAILABLE:
                          errorMessage = "Thông tin vị trí không khả dụng.";
                          break;
                        case error.TIMEOUT:
                          errorMessage = "Quá thời gian yêu cầu vị trí.";
                          break;
                      }
                      
                      toast({
                        title: "Lỗi",
                        description: errorMessage,
                        variant: "destructive"
                      });
                      
                      if (locationButton) {
                        locationButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>' + "Thử lại";
                        locationButton.removeAttribute('disabled');
                      }
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                } else {
                  toast({
                    title: "Không hỗ trợ",
                    description: "Trình duyệt của bạn không hỗ trợ định vị.",
                    variant: "destructive"
                  });
                }
              }}
              id={`gps-btn-${id}`}
            >
              <MapPinIcon className="h-6 w-6 mr-2 text-amber-600" />
              {value ? "Cập nhật vị trí" : "Nhấn để lấy vị trí hiện tại"}
            </Button>
            {value && (
              <div className="p-3 bg-amber-50 rounded-md mt-2 text-sm">
                <p className="font-medium">Thông tin vị trí:</p>
                <p>Toạ độ: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}</p>
                <p className="mt-1">{value.address}</p>
                {value.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    Thời gian: {new Date(value.timestamp).toLocaleString('vi-VN')}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      
      case "CHOOSE":
        return (
          <Select 
            value={value || ""}
            onValueChange={onChange}
          >
            <SelectTrigger className={cn(error && "border-red-500")}>
              <SelectValue placeholder="Chọn một lựa chọn" />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "SELECT":
        return (
          <Select 
            value={value || ""}
            onValueChange={onChange}
          >
            <SelectTrigger className={cn(error && "border-red-500")}>
              <SelectValue placeholder="Chọn một giá trị" />
            </SelectTrigger>
            <SelectContent>
              {fieldOptions.map((option) => (
                <SelectItem key={option.id} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case "SEARCH":
        return (
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id={id}
              value={value || ""}
              onChange={handleChange}
              className={cn("pl-10", error && "border-red-500")}
              placeholder="Tìm kiếm..."
              required={required}
            />
          </div>
        );
      
      case "FILTER":
        return (
          <div className="grid gap-2">
            <div className="flex">
              <Input
                id={id}
                value={value || ""}
                onChange={handleChange}
                className={cn(error && "border-red-500")}
                placeholder="Lọc theo điều kiện..."
                required={required}
              />
              <Button variant="ghost" className="ml-2">
                <FilterIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      
      case "DASHBOARD":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-2 flex justify-center items-center">
                <BarChartIcon className="h-12 w-12 text-slate-600" />
              </CardContent>
            </Card>
            <Card className="p-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-2 flex justify-center items-center">
                <LineChartIcon className="h-12 w-12 text-slate-600" />
              </CardContent>
            </Card>
            <Card className="p-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-2 flex justify-center items-center">
                <PieChartIcon className="h-12 w-12 text-slate-600" />
              </CardContent>
            </Card>
            <Card className="p-2 cursor-pointer hover:border-primary transition-colors">
              <CardContent className="p-2 flex justify-center items-center">
                <BarChart2Icon className="h-12 w-12 text-slate-600" />
              </CardContent>
            </Card>
          </div>
        );
      
      case "PHOTO":
        // Clean up camera stream when modal is closed
        useEffect(() => {
          if (!isModalOpen && streamRef.current) {
            const tracks = streamRef.current.getTracks();
            tracks.forEach(track => track.stop());
            streamRef.current = null;
          }
        }, [isModalOpen]);

        // Start camera if modal is open
        useEffect(() => {
          if (isModalOpen && videoRef.current && fieldType === "PHOTO") {
            // Access the camera
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              navigator.mediaDevices.getUserMedia({ 
                video: { 
                  facingMode: 'environment', // Prefer back camera
                  width: { ideal: 1280 },
                  height: { ideal: 720 } 
                } 
              })
              .then(stream => {
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                  streamRef.current = stream;
                }
              })
              .catch(err => {
                console.error("Không thể truy cập camera:", err);
                toast({
                  title: "Lỗi Camera",
                  description: "Không thể truy cập camera. Vui lòng cho phép quyền camera và thử lại.",
                  variant: "destructive"
                });
              });
            }
          }
        }, [isModalOpen, fieldType, toast]);

        // Function to capture photo
        const capturePhoto = () => {
          if (!videoRef.current) return;
          
          try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Draw video frame to canvas
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            
            // Convert to data URL
            const dataUrl = canvas.toDataURL('image/jpeg');
            
            // Create a file name
            const fileName = `photo_${Date.now()}.jpg`;
            
            // Set state with preview URL and file info
            setPhotoCapture({
              previewUrl: dataUrl,
              fileData: dataUrl,
            });
            
            // Send data to form
            onChange({
              url: dataUrl,
              fileName: fileName,
              timestamp: new Date().toISOString()
            });
            
            // Clean up
            setTimeout(() => {
              // Close modal after a brief delay to show preview
              setIsModalOpen(false);
            }, 1000);
          } catch (error) {
            console.error("Lỗi khi chụp ảnh:", error);
            toast({
              title: "Lỗi",
              description: "Không thể chụp ảnh. Vui lòng thử lại.",
              variant: "destructive"
            });
          }
        };

        return (
          <Button 
            variant="outline"
            className="w-full py-6"
            type="button"
            onClick={() => openModal("Chụp ảnh", (
              <div className="flex flex-col items-center gap-5 py-4">
                <div className="w-full max-w-sm border-2 border-blue-200 rounded-md overflow-hidden bg-black relative">
                  {photoCapture.previewUrl ? (
                    <img 
                      src={photoCapture.previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto"
                    />
                  ) : (
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-auto"
                    />
                  )}
                  
                  {/* Camera overlay elements */}
                  {!photoCapture.previewUrl && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500 opacity-50"></div>
                      <div className="absolute top-0 right-0 h-full w-0.5 bg-blue-500 opacity-50"></div>
                      <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-500 opacity-50"></div>
                      <div className="absolute top-0 left-0 h-full w-0.5 bg-blue-500 opacity-50"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 w-full">
                  {photoCapture.previewUrl ? (
                    <>
                      <Button
                        onClick={() => {
                          setPhotoCapture({ previewUrl: null, fileData: null });
                          // Re-open camera
                          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                            navigator.mediaDevices.getUserMedia({ 
                              video: { 
                                facingMode: 'environment',
                                width: { ideal: 1280 },
                                height: { ideal: 720 } 
                              } 
                            })
                            .then(stream => {
                              if (videoRef.current) {
                                videoRef.current.srcObject = stream;
                                streamRef.current = stream;
                              }
                            });
                          }
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Chụp lại
                      </Button>
                      <Button
                        onClick={() => {
                          setIsModalOpen(false);
                        }}
                        className="flex-1"
                      >
                        Xác nhận
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={capturePhoto}
                      className="w-full"
                    >
                      Chụp ảnh
                    </Button>
                  )}
                </div>
              </div>
            ))}
          >
            <CameraIcon className="h-6 w-6 mr-2 text-blue-600" />
            {value ? (
              <div className="flex items-center">
                <span className="mr-2">Ảnh đã chụp</span>
                {typeof value === 'object' && value?.url && (
                  <div className="h-6 w-6 rounded-full overflow-hidden">
                    <img src={value.url} alt="Thumbnail" className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            ) : (
              "Nhấn để chụp ảnh"
            )}
          </Button>
        );
      
      default:
        return <Input value={value || ""} onChange={handleChange} />;
    }
  };

  const { bg, text } = fieldTypeColors[fieldType];

  return (
    <>
      <div className="mb-6 p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors">
        <div className="flex items-start justify-between mb-2">
          <div>
            {fieldType !== "SINGLE_CHOICE" && fieldType !== "MULTI_CHOICE" && (
              <Label htmlFor={id} className="font-medium">
                {name}
              </Label>
            )}
            {(fieldType === "SINGLE_CHOICE" || fieldType === "MULTI_CHOICE") && (
              <span className="block text-sm font-medium text-gray-700">{name}</span>
            )}
            {description && (
              <p className="mt-1 text-xs text-gray-500">{description}</p>
            )}
            {error && (
              <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
          </div>
          <Badge variant={fieldType.toLowerCase() as any} className={`${bg} ${text}`}>
            {fieldType.replace('_', ' ')}
          </Badge>
        </div>
        <div className="mt-1">{renderField()}</div>
      </div>

      {/* Dialog for interactive fields */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dialogContent}
        </DialogContent>
      </Dialog>
    </>
  );
}
