// 图片轮播功能
class ImageCarousel {
    constructor() {
        this.slides = document.querySelectorAll('.carousel-slide');
        this.thumbnails = document.querySelectorAll('.thumbnail');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.querySelector('.prev-btn');
        this.nextBtn = document.querySelector('.next-btn');
        this.currentIndex = 0;
        this.autoPlayInterval = null;
        this.autoPlayDelay = 5000; // 5秒自动播放
        
        this.init();
    }
    
    init() {
        // 检查是否有图片
        if (this.slides.length === 0) {
            // 没有图片，禁用控制按钮
            this.prevBtn.style.display = 'none';
            this.nextBtn.style.display = 'none';
            return;
        }
        
        // 绑定事件
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // 缩略图点击事件
        this.thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const index = parseInt(thumb.dataset.index);
                this.goToSlide(index);
            });
        });
        
        // 指示器点击事件
        this.indicators.forEach(indicator => {
            indicator.addEventListener('click', () => {
                const index = parseInt(indicator.dataset.index);
                this.goToSlide(index);
            });
        });
        
        // 开始自动播放
        this.startAutoPlay();
        
        // 鼠标悬停时暂停自动播放
        const carousel = document.querySelector('.main-carousel');
        carousel.addEventListener('mouseenter', () => this.stopAutoPlay());
        carousel.addEventListener('mouseleave', () => this.startAutoPlay());
    }
    
    goToSlide(index) {
        // 更新当前索引
        this.currentIndex = index;
        
        // 更新轮播图
        this.slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === index);
        });
        
        // 更新缩略图
        this.thumbnails.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
        
        // 更新指示器
        this.indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === index);
        });
    }
    
    nextSlide() {
        const nextIndex = (this.currentIndex + 1) % this.slides.length;
        this.goToSlide(nextIndex);
    }
    
    prevSlide() {
        const prevIndex = (this.currentIndex - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prevIndex);
    }
    
    startAutoPlay() {
        this.stopAutoPlay();
        this.autoPlayInterval = setInterval(() => this.nextSlide(), this.autoPlayDelay);
    }
    
    stopAutoPlay() {
        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }
}

// 视频播放功能
class VideoPlayer {
    constructor() {
        this.videoItems = document.querySelectorAll('.video-item');
        this.videoModal = document.getElementById('videoModal');
        this.closeModalBtn = document.querySelector('.close-modal');
        this.videoFrame = document.getElementById('videoFrame');
        
        // 视频数据（初始为空）
        this.videos = [];
        
        this.init();
    }
    
    init() {
        // 绑定视频点击事件
        this.videoItems.forEach((item, index) => {
            item.addEventListener('click', () => this.playVideo(index));
        });
        
        // 关闭模态框
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        
        // 点击模态框背景关闭
        this.videoModal.addEventListener('click', (e) => {
            if (e.target === this.videoModal) {
                this.closeModal();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.videoModal.classList.contains('active')) {
                this.closeModal();
            }
        });
    }
    
    playVideo(index) {
        // 检查是否有视频
        if (this.videos.length === 0 || !this.videos[index]) {
            alert('请先上传视频文件');
            return;
        }
        
        const video = this.videos[index];
        // 这里需要根据实际视频文件处理播放
        // 暂时显示提示
        alert(`播放视频: ${video.title}\n\n注意：实际视频播放功能需要后端支持处理视频文件上传和转码。`);
        
        // 如果是YouTube视频ID
        if (video.id) {
            const videoUrl = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;
            this.videoFrame.src = videoUrl;
            this.videoModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    closeModal() {
        this.videoModal.classList.remove('active');
        this.videoFrame.src = '';
        document.body.style.overflow = 'auto';
    }
}

// 图片上传和管理功能
class ImageManager {
    constructor() {
        this.imageInput = document.getElementById('imageInput');
        this.videoInput = document.getElementById('videoInput');
        this.imageList = document.getElementById('imageList');
        this.imageUploadBox = document.getElementById('imageUploadBox');
        this.videoUploadBox = document.getElementById('videoUploadBox');
        this.imageModal = document.getElementById('imageModal');
        this.closeImageModal = document.querySelector('.close-image-modal');
        this.modalImage = document.getElementById('modalImage');
        
        // 存储上传的图片和视频
        this.uploadedImages = [];
        this.uploadedVideos = [];
        
        this.init();
    }
    
    init() {
        // 绑定上传事件
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        this.videoInput.addEventListener('change', (e) => this.handleVideoUpload(e));
        
        // 拖放上传
        this.setupDragAndDrop(this.imageUploadBox, this.imageInput, 'image');
        this.setupDragAndDrop(this.videoUploadBox, this.videoInput, 'video');
        
        // 图片预览模态框
        this.closeImageModal.addEventListener('click', () => this.closeImagePreview());
        this.imageModal.addEventListener('click', (e) => {
            if (e.target === this.imageModal) {
                this.closeImagePreview();
            }
        });
        
        // ESC键关闭图片预览
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.imageModal.classList.contains('active')) {
                this.closeImagePreview();
            }
        });
        
        // 初始化示例图片
        this.initSampleImages();
    }
    
    setupDragAndDrop(uploadBox, fileInput, type) {
        uploadBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '#4361ee';
            uploadBox.style.background = 'rgba(67, 97, 238, 0.1)';
        });
        
        uploadBox.addEventListener('dragleave', () => {
            uploadBox.style.borderColor = '';
            uploadBox.style.background = '';
        });
        
        uploadBox.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadBox.style.borderColor = '';
            uploadBox.style.background = '';
            
            const files = e.dataTransfer.files;
            if (type === 'image') {
                this.handleImageFiles(files);
            } else {
                this.handleVideoFiles(files);
            }
        });
    }
    
    handleImageUpload(event) {
        const files = event.target.files;
        this.handleImageFiles(files);
    }
    
    handleVideoUpload(event) {
        const files = event.target.files;
        this.handleVideoFiles(files);
    }
    
    handleImageFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                alert('请选择图片文件！');
                continue;
            }
            
            this.addImageToList(file);
        }
        
        // 重置文件输入
        this.imageInput.value = '';
    }
    
    handleVideoFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('video/')) {
                alert('请选择视频文件！');
                continue;
            }
            
            this.addVideoToList(file);
        }
        
        // 重置文件输入
        this.videoInput.value = '';
    }
    
    addImageToList(file) {
        // 显示上传中状态
        this.showUploadProgress(file.name, file.size, 'image');
        
        // 每个文件创建新的 FileReader
        const reader = new FileReader();
        const self = this;
        
        reader.onload = function(e) {
            const imageData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                time: new Date().toLocaleString(),
                dataUrl: e.target.result
            };
            
            self.uploadedImages.push(imageData);
            self.renderImageList();
            
            // 移除进度显示
            self.hideUploadProgress(file.name);
            
            // 显示成功消息
            self.showUploadSuccess(file.name);
        };
        
        reader.onerror = function() {
            self.hideUploadProgress(file.name);
            self.showUploadError(file.name);
        };
        
        reader.onloadstart = function() {
            self.updateUploadProgress(file.name, 10);
        };
        
        // 使用闭包避免问题
        reader.readAsDataURL(file);
    }
    
    addVideoToList(file) {
        // 显示上传中状态
        this.showUploadProgress(file.name, file.size, 'video');
        
        // 每个文件创建新的 FileReader
        const reader = new FileReader();
        const self = this;
        
        reader.onload = function(e) {
            const videoData = {
                id: Date.now() + Math.random(),
                name: file.name,
                size: file.size,
                time: new Date().toLocaleString(),
                dataUrl: e.target.result,
                type: 'local'
            };
            
            self.uploadedVideos.push(videoData);
            self.renderVideoList();
            
            // 移除进度显示
            self.hideUploadProgress(file.name);
            
            // 显示成功消息
            self.showUploadSuccess(file.name);
        };
        
        reader.onerror = function() {
            self.hideUploadProgress(file.name);
            self.showUploadError(file.name);
        };
        
        reader.onloadstart = function() {
            self.updateUploadProgress(file.name, 10);
        };
        
        reader.readAsDataURL(file);
    }
    
    showUploadProgress(fileName, fileSize, type) {
        // 创建进度显示元素
        const progressId = 'upload-progress-' + Date.now();
        const progressHTML = `
            <div class="upload-progress-container" id="${progressId}">
                <div class="upload-progress-info">
                    <i class="fas fa-spinner fa-spin"></i>
                    <span class="upload-file-name">${fileName}</span>
                    <span class="upload-file-size">${this.formatFileSize(fileSize)}</span>
                </div>
                <div class="upload-progress-bar">
                    <div class="upload-progress-fill" style="width: 0%"></div>
                </div>
                <div class="upload-progress-text">0%</div>
            </div>
        `;
        
        // 添加到进度容器
        const container = document.getElementById('uploadProgressContainer') || this.createProgressContainer();
        container.insertAdjacentHTML('beforeend', progressHTML);
        container.style.display = 'block';
    }
    
    updateUploadProgress(fileName, progress) {
        const containers = document.querySelectorAll('.upload-progress-container');
        containers.forEach(container => {
            const nameSpan = container.querySelector('.upload-file-name');
            if (nameSpan && nameSpan.textContent === fileName) {
                const fill = container.querySelector('.upload-progress-fill');
                const text = container.querySelector('.upload-progress-text');
                if (fill) fill.style.width = progress + '%';
                if (text) text.textContent = progress + '%';
            }
        });
    }
    
    hideUploadProgress(fileName) {
        const containers = document.querySelectorAll('.upload-progress-container');
        containers.forEach(container => {
            const nameSpan = container.querySelector('.upload-file-name');
            if (nameSpan && nameSpan.textContent === fileName) {
                container.remove();
            }
        });
        
        // 如果没有进度了，隐藏容器
        const container = document.getElementById('uploadProgressContainer');
        if (container && container.querySelectorAll('.upload-progress-container').length === 0) {
            container.style.display = 'none';
        }
    }
    
    showUploadError(fileName) {
        const containers = document.querySelectorAll('.upload-progress-container');
        containers.forEach(container => {
            const nameSpan = container.querySelector('.upload-file-name');
            if (nameSpan && nameSpan.textContent === fileName) {
                container.querySelector('.upload-progress-info').innerHTML = 
                    `<i class="fas fa-times-circle" style="color:#f72585"></i>
                     <span class="upload-file-name" style="color:#f72585">${fileName} - 上传失败</span>`;
                container.querySelector('.upload-progress-bar').style.display = 'none';
                container.querySelector('.upload-progress-text').remove();
            }
        });
    }
    
    createProgressContainer() {
        const container = document.createElement('div');
        container.id = 'uploadProgressContainer';
        container.className = 'upload-progress-global';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 320px;
            max-height: 300px;
            overflow-y: auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            padding: 15px;
            z-index: 10000;
            display: none;
        `;
        document.body.appendChild(container);
        return container;
    }
    
    renderImageList() {
        this.imageList.innerHTML = '';
        
        this.uploadedImages.forEach((image, index) => {
            const item = document.createElement('div');
            item.className = 'image-item';
            item.innerHTML = `
                <div class="image-thumbnail">
                    <img src="${image.dataUrl}" alt="${image.name}">
                </div>
                <div class="image-name">${image.name}</div>
                <div class="image-size">${this.formatFileSize(image.size)}</div>
                <div class="image-time">${image.time}</div>
                <div class="image-actions">
                    <button class="action-btn view-btn" data-index="${index}">
                        <i class="fas fa-eye"></i> 查看
                    </button>
                    <button class="action-btn move-btn" data-index="${index}">
                        <i class="fas fa-arrows-alt"></i> 移动
                    </button>
                    <button class="action-btn delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i> 删除
                    </button>
                </div>
            `;
            
            this.imageList.appendChild(item);
        });
        
        // 绑定操作按钮事件
        this.bindImageActions();
    }
    
    renderVideoList() {
        // 更新视频网格显示已上传的视频
        const videoItems = document.querySelectorAll('.video-item');
        
        this.uploadedVideos.forEach((video, index) => {
            if (index < videoItems.length) {
                const item = videoItems[index];
                item.classList.remove('empty-video');
                item.innerHTML = `
                    <div class="video-thumbnail" style="background: #000;">
                        <video src="${video.dataUrl}" style="width:100%;height:100%;object-fit:cover;"></video>
                        <div class="play-overlay"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="video-info">
                        <h4>${video.name}</h4>
                        <p>${this.formatFileSize(video.size)}</p>
                    </div>
                    <button class="action-btn delete-btn" data-index="${index}" style="position:absolute;top:5px;right:5px;">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                item.style.position = 'relative';
                
                // 绑定点击播放事件
                item.querySelector('.video-thumbnail').addEventListener('click', () => {
                    this.playLocalVideo(index);
                });
                
                // 绑定删除事件
                item.querySelector('.delete-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteVideo(index);
                });
            }
        });
    }
    
    playLocalVideo(index) {
        const video = this.uploadedVideos[index];
        const modal = document.getElementById('videoModal');
        const iframe = document.getElementById('videoFrame');
        
        iframe.src = '';
        iframe.src = video.dataUrl;
        modal.classList.add('active');
    }
    
    deleteVideo(index) {
        const video = this.uploadedVideos[index];
        if (confirm(`确定要删除视频 "${video.name}" 吗？`)) {
            this.uploadedVideos.splice(index, 1);
            this.renderVideoList();
            alert('视频已删除');
        }
    }
    
    bindImageActions() {
        // 查看按钮
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.viewImage(index);
            });
        });
        
        // 移动按钮
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.moveImage(index);
            });
        });
        
        // 删除按钮
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.currentTarget.dataset.index);
                this.deleteImage(index);
            });
        });
    }
    
    viewImage(index) {
        const image = this.uploadedImages[index];
        this.modalImage.src = image.dataUrl;
        this.imageModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    moveImage(index) {
        const image = this.uploadedImages[index];
        const newIndex = prompt(`将图片 "${image.name}" 移动到哪个位置？(1-${this.uploadedImages.length})`, index + 1);
        
        if (newIndex && newIndex >= 1 && newIndex <= this.uploadedImages.length) {
            const targetIndex = parseInt(newIndex) - 1;
            if (targetIndex !== index) {
                // 移动图片
                const [movedImage] = this.uploadedImages.splice(index, 1);
                this.uploadedImages.splice(targetIndex, 0, movedImage);
                this.renderImageList();
                
                alert(`图片已移动到位置 ${newIndex}`);
            }
        }
    }
    
    deleteImage(index) {
        const image = this.uploadedImages[index];
        if (confirm(`确定要删除图片 "${image.name}" 吗？`)) {
            this.uploadedImages.splice(index, 1);
            this.renderImageList();
            alert('图片已删除');
        }
    }
    
    closeImagePreview() {
        this.imageModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
    
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    showUploadSuccess(filename) {
        // 创建临时提示
        const successMsg = document.createElement('div');
        successMsg.className = 'upload-success';
        successMsg.innerHTML = `
            <i class="fas fa-check-circle"></i> 
            ${filename} 上传成功！
        `;
        successMsg.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(successMsg);
        
        // 3秒后移除
        setTimeout(() => {
            successMsg.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => successMsg.remove(), 300);
        }, 3000);
    }
    
    initSampleImages() {
        // 清空图片列表，等待用户上传
        this.uploadedImages = [];
        this.renderImageList();
    }
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化轮播图
    const carousel = new ImageCarousel();
    
    // 初始化视频播放器
    const videoPlayer = new VideoPlayer();
    
    // 初始化图片管理器
    const imageManager = new ImageManager();
    
    console.log('多媒体展示画廊已初始化！');
    
    // 添加一些交互效果
    document.querySelectorAll('.section h2').forEach(header => {
        header.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });
});