const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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
      video.onloadedmetadata = () => resolve(video);
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

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  async function detect() {
    const poses = await detector.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (poses.length > 0 && poses[0].keypoints) {
      poses[0].keypoints.forEach((p) => {
        if (p.score > 0.5) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "lime";
          ctx.fill();
        }
      });
    }

    requestAnimationFrame(detect);
  }

  detect();
}

run();
