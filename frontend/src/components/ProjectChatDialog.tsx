import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Send,
    Mic,
    X,
    MessageCircle,
    Play,
    Pause,
    Loader2,
    Paperclip,
    Smile,
    Calendar,
    User,
    Volume2,
    Clock
} from 'lucide-react';
import { type Project, type ChatMessage, sendProjectMessage } from '@/lib/db';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

interface ProjectChatDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    project: Project;
    currentUserRole: 'ENGINEER' | 'OWNER';
    onMessageSent: () => void;
}

export default function ProjectChatDialog({ isOpen, onOpenChange, project, currentUserRole, onMessageSent }: ProjectChatDialogProps) {
    const { toast } = useToast();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [activeAudio, setActiveAudio] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (isOpen && scrollRef.current) {
            const scrollElement = scrollRef.current;
            scrollElement.scrollTop = scrollElement.scrollHeight;
        }
    }, [isOpen, project.chatMessages]);

    // Focus input when dialog opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!newMessage.trim()) return;

        setIsSending(true);
        const message: ChatMessage = {
            id: crypto.randomUUID(),
            sender: currentUserRole,
            text: newMessage,
            type: 'text',
            timestamp: new Date().toISOString()
        };

        const result = await sendProjectMessage(project.id.toString(), message);
        if (result.success) {
            setNewMessage('');
            onMessageSent();
            if (inputRef.current) inputRef.current.focus();
        } else {
            toast({
                title: "خطأ في الإرسال",
                description: "تعذر إرسال الرسالة، يرجى المحاولة مرة أخرى",
                variant: "destructive"
            });
        }
        setIsSending(false);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });
            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                await handleSendAudio(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start(100);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            toast({
                title: "خطأ في الميكروفون",
                description: "يرجى التحقق من أذونات الميكروفون والمحاولة مرة أخرى",
                variant: "destructive"
            });
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleSendAudio = async (audioBlob: Blob) => {
        setIsSending(true);

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;

            const message: ChatMessage = {
                id: crypto.randomUUID(),
                sender: currentUserRole,
                type: 'audio',
                audioUrl: base64Audio,
                timestamp: new Date().toISOString(),
                duration: recordingTime
            };

            const result = await sendProjectMessage(project.id.toString(), message);
            if (result.success) {
                onMessageSent();
            } else {
                toast({
                    title: "خطأ في الإرسال",
                    description: "تعذر إرسال التسجيل الصوتي",
                    variant: "destructive"
                });
            }
            setIsSending(false);
        };
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'اليوم';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'أمس';
        } else {
            return date.toLocaleDateString('ar-EG', {
                month: 'short',
                day: 'numeric'
            });
        }
    };

    // Audio Player Component with improved design
    const AudioPlayer = ({ src, duration, isOwn }: { src: string, duration?: number, isOwn: boolean }) => {
        const [isPlaying, setIsPlaying] = useState(false);
        const [progress, setProgress] = useState(0);
        const audioRef = useRef<HTMLAudioElement>(null);
        const progressRef = useRef<HTMLDivElement>(null);

        const togglePlay = () => {
            if (audioRef.current) {
                if (isPlaying) {
                    audioRef.current.pause();
                    setActiveAudio(null);
                } else {
                    // Stop any other playing audio
                    setActiveAudio(src);
                    audioRef.current.play();
                }
                setIsPlaying(!isPlaying);
            }
        };

        useEffect(() => {
            if (audioRef.current) {
                const audio = audioRef.current;

                const updateProgress = () => {
                    if (audio.duration) {
                        setProgress((audio.currentTime / audio.duration) * 100);
                    }
                };

                const handleEnded = () => {
                    setIsPlaying(false);
                    setProgress(0);
                    setActiveAudio(null);
                };

                audio.addEventListener('timeupdate', updateProgress);
                audio.addEventListener('ended', handleEnded);

                return () => {
                    audio.removeEventListener('timeupdate', updateProgress);
                    audio.removeEventListener('ended', handleEnded);
                };
            }
        }, []);

        useEffect(() => {
            if (activeAudio !== src && isPlaying) {
                setIsPlaying(false);
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
            }
        }, [activeAudio, src, isPlaying]);

        return (
            <div className={`flex flex-col gap-2 p-3 rounded-2xl ${isOwn
                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                : 'bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700'
                }`}>
                <div className="flex items-center gap-3">
                    <button
                        onClick={togglePlay}
                        className={`p-2.5 rounded-full shadow-lg transition-all duration-200 hover:scale-105 ${isOwn
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-600 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400'
                            }`}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                    </button>

                    <div className="flex-1">
                        <div className={`text-sm font-medium mb-1 ${isOwn ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'}`}>
                            <Volume2 size={14} className="inline mr-1" />
                            تسجيل صوتي
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-white/20 dark:bg-gray-600 rounded-full overflow-hidden">
                                <div
                                    ref={progressRef}
                                    className={`h-full rounded-full transition-all duration-300 ${isOwn
                                        ? 'bg-white'
                                        : 'bg-blue-500'
                                        }`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className={`text-xs font-mono ${isOwn ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                                {duration ? formatTime(duration) : '0:00'}
                            </span>
                        </div>
                    </div>
                </div>

                <audio
                    ref={audioRef}
                    src={src}
                    className="hidden"
                />
            </div>
        );
    };

    // Group messages by date
    const groupedMessages = project.chatMessages?.reduce((groups: Record<string, ChatMessage[]>, message) => {
        const date = formatDate(message.timestamp);
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(message);
        return groups;
    }, {}) || {};

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogOverlay className="bg-black/60 backdrop-blur-md transition-all duration-300" />
            <DialogContent className="sm:max-w-[520px] h-[700px] flex flex-col p-0 overflow-hidden border-0 shadow-2xl">
                {/* Header */}
                <div className="relative p-6 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-cyan-400" />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
                                    <MessageCircle size={28} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-white flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold">محادثة المشروع</DialogTitle>
                                <p className="text-sm opacity-90 mt-1 flex items-center gap-2">
                                    <User size={14} />
                                    {currentUserRole === 'ENGINEER' ? 'التواصل مع مالك المشروع' : 'التواصل مع المهندس المسؤول'}
                                </p>
                            </div>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl hover:bg-white/20 text-white hover:text-white"
                        >
                            <X size={24} />
                        </Button>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm opacity-90">
                        <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>المشروع: {project.title}</span>
                        </div>
                        <div className="h-4 w-px bg-white/30" />
                        <div className="flex items-center gap-2">
                            <Clock size={16} />
                            <span>{project.chatMessages?.length || 0} رسالة</span>
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-6 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
                    <div ref={scrollRef} className="space-y-8">
                        {Object.keys(groupedMessages).length === 0 ? (
                            <div className="text-center py-16 opacity-60">
                                <div className="relative w-24 h-24 mx-auto mb-6">
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 animate-pulse" />
                                    <MessageCircle className="h-full w-full p-6 text-gray-300" />
                                </div>
                                <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                                    لا توجد رسائل سابقة
                                </p>
                                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                                    ابدأ المحادثة الآن بالكتابة أو التسجيل الصوتي
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedMessages).map(([date, messages]) => (
                                <div key={date} className="space-y-6">
                                    {/* Date Separator */}
                                    <div className="relative flex items-center justify-center">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                                        </div>
                                        <div className="relative bg-white dark:bg-gray-800 px-4 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <Calendar size={12} />
                                                {date}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    {messages.map((msg) => {
                                        const isMe = msg.sender === currentUserRole;
                                        const showAvatar = true; // Always show avatar for better UX

                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`flex items-end gap-3 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                                    {showAvatar && (
                                                        <Avatar className={`h-10 w-10 border-2 ${isMe
                                                            ? 'border-blue-100 dark:border-blue-900'
                                                            : 'border-gray-100 dark:border-gray-700'
                                                            }`}>
                                                            <AvatarImage
                                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.sender === 'ENGINEER' ? 'engineer' : 'owner'}`}
                                                                alt={msg.sender}
                                                            />
                                                            <AvatarFallback className={isMe
                                                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                                                                : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                                                            }>
                                                                {msg.sender === 'ENGINEER' ? 'مه' : 'مش'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}

                                                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                        {!isMe && (
                                                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 ml-2">
                                                                {msg.sender === 'ENGINEER' ? 'المهندس' : 'مالك المشروع'}
                                                            </span>
                                                        )}

                                                        <div className={cn(
                                                            "relative rounded-3xl shadow-lg transition-all duration-200 hover:shadow-xl",
                                                            isMe
                                                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-lg'
                                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-lg'
                                                        )}>
                                                            {msg.type === 'text' ? (
                                                                <div className="p-4">
                                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                                        {msg.text}
                                                                    </p>
                                                                </div>
                                                            ) : (
                                                                <div className="p-3">
                                                                    <AudioPlayer
                                                                        src={msg.audioUrl!}
                                                                        duration={msg.duration}
                                                                        isOwn={isMe}
                                                                    />
                                                                </div>
                                                            )}

                                                            <div className={`px-4 pb-2 pt-1 ${isMe
                                                                ? 'text-blue-100'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                                }`}>
                                                                <span className="text-xs flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {new Date(msg.timestamp).toLocaleTimeString('ar-EG', {
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                        hour12: true
                                                                    })}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl border border-red-100 dark:border-red-800/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-red-500 animate-ping opacity-75" />
                                        <div className="absolute inset-0 w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                                            <Mic size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-red-700 dark:text-red-300">
                                            جاري التسجيل...
                                        </p>
                                        <p className="text-sm text-red-600 dark:text-red-400">
                                            ارفع يدك للإرسال أو اضغط للإيقاف
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        {[...Array(5)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="w-1 h-6 bg-red-500 rounded-full animate-wave"
                                                style={{
                                                    animationDelay: `${i * 0.1}s`,
                                                    animationDuration: '1s'
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <span className="text-2xl font-bold font-mono text-red-700 dark:text-red-300">
                                        {formatTime(recordingTime)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-end gap-3">
                        {/* Action Buttons */}
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full h-11 w-11 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                title="إرفاق ملف"
                            >
                                <Paperclip size={20} />
                            </Button>

                            <Button
                                variant={isRecording ? "destructive" : "outline"}
                                size="icon"
                                className={cn(
                                    "rounded-full h-11 w-11 transition-all duration-300",
                                    isRecording
                                        ? "animate-pulse shadow-lg shadow-red-500/30"
                                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                )}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                title="اضغط للتسجيل الصوتي"
                            >
                                <Mic size={20} />
                            </Button>
                        </div>

                        {/* Message Input */}
                        <div className="flex-1 relative">
                            <Input
                                ref={inputRef}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                placeholder="اكتب رسالتك هنا..."
                                className="h-11 rounded-2xl pl-12 pr-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500"
                                disabled={isRecording || isSending}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-500 hover:text-gray-700"
                            >
                                <Smile size={20} />
                            </Button>
                        </div>

                        {/* Send Button */}
                        <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || isSending || isRecording}
                            size="icon"
                            className={cn(
                                "h-11 w-11 rounded-full transition-all duration-300",
                                newMessage.trim()
                                    ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/30"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                            )}
                        >
                            {isSending ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </Button>
                    </div>

                    {/* Helper Text */}
                    <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3">
                        اضغط <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd> للإرسال •
                        اضغط واستمر على <Mic size={12} className="inline mx-0.5" /> للتسجيل الصوتي
                    </p>
                </div>

                {/* Custom Wave Animation */}
                <style jsx>{`
                    @keyframes wave {
                        0%, 100% { height: 10px; }
                        50% { height: 20px; }
                    }
                    .animate-wave {
                        animation: wave 1s ease-in-out infinite;
                    }
                `}</style>
            </DialogContent>
        </Dialog>
    );
}