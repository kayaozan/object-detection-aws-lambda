// Replace with your actual API Gateway endpoint
const API_ENDPOINT = 'https://0y2shwjt4c.execute-api.eu-north-1.amazonaws.com/prod';

let selectedFile = null;

// File input handling
const fileInput = document.getElementById('file-input');
const uploadArea = document.getElementById('upload-area');
const uploadIcon = document.getElementById('upload-icon');
const uploadText = document.getElementById('upload-text');
const uploadSubtext = document.getElementById('upload-subtext');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const detectBtn = document.getElementById('detect-btn');

fileInput.addEventListener('change', handleFileSelect);
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', handleDragOver);
uploadArea.addEventListener('dragleave', handleDragLeave);
uploadArea.addEventListener('drop', handleDrop);

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedFile = file;
        updateFileDisplay(file);
        detectBtn.disabled = false;
        showPreview(file);
        hideError();
    }
}

function updateFileDisplay(file) {
    // Update upload area appearance
    uploadArea.classList.add('file-selected');
    uploadIcon.classList.add('file-selected');
    uploadIcon.textContent = '✅';
    uploadText.textContent = 'Image selected!';
    uploadSubtext.textContent = 'Click "Detect Objects" to analyze';
    
    // Show file information
    fileName.textContent = `📷 ${file.name}`;
    fileSize.textContent = `💾 Size: ${formatFileSize(file.size)}`;
    fileInfo.classList.add('show');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleDragOver(event) {
    event.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        selectedFile = files[0];
        fileInput.files = files;
        updateFileDisplay(files[0]);
        detectBtn.disabled = false;
        showPreview(files[0]);
        hideError();
    }
}

function showPreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('original-image').src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function showLoading() {
    document.getElementById('loading').classList.add('show');
    detectBtn.disabled = true;
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
    detectBtn.disabled = false;
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
}

function hideError() {
    document.getElementById('error').classList.remove('show');
}

function showResults() {
    document.getElementById('result-section').classList.add('show');
}

function hideResults() {
    document.getElementById('result-section').classList.remove('show');
}

async function detectObjects() {
    if (!selectedFile) {
        showError('Please select an image first.');
        return;
    }

    showLoading();
    hideError();
    hideResults();

    // Convert file to base64
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            // Get base64 string (remove data:image/...;base64, prefix)
            const base64Data = e.target.result.split(',')[1];
            console.log('Base64 length:', base64Data.length);
            
            const response = await fetch(`${API_ENDPOINT}/detect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64Data
                })
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.log('Error response:', errorData);
                    errorMessage = errorData.detail || errorMessage;
                } catch (e) {
                    try {
                        const errorText = await response.text();
                        console.log('Error text:', errorText);
                        errorMessage = errorText || response.statusText || errorMessage;
                    } catch (e2) {
                        errorMessage = response.statusText || errorMessage;
                    }
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Success response received');
            
            const resultImage = document.getElementById('result-image');
            resultImage.src = `data:image/jpeg;base64,${result.image}`;
            
            showResults();
        } catch (error) {
            console.error('Error:', error);
            showError(`Failed to detect objects: ${error.message}`);
        } finally {
            hideLoading();
        }
    };

    reader.onerror = function(error) {
        console.error('FileReader error:', error);
        showError('Failed to read the selected file.');
        hideLoading();
    };

    // Read file as data URL (base64)
    reader.readAsDataURL(selectedFile);
}


function useSampleImage() {
    // Assuming sample image is named 'sample.jpg' in the same folder
    const sampleImagePath = './sample.jpg';
    
    fetch(sampleImagePath)
        .then(response => response.blob())
        .then(blob => {
            // Create a File object from the blob
            const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
            selectedFile = file;
            
            // Update the display
            updateFileDisplay(file);
            detectBtn.disabled = false;
            showPreview(file);
            hideError();
        })
        .catch(error => {
            console.error('Error loading sample image:', error);
            showError('Failed to load sample image. Make sure sample.jpg exists in the same folder.');
        });
}

function resetApp() {
    selectedFile = null;
    fileInput.value = '';
    detectBtn.disabled = true;
    document.getElementById('sample-btn').disabled = false;

    // Reset upload area
    uploadArea.classList.remove('file-selected');
    uploadIcon.classList.remove('file-selected');
    uploadIcon.textContent = '📷';
    uploadText.textContent = 'Click to upload or drag and drop';
    uploadSubtext.textContent = 'Supported formats: JPG, PNG, GIF';
    
    // Hide file info
    fileInfo.classList.remove('show');
    
    hideResults();
    hideError();
    hideLoading();
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Check if API endpoint is configured
    if (API_ENDPOINT.includes('YOUR_API_ID')) {
        showError('Please update the API_ENDPOINT in the script with your actual API Gateway URL.');
    }
});