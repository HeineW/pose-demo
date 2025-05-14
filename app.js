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

async function runPoseNet() {
  await setupCamera();
  video.play();

  const net = await posenet.load();

  async function detect() {
    const pose = await net.estimateSinglePose(video, {
      flipHorizontal: false
    });

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let found = 0;

    pose.keypoints.forEach((p) => {
      if (p.score > 0.3) {
        const x = p.position.x * scaleX;
        const y = p.position.y * scaleY;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = "yellow";
        ctx.fill();
        found++;
      }
    });

    const skeleton = [
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

    skeleton.forEach(([partA, partB]) => {
      const kp1 = pose.keypoints.find(k => k.part === partA);
      const kp2 = pose.keypoints.find(k => k.part === partB);
      if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
        const x1 = kp1.position.x * scaleX;
        const y1 = kp1.position.y * scaleY;
        const x2 = kp2.position.x * scaleX;
        const y2 = kp2.position.y * scaleY;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    });

    ctx.fillStyle = "lime";
    ctx.font = "18px sans-serif";
    ctx.fillText("Ключевых точек найдено: " + found, 10, 25);

    requestAnimationFrame(detect);
  }

  detect();
}

runPoseNet();
