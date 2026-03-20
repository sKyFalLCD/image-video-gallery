class FileManager {
    constructor() {
        this.files = [];
        this.selectedFiles = new Set();
        this.pageSize = 5;
        this.filterType = 'all'; // all, image, video
        this.sortField = 'order'; // order, date, size
        this.sortOrder = 'asc'; // asc, desc
        this.currentPage = 1;
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
        try {
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
            
            // 事件委托
            // 统一的事件处理
            this.fileList.addEventListener('click', (e) => {
                const target = e.target;
                
                // 全选
                if (target.id === 'selectAll' || target.closest('#selectAllFooter')) {
                    this.toggleSelectAll();
                    return;
                }
                
                // 单选
                if (target.type === 'checkbox' && target.dataset.fileId) {
                    this.toggleSelect(target.dataset.fileId);
                    return;
                }
                
                // 排序按钮
                if (target.closest('.btn-move')) {
                    const idx = parseInt(target.closest('.btn-move').dataset.index);
                    this.moveToPosition(idx);
                    return;
                }
                
                // 删除按钮
                if (target.closest('.btn-delete')) {
                    const idx = parseInt(target.closest('.btn-delete').dataset.index);
                    this.deleteFile(idx);
                    return;
                }
                
                // 下载按钮
                if (target.closest('.btn-download')) {
                    const idx = parseInt(target.closest('.btn-download').dataset.index);
                    this.downloadFile(idx);
                    return;
                }
                
                // 缩略图点击
                if (target.classList.contains('file-thumb') || target.closest('.file-thumb')) {
                    const el = target.classList.contains('file-thumb') ? target : target.closest('.file-thumb');
                    const idx = parseInt(el.dataset.index);
                    this.showPreview(idx);
                    return;
                }
                
                // 上一页下一页
                if (target.closest('.btn-page-nav')) {
                    const page = parseInt(target.closest('.btn-page-nav').dataset.page);
                    if (!isNaN(page)) this.goToPage(page);
                    return;
                }
            });
            
            this.fileList.addEventListener('change', (e) => {
                if (e.target.id === 'pageSizeInput') {
                    this.changePageSize();
                    return;
                }
                if (e.target.id === 'pageInput') {
                    const page = parseInt(e.target.value);
                    if (!isNaN(page)) this.goToPage(page);
                    e.target.value = '';
                    return;
                }
            });
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closePreview();
            });
            
            await this.loadFiles();
            
            // Sort buttons in header (document-level for delegation)
            document.addEventListener('click', (e) => {
                if (e.target.closest('.sort-btn')) {
                    const btn = e.target.closest('.sort-btn');
                    this.toggleSort(btn.dataset.sort);
                }
                if (e.target.closest('.btn-batch-download')) {
                    this.batchDownload();
                }
            });
            
            
            // Filter dropdown
            const filterSelect = document.getElementById('filterSelect');
            if (filterSelect) {
                filterSelect.addEventListener('change', (e) => {
                    this.setFilter(e.target.value);
                });
            }
            
            // Sort buttons - use document delegation
            document.addEventListener('click', (e) => {
                if (e.target.closest('.sort-btn')) {
                    const btn = e.target.closest('.sort-btn');
                    this.toggleSort(btn.dataset.sort);
                }
            });
            
            const ver = document.getElementById('versionNum');
            if (ver) ver.textContent = ver.getAttribute('data-version') || '';
            
            this.updateStorageBar();
        } catch (err) {
            console.error('Init error:', err);
            alert('页面加载出错，请刷新重试');
        }
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
    
    addFile(file) {
        const fileName = file.name;
        const fileSize = file.size;
        const fileType = file.type.split('/')[0];
        
        // 显示上传进度
        this.showUploadProgress(fileName, fileSize, fileType);
        
        // 使用 XMLHttpRequest 获取进度
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                const fileData = {
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    originalName: file.name,
                    size: file.size,
                    type: file.type.split('/')[0],
                    mimeType: file.type,
                    date: new Date().toLocaleString('zh-CN'),
                    dataUrl: e.target.result
                };
                
                try {
                    await this.saveFile(fileData);
                    this.files.push(fileData);
                    this.renderFileList();
                    this.updateStorageBar();
                    this.hideUploadProgress(fileName);
                    resolve();
                } catch (err) {
                    this.showUploadError(fileName, '存储失败');
                    reject(err);
                }
            };
            
            reader.onerror = () => {
                this.showUploadError(fileName, '读取文件失败');
                reject(reader.error);
            };
            
            reader.onabort = () => {
                this.showUploadError(fileName, '上传已取消');
                reject(new Error('aborted'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    showUploadProgress(fileName, fileSize, fileType) {
        let container = document.getElementById('uploadProgressContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'uploadProgressContainer';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 320px;
                max-height: 300px;
                overflow-y: auto;
                background: #16213e;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                padding: 15px;
                z-index: 10000;
            `;
            document.body.appendChild(container);
        }
        
        const progressId = 'upload-' + Date.now();
        const progressHTML = `
            <div class="upload-progress-item" id="${progressId}" data-name="${fileName}">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <i class="fas fa-spinner fa-spin" style="color:#667eea;"></i>
                    <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${fileName}</span>
                    <span style="color:#a0a0a0;font-size:0.85rem;">${this.formatSize(fileSize)}</span>
                </div>
                <div style="height:6px;background:#0f3460;border-radius:3px;overflow:hidden;">
                    <div class="upload-progress-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#667eea,#764ba2);transition:width 0.2s;"></div>
                </div>
                <div class="upload-status" style="font-size:0.8rem;color:#a0a0a0;margin-top:4px;">等待中...</div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', progressHTML);
        container.style.display = 'block';
        
        // 模拟进度（因为FileReader不提供真实进度）
        this.simulateProgress(progressId);
    }
    
    simulateProgress(progressId) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            const item = document.getElementById(progressId);
            if (!item) {
                clearInterval(interval);
                return;
            }
            
            const bar = item.querySelector('.upload-progress-bar');
            const status = item.querySelector('.upload-status');
            
            if (bar) bar.style.width = progress + '%';
            if (status) status.textContent = '上传中 ' + Math.round(progress) + '%';
            
            if (progress >= 90) {
                clearInterval(interval);
            }
        }, 200);
        
        // 存储interval ID以便清除
        const item = document.getElementById(progressId);
        if (item) item.dataset.intervalId = interval;
    }
    
    hideUploadProgress(fileName) {
        const container = document.getElementById('uploadProgressContainer');
        if (!container) return;
        
        const items = container.querySelectorAll('.upload-progress-item');
        items.forEach(item => {
            if (item.dataset.name === fileName) {
                const intervalId = item.dataset.intervalId;
                if (intervalId) clearInterval(parseInt(intervalId));
                
                const status = item.querySelector('.upload-status');
                const bar = item.querySelector('.upload-progress-bar');
                const icon = item.querySelector('i');
                
                if (status) status.textContent = '上传成功';
                if (bar) bar.style.width = '100%';
                if (icon) {
                    icon.className = 'fas fa-check-circle';
                    icon.style.color = '#4ade80';
                }
                
                // 2秒后移除
                setTimeout(() => {
                    item.remove();
                    if (container.children.length === 0) {
                        container.style.display = 'none';
                    }
                }, 2000);
            }
        });
    }
    
    showUploadError(fileName, message) {
        const container = document.getElementById('uploadProgressContainer');
        if (!container) return;
        
        const items = container.querySelectorAll('.upload-progress-item');
        items.forEach(item => {
            if (item.dataset.name === fileName) {
                const intervalId = item.dataset.intervalId;
                if (intervalId) clearInterval(parseInt(intervalId));
                
                const status = item.querySelector('.upload-status');
                const icon = item.querySelector('i');
                
                if (status) status.textContent = '失败: ' + message;
                if (icon) {
                    icon.className = 'fas fa-times-circle';
                    icon.style.color = '#ef4444';
                }
                
                // 5秒后移除
                setTimeout(() => {
                    item.remove();
                    if (container.children.length === 0) {
                        container.style.display = 'none';
                    }
                }, 5000);
            }
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
                
                this.currentPage = 1;
                this.selectedFiles.clear();
                this.renderFileList();
                this.updateStorageBar();
                resolve();
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteFile(index) {
        if (!confirm('确定删除 "' + this.files[index].originalName + '" 吗？')) return;
        
        const fileId = this.files[index].id;
        this.files.splice(index, 1);
        this.selectedFiles.delete(String(fileId));
        
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
                store.delete(Number(fileId));
                tx.oncomplete = resolve;
                tx.onerror = reject;
            });
        }
        
        this.files = this.files.filter(f => !this.selectedFiles.has(String(f.id)));
        this.selectedFiles.clear();
        this.renderFileList();
        this.updateStorageBar();
    }
    
    toggleSelectAll() {
        const checkbox = document.getElementById('selectAll');
        if (checkbox && checkbox.checked) {
            this.getCurrentPageFiles().forEach(f => this.selectedFiles.add(String(f.id)));
        } else {
            this.getCurrentPageFiles().forEach(f => this.selectedFiles.delete(String(f.id)));
        }
        this.renderFileList();
    }
    
    toggleSelect(fileId) {
        fileId = String(fileId);
        if (this.selectedFiles.has(fileId)) {
            this.selectedFiles.delete(fileId);
        } else {
            this.selectedFiles.add(fileId);
        }
        this.renderFileList();
    }
    
    getCurrentPageFiles() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.files.slice(start, end);
    }
    
    getTotalPages() {
        return Math.ceil(this.files.length / this.pageSize) || 1;
    }
    
    goToPage(page) {
        const totalPages = this.getTotalPages();
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        this.selectedFiles.clear();
        this.renderFileList();
    }
    
    changePageSize() {
        const input = document.getElementById('pageSizeInput');
        if (!input) return;
        let size = parseInt(input.value);
        if (isNaN(size) || size < 1) size = 5;
        if (size > 10) size = 10;
        this.pageSize = size;
        this.currentPage = 1;
        this.selectedFiles.clear();
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
        
        const countEl = document.getElementById('fileCount');
        if (countEl) {
            countEl.textContent = '共 ' + this.files.length + ' 个文件';
        }
    }
    
    renderFileList() {
        // Filter files
        let displayFiles = this.files.filter(f => {
            if (this.filterType === 'all') return true;
            return f.type === this.filterType;
        });
        
        // Sort files
        displayFiles.sort((a, b) => {
            let valA, valB;
            if (this.sortField === 'size') {
                valA = a.size;
                valB = b.size;
            } else if (this.sortField === 'order') {
                valA = this.files.indexOf(a);
                valB = this.files.indexOf(b);
            } else {
                valA = new Date(a.date || 0);
                valB = new Date(b.date || 0);
            }
            if (this.sortOrder === 'asc') {
                return valA > valB ? 1 : -1;
            } else {
                return valA < valB ? 1 : -1;
            }
        });
        
        if (displayFiles.length === 0) { this.fileList.innerHTML = '<div class="empty-list">暂无文件，请上传</div>'; return; }
        
        const pageFiles = displayFiles.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);
        const totalPages = Math.ceil(displayFiles.length / this.pageSize) || 1;
        
        let html = '';
        
        for (let i = 0; i < pageFiles.length; i++) {
            const file = pageFiles[i];
            const realIndex = this.files.indexOf(file);
            const isSelected = this.selectedFiles.has(String(file.id));
            const typeText = file.type === 'video' ? '视频' : '图片';
            const typeClass = file.type === 'video' ? 'type-video' : 'type-image';
            let thumbHtml;
            if (file.type === 'image') {
                thumbHtml = '<img class="file-thumb" src="' + file.dataUrl + '" alt="' + file.name + '" data-index="' + realIndex + '">';
            } else {
                thumbHtml = '<div class="file-thumb video-thumb" data-index="' + realIndex + '"><video src="' + file.dataUrl + '"></video><div class="play-overlay"><i class="fas fa-play"></i></div></div>';
            }
            html += '<div class="file-item" data-id="' + file.id + '" data-index="' + realIndex + '">';
            html += '<div class="file-checkbox"><input type="checkbox" ' + (isSelected ? 'checked' : '') + ' data-file-id="' + file.id + '"></div>';
            html += '<div class="file-order">' + (this.files.indexOf(file) + 1) + '</div>';
            html += thumbHtml;
            html += '<div class="file-name" title="' + file.originalName + '">' + file.name + '</div>';
            html += '<div class="file-type ' + typeClass + '">' + typeText + '</div>';
            html += '<div class="file-size">' + this.formatSize(file.size) + '</div>';
            html += '<div class="file-date">' + file.date + '</div>';
            html += '<div class="file-action-btns">';
            html += '<button class="btn-icon btn-download" data-index="' + realIndex + '" title="下载"><i class="fas fa-download"></i></button>';
            html += '<button class="btn-icon btn-move" data-index="' + realIndex + '" title="排序"><i class="fas fa-sort"></i></button>';
            html += '<button class="btn-icon btn-delete" data-index="' + realIndex + '" title="删除"><i class="fas fa-trash-alt"></i></button>';
            html += '</div></div>';
        }
        
        html += '<div class="file-list-footer">';
        html += '<label class="select-all-label"><input type="checkbox" id="selectAllFooter">全选</label>';
        html += '<button class="btn-batch-download"><i class="fas fa-download"></i> 批量下载</button>';
        html += '<button class="btn-batch-delete"><i class="fas fa-trash-alt"></i> 批量删除</button>';
        html += '<div class="pagination">';
        html += '<span class="page-label">每页</span><input type="number" id="pageSizeInput" value="' + this.pageSize + '" min="1" max="10"><span class="page-label">个</span>';
        html += '<button class="btn-page btn-page-nav" data-page="' + (this.currentPage - 1) + '" ' + (this.currentPage === 1 ? 'disabled' : '') + '><i class="fas fa-chevron-left"></i></button>';
        html += '<span class="page-info">' + this.currentPage + ' / ' + totalPages + '</span>';
        html += '<button class="btn-page btn-page-nav" data-page="' + (this.currentPage + 1) + '" ' + (this.currentPage === totalPages ? 'disabled' : '') + '><i class="fas fa-chevron-right"></i></button>';
        html += '<input type="number" id="pageInput" placeholder="跳转" min="1"><button class="btn-page" id="jumpBtn">跳转</button>';
        html += '</div></div>';
        
        this.fileList.innerHTML = html;
        
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.checked = pageFiles.length > 0 && pageFiles.every(f => this.selectedFiles.has(String(f.id)));
        }
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
        } else if (file && file.type === 'video') {
            const modal = document.getElementById('previewModal');
            const img = document.getElementById('previewImage');
            img.style.display = 'none';
            const videoEl = document.createElement('video');
            videoEl.src = file.dataUrl;
            videoEl.controls = true; videoEl.autoplay = true;
            videoEl.style.cssText = 'max-width:70%;max-height:70%;border-radius:12px;';
            img.replaceWith(videoEl);
            modal.classList.add('active');
        }
    }
    
    closePreview() {
        this.previewModal.classList.remove('active');
        const videoEl = this.previewModal.querySelector('video');
        if (videoEl) {
            videoEl.pause(); videoEl.currentTime = 0;
            videoEl.remove();
        }
        const img = document.createElement('img');
        img.id = 'previewImage';
        img.className = 'preview-image';
        img.src = '';
        img.alt = '预览';
        this.previewModal.querySelector('.close-preview').after(img);
    }
    
    
    setFilter(type) {
        this.filterType = type;
        this.currentPage = 1;
        this.selectedFiles.clear();
        this.renderFileList();
        this.updateFilterUI();
    }
    
    toggleSort(field) {
        if (this.sortField === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortField = field;
            this.sortOrder = 'desc';
        }
        this.currentPage = 1;
        this.selectedFiles.clear();
        this.renderFileList();
        this.updateSortUI();
    }
    
    updateFilterUI() {
        var select = document.getElementById('filterSelect');
        if (select) select.value = this.filterType;
    }
    
    updateSortUI() {
        var self = this;
        document.querySelectorAll('.sort-btn').forEach(function(btn) {
            var isActive = btn.dataset.sort === self.sortField;
            btn.classList.toggle('active', isActive);
            var icon = btn.querySelector('i');
            if (icon) {
                if (isActive && self.sortOrder === 'asc') {
                    icon.className = 'fas fa-sort-up';
                } else if (isActive && self.sortOrder === 'desc') {
                    icon.className = 'fas fa-sort-down';
                } else {
                    icon.className = 'fas fa-sort';
                }
            }
        });
        // Update header selectAll state
        var selectAll = document.getElementById("selectAll");
        if (selectAll) {
            var pageFiles = this.getCurrentPageFiles();
            selectAll.checked = pageFiles.length > 0 && pageFiles.every(function(f) { return this.selectedFiles.has(String(f.id)); }, this);
        }
    }
    
    downloadFile(index) {
        const file = this.files[index];
        if (!file) return;
        const link = document.createElement('a');
        link.href = file.dataUrl;
        link.download = file.originalName || file.name;
        link.click();
    }
    
    batchDownload() {
        if (this.selectedFiles.size === 0) {
            alert('请先勾选要下载的文件');
            return;
        }
        const selectedFilesList = this.files.filter(f => this.selectedFiles.has(String(f.id)));
        if (selectedFilesList.length === 0) {
            alert('没有选中的文件');
            return;
        }
        // For multiple files, download each one
        selectedFilesList.forEach((file, i) => {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = file.dataUrl;
                link.download = file.originalName || file.name;
                link.click();
            }, i * 500); // Delay to avoid browser blocking
        });
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
