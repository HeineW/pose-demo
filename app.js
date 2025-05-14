const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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

  function drawTest() {
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "lime";
    ctx.fillRect(50, 50, 100, 100);

    requestAnimationFrame(drawTest);
  }

  drawTest();
}

run();
