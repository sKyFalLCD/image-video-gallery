class FileManager {
    constructor() {
        this.files = [];
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileList = document.getElementById('fileList');
        this.previewModal = document.getElementById('previewModal');
        this.previewImage = document.getElementById('previewImage');
        
        this.init();
    }
    
    init() {
        // 文件选择
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // 拖拽上传
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
        
        // 预览关闭
        this.previewModal.addEventListener('click', (e) => {
            if (e.target === this.previewModal || e.target.classList.contains('close-preview')) {
                this.closePreview();
            }
        });
        
        // ESC键关闭预览
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.previewModal.classList.contains('active')) {
                this.closePreview();
            }
        });
        
        // 加载已保存的文件
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
        
        this.fileList.innerHTML = this.files.map((file, index) => `
            <div class="file-item" data-id="${file.id}">
                <img class="file-thumb" src="${file.dataUrl}" alt="${file.name}" data-url="${file.dataUrl}">
                <div class="file-name" title="${file.name}">${file.name}</div>
                <div class="file-size">${this.formatSize(file.size)}</div>
                <div class="file-date">${file.date}</div>
                <div class="file-actions">
                    <button class="btn-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn-down" data-index="${index}" ${index === this.files.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn-delete" data-index="${index}">删除</button>
                </div>
            </div>
        `).join('');
        
        // 绑定缩略图点击事件
        this.fileList.querySelectorAll('.file-thumb').forEach(img => {
            img.addEventListener('click', () => this.previewImage(img.dataset.url));
        });
        
        // 绑定按钮事件
        this.fileList.querySelectorAll('.btn-up').forEach(btn => {
            btn.addEventListener('click', () => this.moveUp(parseInt(btn.dataset.index)));
        });
        this.fileList.querySelectorAll('.btn-down').forEach(btn => {
            btn.addEventListener('click', () => this.moveDown(parseInt(btn.dataset.index)));
        });
        this.fileList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => this.deleteFile(parseInt(btn.dataset.index)));
        });
    }
    
    previewImage(dataUrl) {
        this.previewImage.src = dataUrl;
        this.previewModal.classList.add('active');
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
