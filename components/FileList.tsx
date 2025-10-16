import React, { useState, useRef, useEffect } from 'react';

interface FileListProps {
  files: File[];
  onRemoveFile: (file: File) => void;
  onRenameFile: (originalFile: File, newName: string) => void;
  isProcessing?: boolean;
  processingCount?: number;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileIcon: React.FC<{ file: File }> = ({ file }) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    let path = "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"; // Generic file icon
    let colorClass = "text-gray-400";

    switch (extension) {
        case 'pdf':
            path = "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z M9 12h6 M9 15h3";
            colorClass = "text-red-500";
            break;
        case 'xls':
        case 'xlsx':
            path = "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z M8 11h8v7h-8z M8 15h8 M11 11v7";
            colorClass = "text-green-500";
            break;
        case 'doc':
        case 'docx':
            path = "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z M9 13h6 M9 17h2";
            colorClass = "text-blue-500";
            break;
        case 'zip':
        case 'rar':
        case '7z':
            path = "M14 3v4a1 1 0 0 0 1 1h4 M5 12v-7a2 2 0 0 1 2 -2h7l5 5v4 M16 18h-2v-2h2v-2h-2v-2h2v6 M10 18h-2v-2h2v-2h-2v-2h2v6";
            colorClass = "text-yellow-500";
            break;
        case 'png':
        case 'jpg':
        case 'jpeg':
        case 'gif':
        case 'svg':
        case 'webp':
            path = "M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z M9 16l3-3 4 4 M9 10.5a.5.5 0 1 0 1 0 .5.5 0 0 0-1 0z";
            colorClass = "text-cyan-400";
            break;
        default:
            // Default is already set
            break;
    }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${colorClass} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
};

const FileListItemLoading: React.FC = () => (
    <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg">
        <div className="flex items-center space-x-4 min-w-0 flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a1 1 0 0 0 1 1h4 M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
            </svg>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-400 truncate">Processant arxiu...</p>
                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-2">
                    <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-1.5 rounded-full animate-progress-bar"></div>
                </div>
            </div>
        </div>
    </div>
);

const FileList: React.FC<FileListProps> = ({ files, onRemoveFile, onRenameFile, isProcessing, processingCount }) => {
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [draftName, setDraftName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingFile && inputRef.current) {
      inputRef.current.focus();
      const nameForSelection = editingFile.name;
      const dotIndex = nameForSelection.lastIndexOf('.');
      if (dotIndex !== -1) {
        inputRef.current.setSelectionRange(0, dotIndex);
      } else {
        inputRef.current.select();
      }
    }
  }, [editingFile]);
  
  const handleEditStart = (file: File) => {
    setEditingFile(file);
    setDraftName(file.name);
  };

  const handleRename = () => {
    if (!editingFile || draftName.trim() === '' || draftName.trim() === editingFile.name) {
      setEditingFile(null);
      return;
    }
    onRenameFile(editingFile, draftName.trim());
    setEditingFile(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleRename();
    } else if (event.key === 'Escape') {
      setEditingFile(null);
    }
  };


  return (
    <div className="w-full">
      <div className="space-y-2">
        {files.map(file => {
          const isEditing = editingFile === file;
          return (
            <div
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors duration-200"
            >
                <div className="flex items-center space-x-4 min-w-0">
                <FileIcon file={file} />
                <div className="min-w-0 flex-1">
                    {isEditing ? (
                        <input
                            ref={inputRef}
                            type="text"
                            value={draftName}
                            onChange={(e) => setDraftName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={handleKeyDown}
                            className="w-full bg-gray-900/80 text-sm font-medium text-gray-200 focus:outline-none p-0 border-b border-cyan-400"
                        />
                    ) : (
                        <p 
                            className="text-sm font-medium text-gray-200 truncate cursor-pointer"
                            onClick={() => handleEditStart(file)}
                            title={`Fes clic per canviar el nom de ${file.name}`}
                        >
                            {file.name}
                        </p>
                    )}
                    <p className="text-xs text-gray-400">{formatBytes(file.size)}</p>
                </div>
                </div>
                <button
                onClick={() => onRemoveFile(file)}
                className="ml-4 p-1 text-gray-500 hover:text-red-400 rounded-full hover:bg-red-500/10 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 flex-shrink-0"
                aria-label={`Elimina ${file.name}`}
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                </button>
            </div>
          );
        })}
        {isProcessing && Array.from({ length: processingCount || 0 }).map((_, index) => (
            <FileListItemLoading key={`loading-${index}`} />
        ))}
      </div>
       <style>{`
          @keyframes progress-bar-animation {
            0% { width: 0%; }
            100% { width: 100%; }
          }
          .animate-progress-bar {
            animation: progress-bar-animation 1.5s ease-out forwards;
          }
        `}</style>
    </div>
  );
};

export default FileList;