import React, { useState, useCallback, useMemo } from 'react';
import type { User, ChatMessage } from '../types';
import FileDropzone from './FileDropzone';
import FileList from './FileList';
import ContactPage from './ContactPage';
import heic2any from 'heic2any';

interface MainPageProps {
  user: User;
  onLogout: () => void;
}

type ActiveView = 'files' | 'contact';

const MainPage: React.FC<MainPageProps> = ({ user, onLogout }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingFileCount, setProcessingFileCount] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('files');

  // Chat state lifted from ContactPage
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'bot', text: 'Hola! Soc l\'assistent virtual d\'**EOSTransfer**. Com et puc ajudar avui?', timestamp: new Date() }
  ]);
  const [isSendingChat, setIsSendingChat] = useState(false);

  const totalSizeInMB = useMemo(() => {
    const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [files]);

  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    setUploadSuccess(false);
    setUploadError(null);
    setIsProcessingFiles(true);
    setProcessingFileCount(newFiles.length);
    
    try {
        const processedFilesPromises = Array.from(newFiles).map(async (file) => {
        const isHeic = file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
        if (isHeic) {
            try {
            console.log(`Converting ${file.name} to JPG...`);
            const convertedBlob = await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9,
            }) as Blob;
            
            const newFileName = file.name.replace(/\.(heic|heif)$/i, '.jpg');
            return new File([convertedBlob], newFileName, {
                type: 'image/jpeg',
                lastModified: file.lastModified,
            });
            } catch (error) {
            console.error(`Error converting ${file.name}:`, error);
            setUploadError(`No s\'ha pogut convertir l\'arxiu HEIC: ${file.name}.`);
            return null;
            }
        }
        return file;
        });

        // Add a small delay to ensure the loading animation is visible
        await new Promise(resolve => setTimeout(resolve, 1500));

        const processedFiles = (await Promise.all(processedFilesPromises)).filter(Boolean) as File[];

        setFiles(prevFiles => {
        const existingFileNames = new Set(prevFiles.map(f => f.name));
        const uniqueNewFiles = processedFiles.filter(
            f => !existingFileNames.has(f.name)
        );
        return [...prevFiles, ...uniqueNewFiles];
        });
    } catch (error) {
        console.error("Error processing files:", error);
        setUploadError("Hi ha hagut un error en processar els arxius.");
    } finally {
        setIsProcessingFiles(false);
        setProcessingFileCount(0);
    }
  }, []);

  const handleRemoveFile = useCallback((fileToRemove: File) => {
    setFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
  }, []);
  
  const handleRenameFile = useCallback((originalFile: File, newName: string) => {
    const isNameTaken = files.some(f => f.name === newName && f !== originalFile);

    if (isNameTaken) {
      alert(`El nom d\'arxiu "${newName}" ja existeix. Si us plau, tria\'n un altre.`);
      return;
    }

    setFiles(prevFiles => 
      prevFiles.map(file => {
        if (file === originalFile) {
          return new File([file], newName, {
            type: file.type,
            lastModified: file.lastModified,
          });
        }
        return file;
      })
    );
  }, [files]);


  const handleSend = async () => {
    if (files.length === 0) return;
    setIsSending(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();

    formData.append('userId', user.id);
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'File upload failed');
      }

      console.log('Files sent successfully for user:', user.name);
      setFiles([]);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);

    } catch (error) {
      console.error('Error sending files:', error);
      setUploadError(`No s\'han pogut enviar els arxius. ${(error as Error).message}`);
    } finally {
      setIsSending(false);
    }
  };

const handleSendChatMessage = useCallback(async (messageText: string) => {
    const timestamp = new Date();
    const userMessage: ChatMessage = {
        id: Date.now(),
        sender: 'user',
        text: messageText.trim(),
        timestamp: timestamp,
    };

    const botResponsePlaceholder: ChatMessage = {
        id: Date.now() + 1,
        sender: 'bot',
        text: '',
        timestamp: timestamp,
        isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, botResponsePlaceholder]);
    setIsSendingChat(true);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: user.id,
                userName: user.name,
                message: userMessage.text,
            }),
        });

        if (!response.ok || !response.body) {
            throw new Error(`HTTP error! status: ${response.status || 'No response body'}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process buffer line-by-line in case multiple JSON objects are received
            const lines = buffer.split(/\r?\n/);

            // Keep the last (potentially incomplete) line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    // The stream sends multiple JSON objects, sometimes concatenated.
                    // We need to handle this by finding the boundaries.
                    const jsonObjects = line.replace(/}{/g, '}\n{').split('\n');
                    for(const jsonObjStr of jsonObjects) {
                        if (jsonObjStr.trim() === '') continue;
                        const parsed = JSON.parse(jsonObjStr);
                        if (parsed.type === 'item' && parsed.content) {
                            accumulatedText += parsed.content;
                        }
                    }
                } catch (e) {
                    console.warn('Failed to parse JSON object from stream:', line, e);
                    // Sometimes, a non-JSON string might be a valid text chunk by itself
                    if (!line.includes('"type"')) {
                       accumulatedText += line;
                    }
                }
            }
            
            // Update the UI with the accumulated text so far
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === botResponsePlaceholder.id
                        ? { ...msg, text: accumulatedText, isLoading: true, timestamp: new Date() }
                        : msg
                )
            );
        }
        
        // Final update to remove loading indicator
        setMessages(prev =>
            prev.map(msg =>
                msg.id === botResponsePlaceholder.id
                    ? { ...msg, text: accumulatedText, isLoading: false }
                    : msg
            )
        );

    } catch (error) {
        console.error('Error handling stream or sending message:', error);
        const errorMessage: ChatMessage = {
            id: botResponsePlaceholder.id,
            sender: 'bot',
            text: "Hi ha hagut un error en connectar amb el servidor. Si us plau, torna a intentar-ho més tard.",
            timestamp: new Date(),
            isLoading: false,
        };
        setMessages(prev => prev.map(msg => msg.id === botResponsePlaceholder.id ? errorMessage : msg));
    } finally {
        setIsSendingChat(false);
    }
}, [user]);

  const hasContent = files.length > 0 || isProcessingFiles;

  const NavButton: React.FC<{ view: ActiveView; children: React.ReactNode }> = ({ view, children }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
        activeView === view
          ? 'bg-cyan-500/20 text-cyan-300'
          : 'text-gray-400 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-5xl h-full min-h-[90vh] flex flex-col bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
      <header className="flex justify-between items-center p-6 border-b border-white/10 bg-gradient-to-r from-gray-900/50 to-gray-900/20">
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          Benvingut/da, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{user.name}</span>
        </h1>
        <button
          onClick={onLogout}
          aria-label="Tanca la sessió"
          className="flex items-center justify-center p-2 sm:px-4 sm:py-2 bg-red-600/80 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden sm:inline sm:ml-2">Tanca la sessió</span>
        </button>
      </header>
      
      <div className="px-6 py-4 border-b border-white/10">
        <div className="flex items-center space-x-2 bg-black/20 p-1 rounded-lg max-w-min">
          <NavButton view="files">Arxius</NavButton>
          <NavButton view="contact">Contactar</NavButton>
        </div>
      </div>

      <main className="flex-grow flex flex-col p-6 space-y-6 w-full overflow-y-auto">
        {activeView === 'files' ? (
            <>
                <div>
                  <FileDropzone onFilesAdded={handleFilesAdded} />
                </div>
                
                {uploadSuccess && (
                    <div className="bg-green-500/20 border border-green-400/50 text-green-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Èxit!</strong>
                        <span className="block sm:inline"> Els teus arxius s'han enviat correctament.</span>
                    </div>
                )}

                {uploadError && (
                    <div className="bg-red-500/20 border border-red-400/50 text-red-300 px-4 py-3 rounded-lg relative" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline"> {uploadError}</span>
                    </div>
                )}
                
                <div className="flex-grow flex flex-col bg-white/5 rounded-xl p-6 shadow-inner min-h-[200px]">
                  <h2 className="text-lg font-semibold text-white mb-4">
                    Arxius per pujar ({files.length})
                    {files.length > 0 && !isProcessingFiles && (
                      <span className="text-gray-400 font-normal text-base ml-2">
                        ({totalSizeInMB} MB)
                      </span>
                    )}
                  </h2>
                  {hasContent ? (
                    <div className="flex flex-col h-full">
                      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                         <FileList
                            files={files}
                            onRemoveFile={handleRemoveFile}
                            onRenameFile={handleRenameFile}
                            isProcessing={isProcessingFiles}
                            processingCount={processingFileCount}
                         />
                      </div>
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <button
                          onClick={handleSend}
                          disabled={isSending || files.length === 0 || isProcessingFiles}
                          className="w-full sm:w-auto sm:float-right bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-cyan-500/30 transition-all duration-300 flex items-center justify-center transform hover:scale-105"
                        >
                          {isSending ? (
                            <>
                               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Enviant...
                            </>
                          ) : (
                            'Guarda i Envia'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center flex flex-col items-center justify-center h-full text-gray-500">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      <p>No has seleccionat cap arxiu.</p>
                      <p className="text-sm">Arrossega els arxius a l'àrea superior o fes clic per buscar.</p>
                    </div>
                  )}
                </div>
            </>
        ) : (
            <ContactPage 
              user={user} 
              messages={messages}
              onSendMessage={handleSendChatMessage}
              isSending={isSendingChat}
            />
        )}
      </main>
    </div>
  );
};

export default MainPage;
