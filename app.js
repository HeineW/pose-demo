const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Полифилл
if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {};
}
if (navigator.mediaDevices.getUserMedia === undefined) {
  navigator.mediaDevices.getUserMedia = function (constraints) {
    const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!getUserMedia) {
      alert("Ваш браузер не поддерживает getUserMedia");
      return Promise.reject(new Error("getUserMedia не поддерживается"));
    }
    return new Promise((resolve, reject) =>
      getUserMedia.call(navigator, constraints, resolve, reject)
    );
  };
}

async function setupCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        resolve(video);
      };
    });
  } catch (err) {
    alert("Ошибка доступа к камере: " + err.message);
    console.error(err);
  }
}

async function run() {
  await setupCamera();
  await video.play();

  const detector = await poseDetection.createDetector(
    poseDetection.SupportedModels.MoveNet,
    { modelType: "Lightning" }
  );

  async function detect() {
    const poses = await detector.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0 && poses[0].keypoints) {
      const keypoints = poses[0].keypoints;

      keypoints.forEach((p) => {
        if (p.score > 0.2) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = "yellow";
          ctx.fill();
        }
      });

      const connections = [
        [5, 7], [7, 9], [6, 8], [8, 10],
        [5, 6], [11, 13], [13, 15], [12, 14], [14, 16],
        [11, 12], [5, 11], [6, 12]
      ];

      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 2;
      connections.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        if (kp1.score > 0.2 && kp2.score > 0.2) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      });
    }

    requestAnimationFrame(detect);
  }

  detect();
}

run();
