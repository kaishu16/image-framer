import React, { useRef, useEffect, useState } from 'react';
import './CanvasEditor.css';

const CanvasEditor = ({
  userImage,
  frameImageSrc,
  initialCanvasSize = 500, // ← 幅・高さ共通
}) => {
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState(initialCanvasSize);
  const [imageParams, setImageParams] = useState({ x: 0, y: 0, scale: 1 });
  const initialParamsRef = useRef(null);
  const touchState = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    pinchStartDist: null,
    pinchStartScale: null,
    pinchStartCenter: null,
  });

  // 親要素や画面幅に応じて正方形サイズを決定
  useEffect(() => {
    const handleResize = () => {
      const parent = canvasRef.current?.parentElement;
      const size = Math.min(
        parent ? parent.clientWidth : initialCanvasSize,
        window.innerWidth,
        initialCanvasSize
      );
      setCanvasSize(size);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [initialCanvasSize]);

  const MAX_CANVAS_SIZE = 600; // 最大800px

  const setInitialParams = () => {
    const canvas = canvasRef.current;
    if (!canvas || !userImage) return;
  
    // 画像の解像度を基準にcanvasのピクセルサイズを決定
    const scaleW = userImage.width > MAX_CANVAS_SIZE ? MAX_CANVAS_SIZE / userImage.width : 1;
    const scaleH = userImage.height > MAX_CANVAS_SIZE ? MAX_CANVAS_SIZE / userImage.height : 1;
    const scale = Math.min(scaleW, scaleH);
  
    const canvasW = Math.round(userImage.width * scale);
    const canvasH = Math.round(userImage.height * scale);
  
    canvas.width = canvasW;
    canvas.height = canvasH;
  
    // 表示サイズは親要素や画面幅にフィット
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
  
    // 画像を中央＆フィット
    const fitScale = Math.min(
      (canvasW - 40) / userImage.width,
      (canvasH - 40) / userImage.height
    );
    const x = (canvasW - userImage.width * fitScale) / 2;
    const y = (canvasH - userImage.height * fitScale) / 2;
    const params = { x, y, scale: fitScale };
    initialParamsRef.current = params;
    setImageParams(params);
  };

  // 画像アップロード時
  useEffect(() => {
    setTimeout(setInitialParams, 0);
    // eslint-disable-next-line
  }, [userImage]);

  // 描画
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !userImage) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 丸くクリッピング
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 10;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();

    // draw user image（高解像度で描画）
    ctx.save();
    ctx.translate(imageParams.x, imageParams.y);
    ctx.scale(imageParams.scale, imageParams.scale);
    ctx.drawImage(userImage, 0, 0, userImage.width, userImage.height);
    ctx.restore();

    ctx.restore();

    // draw frame
    if (frameImageSrc) {
      const frameImg = new window.Image();
      frameImg.onload = () => {
        ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);
      };
      frameImg.src = frameImageSrc;
    }
  }, [userImage, frameImageSrc, imageParams]);

  // タッチ操作
  const handleTouchStart = (e) => {
    if (!userImage) return;
    if (e.touches.length === 1) {
      touchState.current.dragging = true;
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchState.current.pinchStartDist = dist;
      touchState.current.pinchStartScale = imageParams.scale;
      // ピンチ中心
      touchState.current.pinchStartCenter = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
    e.preventDefault();
  };

  const handleTouchMove = (e) => {
    if (!userImage) return;
    if (e.touches.length === 1 && touchState.current.dragging) {
      const dx = e.touches[0].clientX - touchState.current.lastX;
      const dy = e.touches[0].clientY - touchState.current.lastY;
      setImageParams(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      touchState.current.lastX = e.touches[0].clientX;
      touchState.current.lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2 && touchState.current.pinchStartDist && touchState.current.pinchStartScale) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scaleChange = dist / touchState.current.pinchStartDist;
      let newScale = touchState.current.pinchStartScale * scaleChange;
      // 下限は初期スケール
      const minScale = initialParamsRef.current ? initialParamsRef.current.scale : 0.1;
      newScale = Math.max(minScale, Math.min(newScale, 10));
      // ピンチ中心
      const center = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
      setImageParams(prev => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const pinchX = center.x - rect.left;
        const pinchY = center.y - rect.top;
        const offsetX = (pinchX - prev.x) / prev.scale;
        const offsetY = (pinchY - prev.y) / prev.scale;
        const newX = pinchX - offsetX * newScale;
        const newY = pinchY - offsetY * newScale;
        return {
          ...prev,
          scale: newScale,
          x: newX,
          y: newY,
        };
      });
    }
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    touchState.current.dragging = false;
    touchState.current.pinchStartDist = null;
    touchState.current.pinchStartScale = null;
    touchState.current.pinchStartCenter = null;
  };

  const handleReset = () => {
    if (initialParamsRef.current) setImageParams(initialParamsRef.current);
  };

  const handleSaveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'framed_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="canvas-editor-container">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: 'auto', aspectRatio: '1 / 1', touchAction: 'none', background: '#fff', borderRadius: '16px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        width={canvasSize}
        height={canvasSize}
      />
      <div className="canvas-controls">
        <button onClick={handleSaveImage}>画像を保存</button>
        <button onClick={handleReset}>リセット</button>
      </div>
    </div>
  );
};

export default CanvasEditor;