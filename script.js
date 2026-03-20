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
            
            // 新文件默认排在最后
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
    
    moveToPosition(fromIndex) {
        const total = this.files.length;
        const currentPos = fromIndex + 1;
        
        const newPosStr = prompt(`当前排在第 ${currentPos} 位，请输入新的排序位置（1-${total}）：`, currentPos);
        
        if (newPosStr === null) return; // 用户取消
        
        const newPos = parseInt(newPosStr);
        
        if (isNaN(newPos) || newPos < 1 || newPos > total) {
            alert('请输入有效的序号（1-' + total + '）');
            return;
        }
        
        if (newPos === currentPos) return; // 位置没变
        
        const newIndex = newPos - 1;
        
        // 移动文件
        const movedFile = this.files.splice(fromIndex, 1)[0];
        
        if (newPos > fromIndex) {
            // 向后移动：插入到目标位置（因为已经删除了原位置的元素，所以要-1）
            this.files.splice(newIndex, 0, movedFile);
        } else {
            // 向前移动：直接插入到目标位置
            this.files.splice(newIndex, 0, movedFile);
        }
        
        this.renderFileList();
        this.saveFiles();
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
    
    deleteFile(index) {
        if (confirm(`确定删除 "${this.files[index].name}" 吗？`)) {
            this.files.splice(index, 1);
            this.renderFileList();
            this.saveFiles();
        }
    }
    
    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) {
            const kb = bytes / 1024;
            return kb >= 1 ? kb.toFixed(1) + ' KB' : bytes + ' B';
        }
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
document.getElementById('versionNum').textContent = 'v1.0.202603201556';
