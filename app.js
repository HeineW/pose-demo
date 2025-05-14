const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Функция настройки камеры
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
        // Устанавливаем реальные размеры видео
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        // Canvas должен иметь реальные размеры видео
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        
        // Видео оставляем с CSS-размерами (100%)
        video.width = video.clientWidth;
        video.height = video.clientHeight;
        
        console.log(`Video dimensions: ${videoWidth}x${videoHeight}`);
        console.log(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
        resolve();
      };
    });
  } catch (error) {
    console.error("Camera access error:", error);
    throw error;
  }
}

// Функция отрисовки скелета
function drawSkeleton(pose) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Масштабируем координаты под реальные размеры canvas
  const scaleX = canvas.width / video.clientWidth;
  const scaleY = canvas.height / video.clientHeight;

  // Рисуем ключевые точки
  let foundPoints = 0;
  pose.keypoints.forEach((point) => {
    if (point.score > 0.3) {
      const x = point.position.x * scaleX;
      const y = point.position.y * scaleY;
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
      const x1 = pointA.position.x * scaleX;
      const y1 = pointA.position.y * scaleY;
      const x2 = pointB.position.x * scaleX;
      const y2 = pointB.position.y * scaleY;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  });

  // Отображаем количество найденных точек
  ctx.fillStyle = "lime";
  ctx.font = "18px sans-serif";
  ctx.fillText(`Ключевых точек найдено: ${foundPoints}`, 10, 25);
}

// Основная функция
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
        flipHorizontal: false,
        decodingMethod: 'single-person'
      });

      drawSkeleton(pose);
      requestAnimationFrame(detectPose);
    }

    detectPose();
  } catch (error) {
    console.error("PoseNet error:", error);
    alert("Произошла ошибка при инициализации PoseNet: " + error.message);
  }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', () => {
  runPoseNet().catch(e => console.error("Application error:", e));
});
