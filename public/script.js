// DOM Elements
let selectedFile = null;
let currentFormat = 'json';
let translationResults = null;

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const translateBtn = document.getElementById('translateBtn');
const languageSelect = document.getElementById('language');
const codeInput = document.getElementById('code');
const apiKeyInput = document.getElementById('apiKey');
const resultsDisplay = document.getElementById('resultsDisplay');
const emptyState = document.getElementById('emptyState');
const downloadBtn = document.getElementById('downloadBtn');
const copyResultBtn = document.getElementById('copyResultBtn');

// File Upload Handling
uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/json') {
        handleFileSelect(file);
    } else {
        showNotification('Please upload a valid JSON file', 'error');
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleFileSelect(e.target.files[0]);
    }
});

function handleFileSelect(file) {
    selectedFile = file;
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const uploadContent = document.querySelector('.upload-content');
    
    fileName.textContent = file.name;
    uploadContent.style.display = 'none';
    fileInfo.style.display = 'flex';
    
    // Preview JSON content
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target.result);
            document.getElementById('jsonContent').textContent = JSON.stringify(json, null, 2);
            document.getElementById('jsonPreview').style.display = 'block';
            validateForm();
        } catch (error) {
            showNotification('Invalid JSON file', 'error');
            removeFile();
        }
    };
    reader.readAsText(file);
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.querySelector('.upload-content').style.display = 'block';
    document.getElementById('jsonPreview').style.display = 'none';
    validateForm();
}

// Format Toggle
document.querySelectorAll('.format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFormat = btn.dataset.format;
        validateForm();
    });
});

// API Key Toggle
document.getElementById('toggleApiKey').addEventListener('click', () => {
    const type = apiKeyInput.type === 'password' ? 'text' : 'password';
    apiKeyInput.type = type;
    document.getElementById('toggleApiKey').textContent = type === 'password' ? 'Show' : 'Hide';
});