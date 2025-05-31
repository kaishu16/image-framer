import React, { useState } from 'react';
import ImageUploader from './components/ImageUploader';
import CanvasEditor from './components/CanvasEditor';
import './App.css'; // グローバルなスタイルシート

// ★ 固定のフレーム画像を定義します。
// publicフォルダにこのパスで画像を配置してください。
const FIXED_FRAME_IMAGE = {
  id: 'fixed_round_frame',
  src: '/frame.png', // 例: public/frames/fixed_round_frame.png
  name: '固定の丸枠',
};

function App() {
  const [userImage, setUserImage] = useState(null); // ユーザーがアップロードした画像 (Imageオブジェクト)

  // ユーザー画像のアップロードハンドラ
  const handleImageUpload = (imageFile) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUserImage(img);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>みやあい枠フレーム作成</h1>
      </header>

      <main className="App-main">
        {(
          <div className="editor-container">
            <div className="controls">
              <h2>1. 画像をアップロード</h2>
              <ImageUploader onImageUpload={handleImageUpload} />
              <p className="fixed-frame-info">
                使用するフレーム:
                <br />
                <img src={FIXED_FRAME_IMAGE.src} alt={FIXED_FRAME_IMAGE.name} style={{ maxWidth: '80px', marginTop: '10px', border: '1px solid #ddd' }} />
              </p>
            </div>

            <div className="canvas-area">
              <h2>2. プレビューと調整</h2> {/* 番号を調整 */}
              {userImage ? (
                <CanvasEditor
                  userImage={userImage}
                  frameImageSrc={FIXED_FRAME_IMAGE.src} // ★ 固定フレームのパスを渡す
                  initialCanvasWidth={500} // キャンバスの初期幅
                  initialCanvasHeight={500} // キャンバスの初期高さ
                />
              ) : (
                <p className="placeholder-text">画像をアップロードしてください。</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;