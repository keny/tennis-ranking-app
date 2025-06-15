'use client';

import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface UploadResult {
  fileName: string;
  success: boolean;
  data?: any;
  error?: string;
}

export default function TournamentUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [currentFile, setCurrentFile] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList) => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);

    for (const file of Array.from(files)) {
      setCurrentFile(file.name);
      
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/tournament/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        setResults(prev => [...prev, {
          fileName: file.name,
          success: response.ok,
          data: response.ok ? data : undefined,
          error: !response.ok ? (data.details || data.error) : undefined,
        }]);
      } catch (error) {
        setResults(prev => [...prev, {
          fileName: file.name,
          success: false,
          error: 'アップロードに失敗しました',
        }]);
      }
    }

    setUploading(false);
    setCurrentFile('');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    await processFiles(files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    // PDFファイルのみフィルタリング
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    if (pdfFiles.length === 0) {
      alert('PDFファイルを選択してください');
      return;
    }

    const dataTransfer = new DataTransfer();
    pdfFiles.forEach(file => dataTransfer.items.add(file));
    await processFiles(dataTransfer.files);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">トーナメント結果アップロード</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">PDFアップロード</h2>
          <p className="text-sm text-gray-600">
            JTAベテランテニス大会のトーナメント結果PDFをアップロードしてください。
            複数ファイルを同時に選択できます。
          </p>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <label className="mt-4 block cursor-pointer">
            <span className="mt-2 block text-sm font-medium text-gray-900">
              クリックしてPDFファイルを選択
            </span>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <span className="mt-2 block text-xs text-gray-600">
              または、ここにファイルをドラッグ＆ドロップ
            </span>
          </label>
        </div>

        {uploading && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-3" />
              <span className="text-sm text-blue-700">
                処理中: {currentFile}
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              PDFの解析には30秒〜1分程度かかる場合があります
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-3">処理結果</h3>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    result.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium">{result.fileName}</span>
                        </div>
                        {result.success && result.data && (
                          <p className="text-sm text-gray-600 mt-1">
                            {result.data.message}
                          </p>
                        )}
                        {result.error && (
                          <p className="text-sm text-red-600 mt-1">{result.error}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">注意事項</h3>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• 対応形式: JTAベテランテニス大会のトーナメント表PDF</li>
          <li>• 選手の登録番号がある場合は、既存の選手データと自動的に紐付けられます</li>
          <li>• 同じ大会を複数回アップロードした場合、カテゴリー単位で重複チェックされます</li>
          <li>• 処理には時間がかかる場合があります（1ファイルあたり30秒〜1分程度）</li>
        </ul>
      </div>
    </div>
  );
}