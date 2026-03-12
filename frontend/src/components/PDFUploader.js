// frontend/src/components/PDFUploader.js
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function PDFUploader({ onUpload }) {
  const [uploading, setUploading] = useState(false);
  const { authAxios } = useAuth();
  const navigate = useNavigate();

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setUploading(true);
      
      if (onUpload) {
        await onUpload(file);
      } else {
        const response = await authAxios.post('/upload-pdf/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        toast.success(`✅ PDF uploaded successfully! Found ${response.data.expenses_found} expenses.`);
        
        setTimeout(() => {
          navigate(`/pdf-analytics/${response.data.upload_id}`);
        }, 1500);
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('❌ Error uploading PDF: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="card pdf-uploader-card">
      <h3>Upload PDF Report</h3>
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
      >
        <input {...getInputProps()} />
        <FaCloudUploadAlt className="upload-icon" />
        
        {uploading ? (
          <div className="uploading-status">
            <div className="spinner"></div>
            <p>Uploading and processing PDF...</p>
          </div>
        ) : isDragActive ? (
          <p>Drop the PDF here...</p>
        ) : (
          <>
            <p>Drag & drop a PDF here, or click to select</p>
            <small className="file-hint">Maximum file size: 10MB</small>
          </>
        )}
      </div>
    </div>
  );
}

export default PDFUploader;