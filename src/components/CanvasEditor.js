// src/components/CanvasEditor.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import './CanvasEditor.css';

const CanvasEditor = ({ userImage, frameImageSrc, initialCanvasWidth, initialCanvasHeight }) => {
  const canvasRef = useRef(null);
  const frameImageRef = useRef(null);
  const [ctx, setCtx] = useState(null);

  // 画像の初期パラメータを計算
  const getInitialImageParams = (img, canvasW, canvasH) => {
    if (!img) return { x: 0, y: 0, scale: 1, isDragging: false, lastX: 0, lastY: 0 };
    // キャンバスにフィットするスケール
    const scale = Math.min(
      (canvasW - 40) / img.width,
      (canvasH - 40) / img.height
    );
    // 中央に配置
    const x = (canvasW - img.width * scale) / 2;
    const y = (canvasH - img.height * scale) / 2;
    return { x, y, scale, isDragging: false, lastX: 0, lastY: 0 };
  };

  const [imageParams, setImageParams] = useState({
    x: 0, y: 0, scale: 1, isDragging: false, lastX: 0, lastY: 0,
  });

  // 画像アップロード時に初期位置・スケールを再計算
  useEffect(() => {
    if (!userImage) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setImageParams(getInitialImageParams(userImage, canvas.width, canvas.height));
  }, [userImage]);

  useEffect(() => {
    if (!frameImageSrc) return;
    const img = new Image();
    img.onload = () => {
      frameImageRef.current = img;
      drawCanvas();
    };
    img.src = frameImageSrc;
  }, [frameImageSrc]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    setCtx(context);

    const handleResize = () => {
      const parent = canvas.parentElement;
      const newWidth = Math.min(parent.clientWidth, initialCanvasWidth);
      const newHeight = (newWidth / initialCanvasWidth) * initialCanvasHeight;
      canvas.width = newWidth;
      canvas.height = newHeight;
      if (userImage) {
        setImageParams(getInitialImageParams(userImage, newWidth, newHeight));
      }
      drawCanvas();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line
  }, [userImage, frameImageSrc, initialCanvasWidth, initialCanvasHeight]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 丸くクリッピング
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 2 - 20;
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, false);
    ctx.clip();

    if (userImage) {
      ctx.save();
      ctx.translate(imageParams.x, imageParams.y);
      ctx.scale(imageParams.scale, imageParams.scale);
      ctx.drawImage(userImage, 0, 0, userImage.width, userImage.height);
      ctx.restore();
    }
    ctx.restore();

    if (frameImageRef.current) {
      ctx.drawImage(frameImageRef.current, 0, 0, canvas.width, canvas.height);
    }
  }, [ctx, userImage, imageParams, frameImageRef.current]);

  useEffect(() => {
    drawCanvas();
  }, [imageParams, userImage, frameImageSrc, drawCanvas]);

  // --- 以下、ドラッグ・ホイール操作のままでもOKですが、中心基準で動かすなら ---
  const handleMouseDown = (e) => {
    if (!userImage) return;
    setImageParams(prev => ({
      ...prev,
      isDragging: true,
      lastX: e.clientX,
      lastY: e.clientY,
    }));
  };

  const handleMouseMove = (e) => {
    if (!imageParams.isDragging) return;
    const dx = e.clientX - imageParams.lastX;
    const dy = e.clientY - imageParams.lastY;
    setImageParams(prev => ({
      ...prev,
      x: prev.x + dx,
      y: prev.y + dy,
      lastX: e.clientX,
      lastY: e.clientY,
    }));
  };

  const handleMouseUp = () => {
    setImageParams(prev => ({ ...prev, isDragging: false }));
  };

  const handleMouseLeave = () => {
    setImageParams(prev => ({ ...prev, isDragging: false }));
  };

  const handleWheel = (e) => {
    if (!userImage) return;
    e.preventDefault();
    const scaleAmount = 0.1;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setImageParams(prev => {
      const newScale = e.deltaY < 0 ? prev.scale * (1 + scaleAmount) : prev.scale / (1 + scaleAmount);
      // 拡大縮小の中心をマウス位置に
      const offsetX = (mouseX - prev.x) / prev.scale;
      const offsetY = (mouseY - prev.y) / prev.scale;
      const newX = mouseX - offsetX * newScale;
      const newY = mouseY - offsetY * newScale;
      return {
        ...prev,
        scale: newScale,
        x: newX,
        y: newY,
      };
    });
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

  const handleReset = () => {
    const canvas = canvasRef.current;
    if (!canvas || !userImage) return;
    setImageParams(getInitialImageParams(userImage, canvas.width, canvas.height));
  };

  return (
    <div className="canvas-editor-container">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ cursor: imageParams.isDragging ? 'grabbing' : 'grab' }}
      ></canvas>

      <div className="canvas-controls">
        <button onClick={handleSaveImage} disabled={!userImage}>
          画像を保存
        </button>
        <button onClick={handleReset} disabled={!userImage}>
          リセット
        </button>
      </div>
    </div>
  );
};

export default CanvasEditor;