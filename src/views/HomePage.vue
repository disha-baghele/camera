<template>
  <div>
    <!-- Initial Button -->
    <button v-if="!showCamera" @click="openCamera" class="open-camera-btn">
      Open Camera
    </button>

    <!-- Preview Section for Main Screen -->
    <div v-if="!showCamera && capturedImages.length > 0" class="main-preview">
      <h3>Captured Images</h3>
      <div class="main-preview-strip">
        <div v-for="(image, index) in capturedImages" :key="index" class="main-preview-item">
          <img :src="image" alt="captured" />
          <button @click="removeImage(index)" class="remove-btn">&times;</button>
        </div>
      </div>
    </div>

    <!-- PWA Camera Interface -->
    <div v-if="showCamera" class="camera-interface">
      <!-- Camera View -->
      <div class="camera-view">
        <video ref="video" autoplay playsinline class="camera-preview"></video>

        <!-- Captured Images Preview -->
        <div class="preview-strip" v-if="capturedImages.length > 0">
          <div v-for="(image, index) in capturedImages" :key="index" class="preview-item">
            <img :src="image" alt="captured" />
            <button @click="removeImage(index)" class="remove-btn">&times;</button>
          </div>
        </div>

        <!-- Controls -->
        <div class="camera-controls">
          <button @click="openGallery" class="control-btn">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M5.41667 22.75H20.5833C21.78 22.75 22.75 21.78 22.75 20.5833V5.41667C22.75 4.22005 21.78 3.25 20.5833 3.25H5.41667C4.22005 3.25 3.25 4.22005 3.25 5.41667V20.5833C3.25 21.78 4.22005 22.75 5.41667 22.75ZM5.41667 22.75L17.3333 10.8333L22.75 16.25M10.8333 9.20833C10.8333 10.1058 10.1058 10.8333 9.20833 10.8333C8.31087 10.8333 7.58333 10.1058 7.58333 9.20833C7.58333 8.31087 8.31087 7.58333 9.20833 7.58333C10.1058 7.58333 10.8333 8.31087 10.8333 9.20833Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
          </button>

          <button @click="capturePhoto" class="capture-btn">
            <div class="capture-inner"></div>
          </button>

          <button @click="flipCamera" class="control-btn">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M24.9163 4.33321V10.8332M24.9163 10.8332H18.4163M24.9163 10.8332L19.8897 6.10988C18.7254 4.94498 17.2849 4.09402 15.7028 3.63638C14.1207 3.17875 12.4484 3.12936 10.842 3.49282C9.23559 3.85629 7.74746 4.62076 6.51643 5.71491C5.2854 6.80906 4.35161 8.19723 3.80217 9.74988M1.08301 21.6665V15.1665M1.08301 15.1665H7.58301M1.08301 15.1665L6.10967 19.8899C7.27398 21.0548 8.71441 21.9057 10.2966 22.3634C11.8787 22.821 13.551 22.8704 15.1574 22.5069C16.7638 22.1435 18.2519 21.379 19.4829 20.2848C20.7139 19.1907 21.6477 17.8025 22.1972 16.2499" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
          </button>
        </div>

        <!-- Action Buttons -->
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

    <!-- Hidden Canvas -->
    <canvas ref="canvas" style="display: none;"></canvas>
  </div>
</template>

<script>
import { ref, onUnmounted } from 'vue';

export default {
  name: 'PWACamera',
  emits: ['imagesSelected'],

  setup(props, { emit }) {
    const video = ref(null);
    const canvas = ref(null);
    const stream = ref(null);
    const showCamera = ref(false);
    const capturedImages = ref([]);
    const facingMode = ref('environment');

    const openCamera = async () => {
      showCamera.value = true;
      await startCamera();
    };

    const startCamera = async () => {
      try {
        if (stream.value) {
          stream.value.getTracks().forEach(track => track.stop());
        }

        stream.value = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode.value },
          audio: false
        });

        if (video.value) {
          video.value.srcObject = stream.value;
        }
      } catch (error) {
        console.error('Camera start failed:', error);
      }
    };

    const capturePhoto = async () => {
      if (!video.value || !canvas.value) return;

      const videoElem = video.value;
      const canvasElem = canvas.value;

      // Set canvas dimensions to match video
      canvasElem.width = videoElem.videoWidth;
      canvasElem.height = videoElem.videoHeight;

      // Draw the video frame to canvas
      const ctx = canvasElem.getContext('2d');
      ctx.drawImage(videoElem, 0, 0);

      // Convert to image and save
      const imageData = canvasElem.toDataURL('image/jpeg', 0.8);
      capturedImages.value.push(imageData);
    };

    const openGallery = async () => {
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = 'image/*';

        input.onchange = async (e) => {
          const files = Array.from(e.target.files || []);

          for (const file of files) {
            const reader = new FileReader();

            reader.onload = (event) => {
              capturedImages.value.push(event.target.result);
            };

            reader.readAsDataURL(file);
          }
        };

        input.click();
      } catch (error) {
        console.error('Gallery selection failed:', error);
      }
    };

    const flipCamera = async () => {
      facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
      await startCamera();
    };

    const removeImage = (index) => {
      capturedImages.value.splice(index, 1);
    };

    const confirmImages = () => {
      emit('imagesSelected', capturedImages.value);
      closeCamera();
    };

    const closeCamera = () => {
      if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
      }
      showCamera.value = false; // Keep capturedImages intact
    };

    onUnmounted(() => {
      if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
      }
    });

    return {
      video,
      canvas,
      showCamera,
      capturedImages,
      openCamera,
      capturePhoto,
      openGallery,
      flipCamera,
      removeImage,
      confirmImages,
      closeCamera
    };
  }
};
</script>

<style scoped>
.open-camera-btn {
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  position: absolute;
  top: 50%; /* Center vertically */
  left: 50%; /* Center horizontally */
  transform: translate(-50%, -50%); /* Offset the position for perfect centering */
  display: block;
  z-index: 999; /* Ensure it is above other content */
}

.main-preview {
  padding: 20px;
}

.main-preview h3 {
  margin-bottom: 10px;
  font-size: 18px;
}

.main-preview-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap; /* Allow images to wrap when there's more */
  justify-content: flex-start; /* Align images to the start of the container */
  overflow-y: auto; /* Allow vertical scrolling */
}

.main-preview-item {
  position: relative;
  height: 100px;
  width: 100px;
  margin-bottom: 10px;
}

.main-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
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
  display: flex;
  flex-direction: column;
}

.camera-preview {
  flex: 1;
  width: 100%;
  object-fit: cover;
}

.preview-strip {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 100px;
  display: flex;
  padding: 10px;
  overflow-x: auto; /* Enables horizontal scrolling */
  background: rgba(0, 0, 0, 0.5);
  gap: 10px;
  scrollbar-width: none; /* Hides scrollbar in Firefox */
}

.preview-strip::-webkit-scrollbar {
  display: none; /* Hides scrollbar in WebKit browsers (Chrome, Safari, etc.) */
}

.preview-item {
  flex: 0 0 auto; /* Prevents shrinking of items and ensures fixed size */
  height: 80px;
  width: 80px;
  position: relative;
}

.preview-item img {
  height: 100%;
  width: 100%;
  object-fit: cover;
  border-radius: 8px;
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
  width: 50px;
  height: 50px;
  border-radius: 25px;
  background: #7A7575; /* Increase opacity */
  border: none;
  color: #007bff; /* Change icon color */
  font-size: 20px;
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
  border: 3px solid #7A7575;
  color: #7A7575;
}

.action-buttons {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.5);
}

.close-btn, .confirm-btn {
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
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: red;
  color: white;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
</style>
