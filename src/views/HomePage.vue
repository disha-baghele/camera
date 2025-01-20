<template>
  <div class="camera-container">
    <!-- Initial Button -->
    <button v-if="!showCamera" @click="openCamera" class="open-camera-btn">
      Open Camera
    </button>

    <!-- Main Preview Section -->
    <div v-if="!showCamera && capturedImages.length > 0" class="main-preview">
      <h3>Captured Images</h3>
      <div class="preview-grid">
        <div
          v-for="(image, index) in capturedImages"
          :key="index"
          class="preview-item"
        >
          <img :src="image" alt="captured" />
          <button @click="removeImage(index)" class="remove-btn">
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- Camera Interface -->
    <div v-if="showCamera" class="camera-interface">
      <!-- Camera View -->
      <div class="camera-view">
        <video ref="video" autoplay playsinline class="camera-preview"></video>

        <!-- Flash Button -->
        <button @click="toggleFlash" class="flash-btn">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.9163 1.08337L2.16634 13H10.833L8.66634 24.9167L18.4163 13H9.74967L11.9163 1.08337Z"
              :stroke="flashEnabled ? '#007bff' : 'white'"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :fill="flashEnabled ? '#007bff' : 'none'"
            />
          </svg>
        </button>

        <!-- Horizontal Preview Strip -->
<div v-if="capturedImages.length > 0" class="preview-strip-container">
  <div class="preview-strip" ref="previewStrip">
    <div
      v-for="(image, index) in [...capturedImages].reverse()"
      :key="index"
      class="preview-strip-item"
      :class="{ 'latest': index === 0 }"
    >
      <img :src="image" alt="captured" />
      <!-- Strip remove button -->
      <button @click="removeImage(index)" class="remove-btn">
                &times;
              </button>
    </div>
  </div>
</div>


        <!-- Camera Controls -->
        <div class="camera-controls">
          <button @click="openGallery" class="control-btn">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.41667 22.75H20.5833C21.78 22.75 22.75 21.78 22.75 20.5833V5.41667C22.75 4.22005 21.78 3.25 20.5833 3.25H5.41667C4.22005 3.25 3.25 4.22005 3.25 5.41667V20.5833C3.25 21.78 4.22005 22.75 5.41667 22.75ZM5.41667 22.75L17.3333 10.8333L22.75 16.25M10.8333 9.20833C10.8333 10.1058 10.1058 10.8333 9.20833 10.8333C8.31087 10.8333 7.58333 10.1058 7.58333 9.20833C7.58333 8.31087 8.31087 7.58333 9.20833 7.58333C10.1058 7.58333 10.8333 8.31087 10.8333 9.20833Z"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <button @click="capturePhoto" class="capture-btn">
            <div class="capture-inner"></div>
          </button>

          <button @click="flipCamera" class="control-btn">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24.9163 4.33321V10.8332M24.9163 10.8332H18.4163M24.9163 10.8332L19.8897 6.10988C18.7254 4.94498 17.2849 4.09402 15.7028 3.63638C14.1207 3.17875 12.4484 3.12936 10.842 3.49282C9.23559 3.85629 7.74746 4.62076 6.51643 5.71491C5.2854 6.80906 4.35161 8.19723 3.80217 9.74988M1.08301 21.6665V15.1665M1.08301 15.1665H7.58301M1.08301 15.1665L6.10967 19.8899C7.27398 21.0548 8.71441 21.9057 10.2966 22.3634C11.8787 22.821 13.551 22.8704 15.1574 22.5069C16.7638 22.1435 18.2519 21.379 19.4829 20.2848C20.7139 19.1907 21.6477 17.8025 22.1972 16.2499"
                stroke="white"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>

        <!-- Bottom Action Buttons -->
        <div class="action-buttons">
          <button @click="closeCamera" class="close-btn">Close</button>
          <button
            @click="confirmImages"
            class="confirm-btn"
            :disabled="capturedImages.length === 0"
          >
            Done ({{ capturedImages.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Hidden Canvas for Image Processing -->
    <canvas ref="canvas" style="display: none"></canvas>
  </div>
</template>

<script>
import { ref, onUnmounted } from "vue";

export default {
  name: "PWACamera",
  emits: ["imagesSelected"],

  setup(props, { emit }) {
    const video = ref(null);
    const canvas = ref(null);
    const stream = ref(null);
    const showCamera = ref(false);
    const capturedImages = ref([]);
    const facingMode = ref("environment");
    const flashEnabled = ref(false);
    const screenFlashOverlay = ref(null);

    const openCamera = async () => {
      showCamera.value = true;
      await startCamera();
    };

    const startCamera = async () => {
      try {
        if (stream.value) {
          stream.value.getTracks().forEach((track) => track.stop());
        }

        const constraints = {
          video: {
            facingMode: facingMode.value,
            ...(facingMode.value === "environment" && {
              advanced: [{ torch: flashEnabled.value }],
            }),
          },
          audio: false,
        };

        stream.value = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (video.value) {
          video.value.srcObject = stream.value;
          await video.value.play();
        }
      } catch (error) {
        console.error("Failed to start camera:", error);
      }
    };

    const toggleFlash = async () => {
      if (!stream.value) return;
      
      try {
        const track = stream.value.getVideoTracks()[0];
        
        if (facingMode.value === 'environment' && track.getCapabilities()?.torch) {
          flashEnabled.value = !flashEnabled.value;
          await track.applyConstraints({
            advanced: [{ torch: flashEnabled.value }],
          });
        } else {
          // For front camera, just toggle the state
          flashEnabled.value = !flashEnabled.value;
        }
      } catch (error) {
        console.error("Flash toggle failed:", error);
        flashEnabled.value = false;
      }
    };

    const handleRearFlash = async () => {
      const track = stream.value?.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: true }],
      });
      await new Promise(r => setTimeout(r, 300));
      await takePhoto();
      await track.applyConstraints({
        advanced: [{ torch: false }],
      });
    };

    const handleFrontFlash = async () => {
      if (!screenFlashOverlay.value) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = '#ffffff';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.1s ease-in';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';
        document.body.appendChild(overlay);
        screenFlashOverlay.value = overlay;
      }

      const overlay = screenFlashOverlay.value;
      overlay.style.opacity = '0.9';
      await new Promise(r => setTimeout(r, 100));
      await takePhoto();
      overlay.style.opacity = '0';
    };

    const capturePhoto = async () => {
      if (!video.value || !canvas.value) return;

      try {
        if (flashEnabled.value) {
          if (facingMode.value === 'environment') {
            await handleRearFlash();
          } else {
            await handleFrontFlash();
          }
        } else {
          await takePhoto();
        }
      } catch (error) {
        console.error('Photo capture failed:', error);
        await takePhoto();
      }
    };

    const takePhoto = async () => {
      const videoElem = video.value;
      const canvasElem = canvas.value;

      canvasElem.width = videoElem.videoWidth;
      canvasElem.height = videoElem.videoHeight;

      const ctx = canvasElem.getContext("2d");
      ctx.drawImage(videoElem, 0, 0);

      const imageData = canvasElem.toDataURL("image/jpeg", 0.9);
      capturedImages.value.push(imageData);
    };

    const flipCamera = async () => {
      facingMode.value = facingMode.value === "environment" ? "user" : "environment";
      flashEnabled.value = false; // Reset flash when switching camera
      await startCamera();
    };

    const openGallery = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = "image/*";

      input.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach((file) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            capturedImages.value.push(event.target.result);
          };
          reader.readAsDataURL(file);
        });
      };

      input.click();
    };

    const removeImage = (index, fromPreviewStrip = false) => {
  if (fromPreviewStrip) {
    // Calculate the correct index in the original array based on the reversed order
    const originalIndex = capturedImages.value.length - 1 - index;
    capturedImages.value.splice(originalIndex, 1); // Remove the image from the original array
  } else {
    capturedImages.value.splice(index, 1); // Remove image from the main preview
  }
};


    const confirmImages = () => {
      emit("imagesSelected", capturedImages.value);
      closeCamera();
    };

    const closeCamera = () => {
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
      }
      showCamera.value = false;
    };

    onUnmounted(() => {
      if (stream.value) {
        stream.value.getTracks().forEach((track) => track.stop());
      }
      if (screenFlashOverlay.value) {
        screenFlashOverlay.value.remove();
      }
    });

    return {
      video,
      canvas,
      showCamera,
      capturedImages,
      flashEnabled,
      openCamera,
      toggleFlash,
      capturePhoto,
      openGallery,
      flipCamera,
      removeImage,
      confirmImages,
      closeCamera,
    };
  },
};
</script>

<style scoped>
.camera-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.open-camera-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  margin: 20px;
}

.camera-interface {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 1000;
}

.camera-view {
  height: 100%;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.camera-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.flash-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1001;
}

.latest-preview {
  position: absolute;
  bottom: 180px;
  right: 20px;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid white;
  z-index: 1001;
}

.latest-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-controls {
  position: absolute;
  bottom: 100px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px;
}

.control-btn {
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background: rgba(0, 0, 0, 0.5);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.capture-btn {
  width: 70px;
  height: 70px;
  border-radius: 35px;
  background: white;
  border: none;
  cursor: pointer;
  padding: 5px;
}

.capture-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 3px solid #666;
}

.action-buttons {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.5);
}

.close-btn,
.confirm-btn {
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-size: 16px;
  cursor: pointer;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.confirm-btn {
  background: #007bff;
  color: white;
}

.confirm-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
}

.remove-btn {
  position: absolute;
  top: 5px; /* Adjust as necessary for visibility */
  right: 5px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(255, 0, 0, 0.8);
  color: white;
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.camera-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.open-camera-btn {
  margin: 20px auto;
  display: block;
}

.main-preview {
  width: 100%;
  height: 100%;
  padding: 20px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
  padding: 16px;

  max-height: 90%; /* Adjust based on the space available above/below */
  overflow-y: auto; /* Enable vertical scrolling */
  box-sizing: border-box; /* Ensure padding is included in height calculation */
  flex-wrap: wrap;
}

.preview-grid, .preview-strip {
  display: flex;
  gap: 10px;
  padding: 0 10px;
  overflow-x: auto;
}



.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-strip-container {
  position: absolute;
  bottom: 180px;
  left: 0;
  width: 100%;
  padding: 10px;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.5);
}

.preview-strip {
  display: flex;
  gap: 8px;
  padding: 0 10px;
}

.preview-strip-item {
  position: relative;
  flex: 0 0 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.preview-strip-item.latest {
  border-color: #007bff;
}

.preview-strip-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-strip-item .remove-btn {
  top: -5px;
  right: -5px;
  background: rgba(255, 0, 0, 0.8); /* Same as main preview */
  font-size: 16px; /* Adjust size */
}

/* Ensure smooth scrolling */
.preview-strip-container {
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.preview-strip-container::-webkit-scrollbar {
  display: none;
}

/* Adjust camera controls position */
.camera-controls {
  bottom: 80px;
}
</style>