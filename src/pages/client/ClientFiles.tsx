import React, { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Client, SharedFile } from '../../types';
import Card from '../../components/Card';
import Button from '../../components/Button';

// --- ICONS ---
const ShieldCheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008h-.008v-.008Z" />
    </svg>
);
const DocumentIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);
const PhotoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
);
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => ( <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}> <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.067-2.09 1.02-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /> </svg> );


const ClientFiles: React.FC = () => {
    const { user, clients, setClients } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newFile: SharedFile = {
                id: `file-${Date.now()}`,
                fileName: file.name,
                fileType: file.type,
                fileContent: e.target?.result as string, // base64
                uploadedAt: new Date().toISOString(),
                size: file.size,
            };

            const updatedClients = clients.map(c => 
                c.id === user.id 
                ? { ...c, sharedFiles: [...(c.sharedFiles || []), newFile] }
                : c
            );
            setClients(updatedClients as Client[]);
        };
        reader.readAsDataURL(file);
    };
    
    const handleDeleteFile = (fileId: string) => {
        if (!user || !window.confirm("Êtes-vous sûr de vouloir supprimer ce fichier ?")) return;
        
        const updatedClients = clients.map(c => 
            c.id === user.id
            ? { ...c, sharedFiles: (c.sharedFiles || []).filter(f => f.id !== fileId) }
            : c
        );
        setClients(updatedClients as Client[]);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="space-y-6">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
            />
            <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                size="lg"
            >
                Téléverser un fichier
            </Button>
            
             <Card className="!bg-primary/10 dark:!bg-primary/20 p-4 border border-primary/20 dark:border-primary/30">
                <div className="flex items-center gap-4">
                    <ShieldCheckIcon className="w-10 h-10 text-primary flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-client-light">Vos documents sont sécurisés</h3>
                        <p className="text-sm text-gray-700 dark:text-client-subtle mt-1">
                            Les fichiers que vous téléversez ici sont stockés de manière sécurisée et ne sont visibles que par votre coach.
                        </p>
                    </div>
                </div>
            </Card>

            <div className="space-y-3">
                {(user?.sharedFiles || []).length > 0 ? (
                    user?.sharedFiles?.map(file => (
                        <Card key={file.id} className="!bg-white dark:!bg-client-card p-3 !shadow-sm border border-gray-200 dark:border-transparent">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 dark:bg-client-dark rounded-lg">
                                    {file.fileType.startsWith('image/') ? (
                                        <PhotoIcon className="w-6 h-6 text-primary" />
                                    ) : (
                                        <DocumentIcon className="w-6 h-6 text-primary" />
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="font-semibold text-gray-900 dark:text-client-light truncate">{file.fileName}</p>
                                    <p className="text-xs text-gray-500 dark:text-client-subtle">
                                        {new Date(file.uploadedAt).toLocaleDateString('fr-FR')} &middot; {formatFileSize(file.size)}
                                    </p>
                                </div>
                                <button onClick={() => handleDeleteFile(file.id)} className="p-2 text-gray-500 dark:text-client-subtle hover:text-red-500" aria-label="Supprimer le fichier">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-10">
                        <p className="text-lg text-gray-800 dark:text-client-light">Votre cloud est vide.</p>
                        <p className="text-gray-500 dark:text-client-subtle mt-1">Téléversez des bilans, des photos ou tout autre document à partager.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientFiles;