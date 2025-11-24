import React, { useState, useRef } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { uploadToRAG, getRAGDocuments, RAGDocument } from '../services/backendClient';
import { DocumentIcon } from './icons/DocumentIcon';
import { TrashIcon } from './icons/TrashIcon';
import { TRIAGE_QUESTIONS } from '../constants';

export const RAGUploadPage: React.FC = () => {
    const [files, setFiles] = useState<File[]>([]);
    const [uploadedDocuments, setUploadedDocuments] = useState<RAGDocument[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedTechArea, setSelectedTechArea] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const techAreaOptions = TRIAGE_QUESTIONS.find(q => q.id === 'tech_area')?.options ?? [];

    const handleTechAreaSelect = async (area: string) => {
        setSelectedTechArea(area);
        try {
            const response = await getRAGDocuments(area);
            setUploadedDocuments(response.documents);
        } catch (error) {
            console.error("Failed to fetch documents:", error);
            // Don't alert here to avoid interrupting the user flow, just log it
        }
    };

    const handleFileChange = (newFiles: FileList | null) => {
        if (newFiles) {
            const validFiles = Array.from(newFiles).filter(file => file.type === 'text/plain');
            setFiles(prevFiles => {
                const uniqueNewFiles = validFiles.filter(
                    newFile => !prevFiles.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
                );
                return [...prevFiles, ...uniqueNewFiles];
            });
        }
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow drop
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFileChange(e.dataTransfer.files);
    };

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e.target.files);
        // Reset file input to allow selecting the same file again
        if (e.target) e.target.value = '';
    };

    const onRemoveFile = (index: number) => {
        setFiles(files => files.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0 || !selectedTechArea) return;

        try {
            // Prepare documents for upload
            const documents = await Promise.all(
                files.map(async (file) => ({
                    filename: file.name,
                    content: await file.text(),
                    size: file.size
                }))
            );

            // Call backend API
            const result = await uploadToRAG(documents, selectedTechArea);

            alert(result.message);
            setFiles([]);

            // Refresh the list of uploaded documents
            handleTechAreaSelect(selectedTechArea);

        } catch (error) {
            console.error("RAG upload failed:", error);
            alert(error instanceof Error ? error.message : "Failed to upload documents");
        }
    };

    return (
        <div className="p-4 sm:p-8 h-full flex flex-col items-center animate-fade-in">
            <div className="w-full max-w-3xl flex flex-col h-full">
                <div
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex flex-col items-center justify-center p-8 border-4 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragging ? 'border-[#FC9C44] bg-[#FC9C44]/20' : 'border-[#5C3C2C]/30 hover:border-[#5A84AC] hover:bg-[#5A84AC]/10'}`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={onFileSelect}
                        accept=".txt,text/plain"
                    />
                    <UploadIcon className="w-16 h-16 text-[#5C3C2C]/50 mb-4" />
                    <p className="text-lg font-semibold text-[#5C3C2C]">
                        Drag & Drop text files here
                    </p>
                    <p className="text-sm text-[#5C3C2C]/70 mt-1">
                        or <span className="text-[#5A84AC] font-medium">click to browse</span>
                    </p>
                    <p className="text-xs text-[#5C3C2C]/50 mt-4">
                        Only .txt files are accepted
                    </p>
                </div>

                <div className="my-6">
                    <h2 className="text-lg font-semibold text-[#5C3C2C] mb-3">
                        <span className="text-[#FC9C44] mr-1">*</span>Select a Technical Area
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {techAreaOptions.map(area => (
                            <button
                                key={area}
                                onClick={() => handleTechAreaSelect(area)}
                                className={`w-full text-center p-2 rounded-lg transition-all duration-300 border ${selectedTechArea === area
                                    ? 'bg-[#5A84AC] text-white border-[#5A84AC]'
                                    : 'bg-white/40 hover:bg-[#FC9C44]/20 border-[#742F14]/40 hover:border-[#FC9C44]'
                                    }`}
                            >
                                {area}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Display Uploaded Documents for Selected Area */}
                {selectedTechArea && (
                    <div className="mb-6 animate-fade-in">
                        <h3 className="text-md font-semibold text-[#5C3C2C] mb-2">
                            Existing Documents in {selectedTechArea}
                        </h3>
                        {uploadedDocuments.length > 0 ? (
                            <div className="bg-white/30 rounded-lg p-3 max-h-40 overflow-y-auto border border-[#5C3C2C]/10">
                                <ul className="space-y-2">
                                    {uploadedDocuments.map((doc, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-[#5C3C2C]/80">
                                            <DocumentIcon className="w-4 h-4 text-[#5A84AC]" />
                                            <span className="truncate">{doc.filename}</span>
                                            <span className="text-xs text-[#5C3C2C]/50 ml-auto">{(doc.size / 1024).toFixed(1)} KB</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p className="text-sm text-[#5C3C2C]/50 italic">No documents uploaded for this area yet.</p>
                        )}
                    </div>
                )
                }

                <div className="flex-grow overflow-y-auto">
                    {files.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-lg font-semibold text-[#5C3C2C]">Selected Files ({files.length})</h2>
                            {files.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-white/40 rounded-lg animate-fade-in-up">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <DocumentIcon className="w-6 h-6 text-[#5A84AC] flex-shrink-0" />
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="font-medium text-sm text-[#5C3C2C] truncate">{file.name}</span>
                                            <span className="text-xs text-[#5C3C2C]/70">{(file.size / 1024).toFixed(2)} KB</span>
                                        </div>
                                    </div>
                                    <button onClick={() => onRemoveFile(index)} className="p-1.5 rounded-full hover:bg-[#FC9C44]/40 transition-colors flex-shrink-0 ml-2" aria-label="Remove file">
                                        <TrashIcon className="w-5 h-5 text-[#742F14]" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-shrink-0 pt-6">
                    <button
                        onClick={handleUpload}
                        disabled={files.length === 0 || !selectedTechArea}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#5A84AC] hover:bg-[#4e769b] text-white rounded-md font-semibold transition-colors disabled:bg-[#5C3C2C]/40 disabled:cursor-not-allowed"
                    >
                        Upload to RAG Database
                    </button>
                </div>
            </div>
        </div>
    );
};