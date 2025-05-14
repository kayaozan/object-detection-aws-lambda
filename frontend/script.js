const apiUrl = "http://localhost:8000/detect"; // Change this to your deployed endpoint

async function uploadImage() {
  const input = document.getElementById("imageInput");
  const file = input.files[0];
  if (!file) return alert("Please select an image.");

  const reader = new FileReader();
  reader.onload = async () => {
    const base64Image = reader.result.split(",")[1];

    document.getElementById("message").textContent = "Detecting...";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Image })
      });

      const data = await response.json();
      document.getElementById("outputImage").src = "data:image/jpeg;base64," + data.image;
      document.getElementById("message").textContent = "Detection complete.";
    } catch (err) {
      document.getElementById("message").textContent = "Error: " + err.message;
    }
  };

  reader.readAsDataURL(file);
}