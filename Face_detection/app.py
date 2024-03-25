import cv2
import numpy as np
import torch
from torchvision import transforms
from facenet_pytorch import InceptionResnetV1

# Step 1: Load pre-trained face detection model (Haar cascades)
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Step 2: Load pre-trained face recognition model (ArcFace or Siamese Network)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
face_recognition_model = InceptionResnetV1(pretrained='vggface2').eval().to(device)

# Step 3: Define function for face detection
def detect_faces(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
    return faces

# Step 4: Define function for face recognition
def recognize_faces(image, faces):
    embeddings = []
    for (x, y, w, h) in faces:
        face = image[y:y+h, x:x+w]
        face = cv2.resize(face, (160, 160))
        face = transforms.functional.to_tensor(face).unsqueeze(0).to(device)
        embedding = face_recognition_model(face).detach().cpu().numpy()[0]
        embeddings.append(embedding)
    return embeddings

# Step 5: Define function for drawing bounding boxes and labels
def draw_boxes(image, faces, labels):
    for i, (x, y, w, h) in enumerate(faces):
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(image, labels[i], (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (36,255,12), 2)

# Step 6: Main function for processing video stream
def process_video_stream(video_path):
    cap = cv2.VideoCapture(r"C:\Users\cosym\Downloads\IMG_20220220_104420_815.jpg")
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        faces = detect_faces(frame)
        if len(faces) > 0:
            embeddings = recognize_faces(frame, faces)
            # Perform face recognition tasks with embeddings (e.g., compare with known embeddings)
            labels = ['Person {}'.format(i+1) for i in range(len(faces))]  # Placeholder labels
            draw_boxes(frame, faces, labels)
        cv2.imshow('Face Recognition', frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
    cap.release()
    cv2.destroyAllWindows()

# Step 7: Run the video processing function
if __name__ == "__main__":
    video_path = 'path_to_video.mp4'  # Provide path to your video file
    process_video_stream(video_path)
