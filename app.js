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

async function runPoseDetection() {
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

      const connections = [
        [5, 7], [7, 9], [6, 8], [8, 10], [5, 6],
        [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 12], [5, 11], [6, 12]
      ];

      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 2;
      connections.forEach(([i, j]) => {
        const p1 = keypoints[i];
        const p2 = keypoints[j];
        if (p1.score > 0.3 && p2.score > 0.3) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
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
  ctx.fillStyle = "red";
  ctx.fillRect(10,10,50,50)
}

runPoseDetection();
