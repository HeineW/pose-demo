const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false
  });
  video.srcObject = stream;
  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      resolve();
    };
  });
}

async function run() {
  await setupCamera();
  video.play();

  await tf.setBackend('webgl');

  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: "Lightning" }
  );

  async function render() {
    const poses = await detector.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // тестовая отрисовка квадрата
    ctx.fillStyle = "red";
    ctx.fillRect(10, 10, 100, 100);

    if (poses.length > 0 && poses[0].keypoints) {
      const keypoints = poses[0].keypoints;
      let count = 0;

      keypoints.forEach(p => {
        if (p.score > 0.3) {
          count++;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = "yellow";
          ctx.fill();
        }
      });

      ctx.fillStyle = "lime";
      ctx.font = "18px sans-serif";
      ctx.fillText("Ключевых точек найдено: " + count, 10, 25);
    } else {
      ctx.fillStyle = "red";
      ctx.font = "20px sans-serif";
      ctx.fillText("Поза не найдена", 10, 30);
    }

    requestAnimationFrame(render);
  }

  render();
}

run();
