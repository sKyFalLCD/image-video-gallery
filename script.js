class FileManager {
    constructor() {
        this.files = [];
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileList = document.getElementById('fileList');
        this.previewModal = document.getElementById('previewModal');
        this.previewImg = document.getElementById('previewImage');
        
        this.init();
    }
    
    init() {
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });
        
        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });
        
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });
        
        this.previewModal.addEventListener('click', () => this.closePreview());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closePreview();
        });
        
        this.loadFiles();
    }
    
    handleFiles(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            this.addFile(fileList[i]);
        }
        this.fileInput.value = '';
    }
    
    addFile(file) {
        const reader = new FileReader();
        const self = this;
        
        reader.onload = function(e) {
            const fileData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                type: file.type.split('/')[0],
                mimeType: file.type,
                date: new Date().toLocaleString('zh-CN'),
                dataUrl: e.target.result
            };
            
            self.files.push(fileData);
            self.renderFileList();
            self.saveFiles();
        };
        
        reader.readAsDataURL(file);
    }
    
    renderFileList() {
        if (this.files.length === 0) {
            this.fileList.innerHTML = '<div class="empty-list">暂无文件，请上传</div>';
            return;
        }
        
        let html = '';
        for (let i = 0; i < this.files.length; i++) {
            const file = this.files[i];
            html += `
                <div class="file-item" data-id="${file.id}" data-index="${i}">
                    <img class="file-thumb" src="${file.dataUrl}" alt="${file.name}" data-index="${i}">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${this.formatSize(file.size)}</div>
                    <div class="file-date">${file.date}</div>
                    <div class="file-actions">
                        <button class="btn-up" data-index="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
                        <button class="btn-down" data-index="${i}" ${i === this.files.length - 1 ? 'disabled' : ''}>↓</button>
                        <button class="btn-delete" data-index="${i}">删除</button>
                    </div>
                </div>
            `;
        }
        this.fileList.innerHTML = html;
        
        const self = this;
        this.fileList.querySelectorAll('.file-thumb').forEach(function(img) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.showPreview(idx);
            });
        });
        
        this.fileList.querySelectorAll('.btn-up').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.moveUp(idx);
            });
        });
        
        this.fileList.querySelectorAll('.btn-down').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.moveDown(idx);
            });
        });
        
        this.fileList.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.deleteFile(idx);
            });
        });
    }
    
    showPreview(index) {
        const file = this.files[index];
        if (file && file.type === 'image') {
            this.previewImg.src = file.dataUrl;
            this.previewModal.classList.add('active');
        }
    }
    
    closePreview() {
        this.previewModal.classList.remove('active');
    }
    
    moveUp(index) {
        if (index > 0) {
            [this.files[index], this.files[index - 1]] = [this.files[index - 1], this.files[index]];
            this.renderFileList();
            this.saveFiles();
        }
    }
    
    moveDown(index) {
        if (index < this.files.length - 1) {
            [this.files[index], this.files[index + 1]] = [this.files[index + 1], this.files[index]];
            this.renderFileList();
            this.saveFiles();
        }
    }
    
    deleteFile(index) {
        if (confirm(`确定删除 "${this.files[index].name}" 吗？`)) {
            this.files.splice(index, 1);
            this.renderFileList();
            this.saveFiles();
        }
    }
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    
    saveFiles() {
        try {
            localStorage.setItem('skycallery_files', JSON.stringify(this.files));
        } catch (e) {
            console.warn('文件太大，无法保存到本地存储');
        }
    }
    
    loadFiles() {
        try {
            const saved = localStorage.getItem('skycallery_files');
            if (saved) {
                this.files = JSON.parse(saved);
                this.renderFileList();
            }
        } catch (e) {
            console.warn('无法加载已保存的文件');
        }
    }
}

const fileManager = new FileManager();

// 版本号
function updateVersion() {
    const now = new Date();
    const v = 'v1.0.' + 
        String(now.getFullYear()) + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + 
        String(now.getHours()).padStart(2, '0') + 
        String(now.getMinutes()).padStart(2, '0');
    document.getElementById('versionNum').textContent = v;
}
updateVersion();
