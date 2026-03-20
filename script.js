class FileManager {
    constructor() {
        this.files = [];
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileList = document.getElementById('fileList');
        this.previewModal = document.getElementById('previewModal');
        this.previewImg = document.getElementById('previewImage');
        this.storageFill = document.getElementById('storageFill');
        this.storageText = document.getElementById('storageText');
        this.db = null;
        
        this.init();
    }
    
    async init() {
        await this.openDB();
        
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
        
        await this.loadFiles();
        
        // 显示版本号
        const ver = document.getElementById('versionNum');
        if (ver) ver.textContent = ver.getAttribute('data-version') || '';
        
        // 显示存储空间
        this.updateStorageBar();
    }
    
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('SkyGalleryDB', 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('files')) {
                    db.createObjectStore('files', { keyPath: 'id' });
                }
            };
        });
    }
    
    handleFiles(fileList) {
        for (let i = 0; i < fileList.length; i++) {
            this.addFile(fileList[i]);
        }
        this.fileInput.value = '';
    }
    
    async addFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                const fileData = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    size: file.size,
                    type: file.type.split('/')[0],
                    mimeType: file.type,
                    date: new Date().toLocaleString('zh-CN'),
                    dataUrl: e.target.result
                };
                
                this.files.push(fileData);
                await this.saveFile(fileData);
                this.renderFileList();
                this.updateStorageBar();
                resolve();
            };
            
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
    
    async saveFile(fileData) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const request = store.put(fileData);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async loadFiles() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.files = request.result || [];
                this.files.sort((a, b) => {
                    const dateA = new Date(a.date);
                    const dateB = new Date(b.date);
                    return dateA - dateB;
                });
                this.renderFileList();
                this.updateStorageBar();
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteFile(index) {
        if (!confirm('确定删除 "' + this.files[index].name + '" 吗？')) return;
        
        const fileId = this.files[index].id;
        this.files.splice(index, 1);
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('files', 'readwrite');
            const store = tx.objectStore('files');
            const request = store.delete(fileId);
            request.onsuccess = () => {
                this.renderFileList();
                this.updateStorageBar();
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    updateStorageBar() {
        const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
        const maxSize = 500 * 1024 * 1024; // 500MB
        const percent = Math.min((totalSize / maxSize) * 100, 100);
        
        this.storageFill.style.width = percent + '%';
        
        const used = this.formatSize(totalSize);
        const total = this.formatSize(maxSize);
        this.storageText.textContent = used + ' / ' + total;
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
                    <div class="file-order">${i + 1}</div>
                    <img class="file-thumb" src="${file.dataUrl}" alt="${file.name}" data-index="${i}">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${this.formatSize(file.size)}</div>
                    <div class="file-date">${file.date}</div>
                    <div class="file-actions">
                        <button class="btn-move" data-index="${i}">排序</button>
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
        
        this.fileList.querySelectorAll('.btn-move').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.moveToPosition(idx);
            });
        });
        
        this.fileList.querySelectorAll('.btn-delete').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.deleteFile(idx);
            });
        });
    }
    
    async moveToPosition(fromIndex) {
        const total = this.files.length;
        const currentPos = fromIndex + 1;
        
        const newPosStr = prompt('当前排在第 ' + currentPos + ' 位，请输入新的排序位置（1-' + total + '）：', currentPos);
        
        if (newPosStr === null) return;
        
        const newPos = parseInt(newPosStr);
        
        if (isNaN(newPos) || newPos < 1 || newPos > total) {
            alert('请输入有效的序号（1-' + total + '）');
            return;
        }
        
        if (newPos === currentPos) return;
        
        const newIndex = newPos - 1;
        const movedFile = this.files.splice(fromIndex, 1)[0];
        this.files.splice(newIndex, 0, movedFile);
        
        for (let i = 0; i < this.files.length; i++) {
            await this.saveFile(this.files[i]);
        }
        
        this.renderFileList();
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
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) {
            const kb = bytes / 1024;
            return kb >= 1 ? kb.toFixed(1) + ' KB' : bytes + ' B';
        }
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }
}

const fileManager = new FileManager();
