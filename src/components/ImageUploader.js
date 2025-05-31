import React from 'react';
import './ImageUploader.css'; // 独自のスタイルシート

function ImageUploader({ onImageUpload }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    } else {
      alert('画像ファイルを選択してください。');
    }
  };

  return (
    <div className="image-uploader">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        id="image-upload-input"
        className="hidden-input"
      />
      <label htmlFor="image-upload-input" className="upload-button">
        画像を選択
      </label>
      <p>または、ここに画像をドラッグ＆ドロップ</p>
      {/* TODO: ドラッグ＆ドロップ機能の実装 */}
    </div>
  );
}

export default ImageUploader;