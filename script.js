class FileManager {
    constructor() {
        this.files = [];
        this.selectedFiles = new Set();
        this.pageSize = 10;
        this.currentPage = 1;
        this.fileInput = document.getElementById('fileInput');
        this.uploadZone = document.getElementById('uploadZone');
        this.fileList = document.getElementById('fileList');
        this.previewModal = document.getElementById('previewModal');
        this.previewImg = document.getElementById('previewImage');
        this.storageFill = document.getElementById('storageFill');
        this.storageText = document.getElementById('storageText');
        this.selectAllCheckbox = null;
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
        
        const ver = document.getElementById('versionNum');
        if (ver) ver.textContent = ver.getAttribute('data-version') || '';
        
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
                this.currentPage = 1;
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
        this.selectedFiles.delete(fileId);
        
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
    
    async deleteSelected() {
        if (this.selectedFiles.size === 0) {
            alert('请先勾选要删除的文件');
            return;
        }
        
        const count = this.selectedFiles.size;
        if (!confirm('确定删除选中的 ' + count + ' 个文件吗？')) return;
        
        const toDelete = [...this.selectedFiles];
        
        for (const fileId of toDelete) {
            await new Promise((resolve, reject) => {
                const tx = this.db.transaction('files', 'readwrite');
                const store = tx.objectStore('files');
                store.delete(fileId);
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        }
        
        this.files = this.files.filter(f => !this.selectedFiles.has(f.id));
        this.selectedFiles.clear();
        this.renderFileList();
        this.updateStorageBar();
    }
    
    toggleSelectAll() {
        if (this.selectAllCheckbox && this.selectAllCheckbox.checked) {
            this.getCurrentPageFiles().forEach(f => this.selectedFiles.add(f.id));
        } else {
            this.getCurrentPageFiles().forEach(f => this.selectedFiles.delete(f.id));
        }
        this.renderFileList();
    }
    
    toggleSelect(fileId) {
        if (this.selectedFiles.has(fileId)) {
            this.selectedFiles.delete(fileId);
        } else {
            this.selectedFiles.add(fileId);
        }
        
        if (this.selectAllCheckbox) {
            const pageFiles = this.getCurrentPageFiles();
            this.selectAllCheckbox.checked = pageFiles.length > 0 && pageFiles.every(f => this.selectedFiles.has(f.id));
        }
    }
    
    getCurrentPageFiles() {
        const start = 0;
        const end = this.pageSize;
        return this.files.slice(start, end);
    }
    
    getTotalPages() {
        return Math.ceil(this.files.length / this.pageSize);
    }
    
    goToPage(page) {
        this.currentPage = Math.max(1, Math.min(page, this.getTotalPages()));
        this.renderFileList();
    }
    
    updateStorageBar() {
        const totalSize = this.files.reduce((sum, f) => sum + f.size, 0);
        const maxSize = 500 * 1024 * 1024;
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
        
        const start = 0;
        const end = this.pageSize;
        const pageFiles = this.files.slice(start, end);
        const totalPages = this.getTotalPages();
        
        let html = '';
        
        for (let i = 0; i < pageFiles.length; i++) {
            const file = pageFiles[i];
            const realIndex = this.files.indexOf(file);
            const isSelected = this.selectedFiles.has(file.id);
            html += `
                <div class="file-item" data-id="${file.id}" data-index="${realIndex}">
                    <div class="file-checkbox">
                        <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="fileManager.toggleSelect('${file.id}')">
                    </div>
                    <div class="file-order">${realIndex + 1}</div>
                    <img class="file-thumb" src="${file.dataUrl}" alt="${file.name}" data-index="${realIndex}">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-size">${this.formatSize(file.size)}</div>
                    <div class="file-date">${file.date}</div>
                    <div class="file-actions">
                        <button class="btn-icon" onclick="fileManager.moveToPosition(${realIndex})" title="排序">
                            <i class="fas fa-sort"></i>
                        </button>
                        <button class="btn-icon btn-icon-delete" onclick="fileManager.deleteFile(${realIndex})" title="删除">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="file-list-footer">
                <label class="select-all-label">
                    <input type="checkbox" id="selectAll" onchange="fileManager.toggleSelectAll()">
                    全选
                </label>
                <button class="btn-batch-delete" onclick="fileManager.deleteSelected()">
                    <i class="fas fa-trash-alt"></i> 批量删除
                </button>
                <div class="pagination">
                    <button class="btn-page" onclick="fileManager.goToPage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <span class="page-info">${this.currentPage} / ${totalPages}</span>
                    <button class="btn-page" onclick="fileManager.goToPage(${this.currentPage + 1})" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        this.fileList.innerHTML = html;
        this.selectAllCheckbox = document.getElementById('selectAll');
        
        const self = this;
        this.fileList.querySelectorAll('.file-thumb').forEach(function(img) {
            img.style.cursor = 'pointer';
            img.addEventListener('click', function() {
                const idx = parseInt(this.getAttribute('data-index'));
                self.showPreview(idx);
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
