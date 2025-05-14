const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        // Получаем реальные размеры видео
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Устанавливаем такие же размеры для canvas
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Вычисляем соотношение сторон контейнера
        const container = document.querySelector('.video-container');
        const containerRatio = container.clientWidth / container.clientHeight;
        const videoRatio = videoWidth / videoHeight;
        
        // Вычисляем масштаб и смещение для правильного позиционирования
        let scale, offsetX = 0, offsetY = 0;
        
        if (containerRatio > videoRatio) {
          // Видео уже контейнера - масштабируем по высоте
          scale = container.clientHeight / videoHeight;
          offsetX = (container.clientWidth - videoWidth * scale) / 2;
        } else {
          // Видео шире контейнера - масштабируем по ширине
          scale = container.clientWidth / videoWidth;
          offsetY = (container.clientHeight - videoHeight * scale) / 2;
        }
        
        // Применяем трансформации к видео и canvas
        video.style.transform = `scale(${scale}) translate(${offsetX/scale}px, ${offsetY/scale}px)`;
        canvas.style.transform = `scale(${scale}) translate(${offsetX/scale}px, ${offsetY/scale}px)`;
        
        console.log(`Video: ${videoWidth}x${videoHeight}, Scale: ${scale}, Offset: ${offsetX},${offsetY}`);
        resolve();
      };
    });
  } catch (error) {
    console.error("Camera error:", error);
    throw error;
  }
}

function drawSkeleton(pose) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Рисуем ключевые точки
  let foundPoints = 0;
  pose.keypoints.forEach((point) => {
    if (point.score > 0.3) {
      const x = point.position.x;
      const y = point.position.y;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "yellow";
      ctx.fill();
      foundPoints++;
    }
  });

  // Рисуем соединения между точками
  const connections = [
    ["leftShoulder", "leftElbow"], ["leftElbow", "leftWrist"],
    ["rightShoulder", "rightElbow"], ["rightElbow", "rightWrist"],
    ["leftShoulder", "rightShoulder"],
    ["leftHip", "rightHip"],
    ["leftShoulder", "leftHip"], ["rightShoulder", "rightHip"],
    ["leftHip", "leftKnee"], ["leftKnee", "leftAnkle"],
    ["rightHip", "rightKnee"], ["rightKnee", "rightAnkle"]
  ];

  ctx.strokeStyle = "cyan";
  ctx.lineWidth = 2;

  connections.forEach(([partA, partB]) => {
    const pointA = pose.keypoints.find(k => k.part === partA);
    const pointB = pose.keypoints.find(k => k.part === partB);
    
    if (pointA && pointB && pointA.score > 0.3 && pointB.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(pointA.position.x, pointA.position.y);
      ctx.lineTo(pointB.position.x, pointB.position.y);
      ctx.stroke();
    }
  });

  // Отображаем количество найденных точек
  ctx.fillStyle = "lime";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Точек: ${foundPoints}`, 10, 25);
}

async function runPoseNet() {
  try {
    await setupCamera();
    video.play();

    const net = await posenet.load({
      architecture: 'MobileNetV1',
      outputStride: 16,
      inputResolution: 257,
      multiplier: 0.75
    });

    async function detectPose() {
      const pose = await net.estimateSinglePose(video, {
        flipHorizontal: true,
        decodingMethod: 'single-person'
      });

      drawSkeleton(pose);
      requestAnimationFrame(detectPose);
    }

    detectPose();
  } catch (error) {
    console.error("Error:", error);
    alert("Ошибка: " + error.message);
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', runPoseNet);
