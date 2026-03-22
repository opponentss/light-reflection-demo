// 全局变量
let canvas, ctx;
let canvasWidth, canvasHeight;
let centerX, centerY;
let incidentAngle = 45; // 入射角（度）
let n1 = 1.0; // 介质1折射率
let n2 = 1.33; // 介质2折射率
let isPlaying = false;
let animationId;
let particles = [];
let rayAnimationProgress = 0;
let rayAnimationSpeed = 0.01;
let incidentPoint = { x: 0, y: 0 };
let mediaBoundaryY;
let normalLineX;
let isDragging = false;
let isMobile = false;
let currentAngleLabels = {
    incident: '入射角 θᵢ = 45.0°',
    reflection: '反射角 θᵣ = 45.0°',
    refraction: '折射角 θₜ = 32.0°',
    hasRefraction: true
};

// 介质名称映射
const mediumNames = {
    1.0: "空气",
    1.33: "水",
    1.52: "玻璃",
    2.42: "钻石"
};

// 颜色配置
const colors = {
    incidentRay: '#60A5FA', // 入射光 - 蓝色
    reflectionRay: '#A78BFA', // 反射光 - 紫色
    refractionRay: '#34D399', // 折射光 - 绿色
    normalLine: 'rgba(255, 255, 255, 0.5)', // 法线 - 白色半透明
    mediaBoundary: 'rgba(255, 255, 255, 0.3)', // 介质边界 - 白色半透明
    angleArcIncident: '#60A5FA', // 入射角弧线 - 蓝色
    angleArcReflection: '#A78BFA', // 反射角弧线 - 紫色
    angleArcRefraction: '#34D399', // 折射角弧线 - 绿色
    particleIncident: '#60A5FA', // 入射光粒子 - 蓝色
    particleReflection: '#A78BFA', // 反射光粒子 - 紫色
    particleRefraction: '#34D399', // 折射光粒子 - 绿色
};

// 初始化函数
function init() {
    // 检查是否为移动设备
    isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // 获取Canvas元素
    canvas = document.getElementById('lightCanvas');
    ctx = canvas.getContext('2d');
    
    // 设置Canvas尺寸
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // 初始化UI事件
    initUIEvents();
    
    // 初始化介质边界和法线
    mediaBoundaryY = centerY;
    normalLineX = centerX;
    incidentPoint = { x: normalLineX, y: mediaBoundaryY };
    
    // 更新介质标签
    updateMediaLabels();
    
    // 延迟初始化粒子系统，等待页面元素完全渲染
    setTimeout(() => {
        initParticleSystem();
    }, 200);
    
    // 开始动画循环
    animate();
    
    // 重置模拟
    resetSimulation();
}

// 粒子系统类
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 150; // 增加粒子数量
        this.isRunning = false;
        this.mouseX = null;
        this.mouseY = null;
        this.mouseRadius = 150; // 鼠标影响半径
        
        // 设置Canvas尺寸
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // 添加鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        
        // 初始化粒子
        this.initParticles();
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    initParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    createParticle() {
        // 随机位置
        const x = Math.random() * this.canvas.width;
        const y = Math.random() * this.canvas.height;
        
        // 随机速度
        const speed = Math.random() * 0.8 + 0.2;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // 随机颜色 - 使用渐变色彩
        const colorType = Math.floor(Math.random() * 3);
        let color;
        switch(colorType) {
            case 0: // 蓝色渐变
                color = `hsl(210, ${Math.random() * 30 + 70}%, ${Math.random() * 20 + 40}%)`;
                break;
            case 1: // 紫色渐变
                color = `hsl(270, ${Math.random() * 30 + 70}%, ${Math.random() * 20 + 40}%)`;
                break;
            case 2: // 青色渐变
                color = `hsl(180, ${Math.random() * 30 + 70}%, ${Math.random() * 20 + 40}%)`;
                break;
        }
        
        // 随机大小
        const size = Math.random() * 4 + 1;
        
        // 随机透明度
        const alpha = Math.random() * 0.7 + 0.3;
        
        // 随机脉冲速度
        const pulseSpeed = Math.random() * 0.02 + 0.01;
        
        // 随机轨迹长度
        const trailLength = Math.floor(Math.random() * 20 + 5);
        
        return {
            x,
            y,
            vx,
            vy,
            color,
            size,
            baseSize: size,
            alpha,
            life: Math.random() * 3000 + 2000, // 延长粒子生命周期
            bornTime: Date.now(),
            pulseSpeed,
            pulseDirection: 1,
            trail: [],
            trailLength
        };
    }
    
    update() {
        if (!this.isRunning) return;
        
        const currentTime = Date.now();
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 记录轨迹
            particle.trail.push({x: particle.x, y: particle.y});
            if (particle.trail.length > particle.trailLength) {
                particle.trail.shift();
            }
            
            // 粒子脉冲效果
            particle.size += particle.pulseSpeed * particle.pulseDirection;
            if (particle.size > particle.baseSize * 1.5) {
                particle.pulseDirection = -1;
            } else if (particle.size < particle.baseSize * 0.5) {
                particle.pulseDirection = 1;
            }
            
            // 鼠标交互 - 粒子被鼠标吸引
            if (this.mouseX !== null && this.mouseY !== null) {
                const dx = this.mouseX - particle.x;
                const dy = this.mouseY - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouseRadius) {
                    // 计算吸引力
                    const force = (this.mouseRadius - distance) / this.mouseRadius;
                    const angle = Math.atan2(dy, dx);
                    particle.vx += Math.cos(angle) * force * 0.05;
                    particle.vy += Math.sin(angle) * force * 0.05;
                    
                    // 限制速度
                    const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                    if (speed > 2) {
                        particle.vx = (particle.vx / speed) * 2;
                        particle.vy = (particle.vy / speed) * 2;
                    }
                }
            }
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // 边界反弹效果
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -0.8; // 反弹时损失一些能量
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -0.8; // 反弹时损失一些能量
            }
            
            // 保持粒子在画布内
            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            
            // 检查生命周期
            if (currentTime > particle.bornTime + particle.life) {
                this.particles[i] = this.createParticle();
            }
        }
    }
    
    draw() {
        if (!this.isRunning) return;
        
        // 创建渐变背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
        gradient.addColorStop(1, 'rgba(30, 41, 59, 0.8)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制粒子连线
        this.particles.forEach((particle, i) => {
            this.particles.slice(i + 1).forEach(otherParticle => {
                const dx = particle.x - otherParticle.x;
                const dy = particle.y - otherParticle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 120) {
                    // 连线颜色随距离变化
                    const opacity = 0.2 - distance / 1000;
                    const gradient = this.ctx.createLinearGradient(
                        particle.x, particle.y,
                        otherParticle.x, otherParticle.y
                    );
                    gradient.addColorStop(0, particle.color);
                    gradient.addColorStop(1, otherParticle.color);
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(otherParticle.x, otherParticle.y);
                    this.ctx.strokeStyle = `${particle.color.replace(')', `, ${opacity})`).replace('hsl', 'hsla')}`;
                    this.ctx.lineWidth = 0.8;
                    this.ctx.stroke();
                }
            });
        });
        
        // 绘制粒子轨迹
        this.particles.forEach(particle => {
            if (particle.trail.length < 2) return;
            
            this.ctx.beginPath();
            this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
            
            for (let i = 1; i < particle.trail.length; i++) {
                this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
            }
            
            // 轨迹颜色随时间变化
            const opacity = particle.alpha * 0.5;
            this.ctx.strokeStyle = `${particle.color.replace(')', `, ${opacity})`).replace('hsl', 'hsla')}`;
            this.ctx.lineWidth = particle.size * 0.5;
            this.ctx.lineCap = 'round';
            this.ctx.stroke();
        });
        
        // 绘制粒子
        this.particles.forEach(particle => {
            // 绘制发光效果
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            const glowGradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            glowGradient.addColorStop(0, `${particle.color.replace(')', `, ${particle.alpha * 0.5})`).replace('hsl', 'hsla')}`);
            glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fill();
            
            // 绘制粒子主体
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            
            // 创建渐变
            const particleGradient = this.ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size
            );
            particleGradient.addColorStop(0, particle.color);
            particleGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            this.ctx.fillStyle = particleGradient;
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        // 绘制鼠标影响区域（可选）
        if (this.mouseX !== null && this.mouseY !== null) {
            this.ctx.beginPath();
            this.ctx.arc(this.mouseX, this.mouseY, this.mouseRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.01)';
            this.ctx.fill();
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = Date.now();
        
        // 设置粒子出生时间
        this.particles.forEach(particle => {
            particle.bornTime = Date.now();
        });
        
        // 开始动画循环
        const animate = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - this.lastTime;
            
            if (deltaTime > 16) { // 限制帧率约为60fps
                this.update();
                this.draw();
                this.lastTime = currentTime;
            }
            
            if (this.isRunning) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    stop() {
        this.isRunning = false;
    }
}

// 初始化粒子系统
function initParticleSystem() {
    // 创建粒子系统
    const particleSystem = new ParticleSystem('particlesCanvas');
    particleSystem.start();
}

// 调整Canvas尺寸
function resizeCanvas() {
    const container = canvas.parentElement;
    canvasWidth = container.clientWidth;
    canvasHeight = container.clientHeight;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
    
    // 更新介质边界和法线位置
    if (mediaBoundaryY === undefined) {
        mediaBoundaryY = centerY;
    }
    if (normalLineX === undefined) {
        normalLineX = centerX;
    }
    
    // 更新DOM元素位置
    updateDOMElementPositions();
    
    // 重新绘制
    draw();
}

// 更新DOM元素位置
function updateDOMElementPositions() {
    const mediaBoundary = document.getElementById('mediaBoundary');
    const normalLine = document.getElementById('normalLine');
    const mediaBottomLabel = document.getElementById('mediaBottomLabel');
    
    if (mediaBoundary) {
        mediaBoundary.style.top = `${mediaBoundaryY}px`;
    }
    
    if (normalLine) {
        normalLine.style.left = `${normalLineX}px`;
        normalLine.style.top = `${mediaBoundaryY - 100}px`;
        normalLine.style.height = '200px';
    }
    
    // 更新介质2标签位置
    if (mediaBottomLabel) {
        mediaBottomLabel.style.left = '10px';
        mediaBottomLabel.style.top = `${mediaBoundaryY + 100}px`;
    }
}

// 初始化UI事件
function initUIEvents() {
    // 入射角滑块
    const incidentAngleSlider = document.getElementById('incidentAngle');
    const incidentAngleValue = document.getElementById('incidentAngleValue');
    
    incidentAngleSlider.addEventListener('input', (e) => {
        incidentAngle = parseInt(e.target.value);
        incidentAngleValue.textContent = `${incidentAngle}°`;
        updateSimulation();
    });
    
    // 介质1折射率滑块
    const n1Slider = document.getElementById('n1');
    const n1Value = document.getElementById('n1Value');
    
    n1Slider.addEventListener('input', (e) => {
        n1 = parseFloat(e.target.value);
        n1Value.textContent = n1.toFixed(2);
        updateMediaLabels();
        updateSimulation();
    });
    
    // 介质2折射率滑块
    const n2Slider = document.getElementById('n2');
    const n2Value = document.getElementById('n2Value');
    
    n2Slider.addEventListener('input', (e) => {
        n2 = parseFloat(e.target.value);
        n2Value.textContent = n2.toFixed(2);
        updateMediaLabels();
        updateSimulation();
    });
    
    // 动画速度滑块
    const animationSpeedSlider = document.getElementById('animationSpeed');
    const animationSpeedValue = document.getElementById('animationSpeedValue');
    
    animationSpeedSlider.addEventListener('input', (e) => {
        rayAnimationSpeed = parseFloat(e.target.value);
        animationSpeedValue.textContent = rayAnimationSpeed.toFixed(3);
        // 动画速度实时生效，无需更新模拟
    });
    
    // 预设介质按钮
    const presetButtons = document.querySelectorAll('.preset-btn');
    presetButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 移除所有按钮的active类
            presetButtons.forEach(btn => btn.classList.remove('active'));
            // 添加当前按钮的active类
            button.classList.add('active');
            
            // 获取预设值
            n1 = parseFloat(button.dataset.n1);
            n2 = parseFloat(button.dataset.n2);
            
            // 更新滑块和显示值
            n1Slider.value = n1;
            n1Value.textContent = n1.toFixed(2);
            n2Slider.value = n2;
            n2Value.textContent = n2.toFixed(2);
            
            // 更新介质标签
            updateMediaLabels();
            
            // 更新模拟
            updateSimulation();
        });
    });
    
    // 播放按钮
    const playButton = document.getElementById('playButton');
    playButton.addEventListener('click', togglePlay);
    
    // 重置按钮
    const resetButton = document.getElementById('resetButton');
    resetButton.addEventListener('click', resetSimulation);
    
    // 截图按钮
    const screenshotButton = document.getElementById('screenshotButton');
    screenshotButton.addEventListener('click', takeScreenshot);
    
    // Canvas交互
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    
    // 触摸事件
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);
    
    // 工具提示
    const tooltip = document.getElementById('tooltip');
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 检查是否在入射点附近
        const distance = Math.sqrt(Math.pow(x - incidentPoint.x, 2) + Math.pow(y - incidentPoint.y, 2));
        if (distance < 20) {
            tooltip.textContent = '拖动可改变入射点位置';
            tooltip.style.left = `${e.clientX + 10}px`;
            tooltip.style.top = `${e.clientY + 10}px`;
            tooltip.classList.add('visible');
        } else {
            tooltip.classList.remove('visible');
        }
    });
    
    canvas.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });
}

// 处理鼠标按下事件
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击在入射点附近
    const distance = Math.sqrt(Math.pow(x - incidentPoint.x, 2) + Math.pow(y - incidentPoint.y, 2));
    if (distance < 20) {
        isDragging = true;
        canvas.style.cursor = 'grabbing';
    }
}

// 处理鼠标移动事件
function handleMouseMove(e) {
    if (!isDragging) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 更新入射点位置
    incidentPoint.x = x;
    incidentPoint.y = y;
    
    // 更新介质边界和法线位置
    mediaBoundaryY = incidentPoint.y;
    normalLineX = incidentPoint.x;
    
    // 更新DOM元素位置
    updateDOMElementPositions();
    
    // 重新绘制
    draw();
}

// 处理鼠标释放事件
function handleMouseUp() {
    isDragging = false;
    canvas.style.cursor = 'grab';
}

// 处理触摸开始事件
function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseDown(mouseEvent);
    }
}

// 处理触摸移动事件
function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleMouseMove(mouseEvent);
    }
}

// 处理触摸结束事件
function handleTouchEnd() {
    handleMouseUp();
}

// 更新介质标签
function updateMediaLabels() {
    const mediaTopLabel = document.getElementById('mediaTopLabel');
    const mediaBottomLabel = document.getElementById('mediaBottomLabel');
    
    // 获取介质名称
    const medium1Name = mediumNames[n1.toFixed(2)] || `介质 ${n1.toFixed(2)}`;
    const medium2Name = mediumNames[n2.toFixed(2)] || `介质 ${n2.toFixed(2)}`;
    
    // 更新标签
    if (mediaTopLabel) {
        mediaTopLabel.textContent = `介质 1: ${medium1Name} (n₁ = ${n1.toFixed(2)})`;
    }
    
    if (mediaBottomLabel) {
        mediaBottomLabel.textContent = `介质 2: ${medium2Name} (n₂ = ${n2.toFixed(2)})`;
    }
}

// 切换播放状态
function togglePlay() {
    isPlaying = !isPlaying;
    const playButton = document.getElementById('playButton');
    
    if (isPlaying) {
        playButton.innerHTML = '<i class="fa fa-pause"></i> 暂停动画';
        // 如果动画已被取消，重新启动动画循环
        if (!animationId) {
            animate();
        }
    } else {
        playButton.innerHTML = '<i class="fa fa-play"></i> 继续动画';
    }
}

// 重置模拟
function resetSimulation() {
    // 重置参数
    incidentAngle = 45;
    n1 = 1.0;
    n2 = 1.33;
    
    // 更新滑块和显示值
    document.getElementById('incidentAngle').value = incidentAngle;
    document.getElementById('incidentAngleValue').textContent = `${incidentAngle}°`;
    document.getElementById('n1').value = n1;
    document.getElementById('n1Value').textContent = n1.toFixed(2);
    document.getElementById('n2').value = n2;
    document.getElementById('n2Value').textContent = n2.toFixed(2);
    
    // 重置入射点位置
    incidentPoint = { x: centerX, y: centerY };
    mediaBoundaryY = centerY;
    normalLineX = centerX;
    
    // 更新DOM元素位置
    updateDOMElementPositions();
    
    // 更新介质标签
    updateMediaLabels();
    
    // 重置动画状态
    isPlaying = false;
    document.getElementById('playButton').innerHTML = '<i class="fa fa-play"></i> 播放动画';
    rayAnimationProgress = 0;
    
    // 清除粒子
    particles = [];
    
    // 更新模拟
    updateSimulation();
}

// 截图功能
function takeScreenshot() {
    // 创建一个临时的Canvas元素
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // 设置临时Canvas尺寸
    tempCanvas.width = canvasWidth;
    tempCanvas.height = canvasHeight;
    
    // 绘制背景
    tempCtx.fillStyle = '#0F172A';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    
    // 绘制介质边界
    tempCtx.beginPath();
    tempCtx.moveTo(0, mediaBoundaryY);
    tempCtx.lineTo(tempCanvas.width, mediaBoundaryY);
    tempCtx.strokeStyle = colors.mediaBoundary;
    tempCtx.lineWidth = 2;
    tempCtx.stroke();
    
    // 绘制法线
    tempCtx.beginPath();
    tempCtx.moveTo(normalLineX, mediaBoundaryY - 100);
    tempCtx.lineTo(normalLineX, mediaBoundaryY + 100);
    tempCtx.setLineDash([5, 5]);
    tempCtx.strokeStyle = colors.normalLine;
    tempCtx.lineWidth = 1;
    tempCtx.stroke();
    tempCtx.setLineDash([]);
    
    // 计算光线
    const { incidentRay, reflectionRay, refractionRay, isRefracted, isTotalReflection } = calculateRays();
    
    // 绘制入射光线
    drawRay(tempCtx, incidentRay, colors.incidentRay, 2, false);
    
    // 绘制反射光线
    drawRay(tempCtx, reflectionRay, colors.reflectionRay, 2, false);
    
    // 绘制折射光线（如果存在）
    if (isRefracted && !isTotalReflection) {
        drawRay(tempCtx, refractionRay, colors.refractionRay, 2, false);
    }
    
    // 绘制角度标注
    drawAngleAnnotation(tempCtx, incidentPoint.x, incidentPoint.y, incidentRay.angle, 30, colors.angleArcIncident, currentAngleLabels.incident, 'incident');
    drawAngleAnnotation(tempCtx, incidentPoint.x, incidentPoint.y, reflectionRay.angle, 30, colors.angleArcReflection, currentAngleLabels.reflection, 'reflection');

    if (isRefracted && !isTotalReflection && currentAngleLabels.hasRefraction) {
        drawAngleAnnotation(tempCtx, incidentPoint.x, incidentPoint.y, Math.abs(refractionRay.angle), 30, colors.angleArcRefraction, currentAngleLabels.refraction, 'refraction');
    } else if (isTotalReflection) {
        // 绘制全反射提示
        tempCtx.fillStyle = '#F59E0B';
        tempCtx.font = 'bold 16px Inter, sans-serif';
        tempCtx.textAlign = 'center';
        tempCtx.fillText('全反射', incidentPoint.x + 50, incidentPoint.y - 20);
    }
    
    // 绘制介质标签
    tempCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    tempCtx.font = '14px Inter, sans-serif';
    tempCtx.textAlign = 'left';
    
    // 获取介质名称
    const medium1Name = mediumNames[n1.toFixed(2)] || `介质 ${n1.toFixed(2)}`;
    const medium2Name = mediumNames[n2.toFixed(2)] || `介质 ${n2.toFixed(2)}`;
    
    tempCtx.fillText(`介质 1: ${medium1Name} (n₁ = ${n1.toFixed(2)})`, 10, 30);
    tempCtx.fillText(`介质 2: ${medium2Name} (n₂ = ${n2.toFixed(2)})`, 10, tempCanvas.height - 20);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `光的反射折射_${new Date().toISOString().slice(0, 10)}.png`;
    link.href = tempCanvas.toDataURL('image/png');
    link.click();
}

// 计算光线
function calculateRays() {
    // 入射角（弧度）
    const incidentAngleRad = incidentAngle * Math.PI / 180;
    
    // 入射光线起点
    const incidentStartX = incidentPoint.x - Math.sin(incidentAngleRad) * 200;
    const incidentStartY = incidentPoint.y - Math.cos(incidentAngleRad) * 200;
    
    // 入射光线
    const incidentRay = {
        start: { x: incidentStartX, y: incidentStartY },
        end: { x: incidentPoint.x, y: incidentPoint.y },
        angle: incidentAngleRad
    };
    
    // 反射光线
    const reflectionAngleRad = incidentAngleRad;
    const reflectionEndX = incidentPoint.x + Math.sin(reflectionAngleRad) * 200;
    const reflectionEndY = incidentPoint.y - Math.cos(reflectionAngleRad) * 200;
    
    const reflectionRay = {
        start: { x: incidentPoint.x, y: incidentPoint.y },
        end: { x: reflectionEndX, y: reflectionEndY },
        angle: reflectionAngleRad
    };
    
    // 折射光线
    let refractionRay = null;
    let isRefracted = true;
    let isTotalReflection = false;
    
    // 使用斯奈尔定律计算折射角
    const sinRefraction = (n1 / n2) * Math.sin(incidentAngleRad);
    
    // 检查是否发生全反射
    if (Math.abs(sinRefraction) > 1 && n1 > n2) {
        isRefracted = false;
        isTotalReflection = true;
    } else {
        const refractionAngleRad = Math.asin(sinRefraction);
        const refractionEndX = incidentPoint.x + Math.sin(refractionAngleRad) * 200;
        const refractionEndY = incidentPoint.y + Math.cos(refractionAngleRad) * 200;
        
        refractionRay = {
            start: { x: incidentPoint.x, y: incidentPoint.y },
            end: { x: refractionEndX, y: refractionEndY },
            angle: refractionAngleRad
        };
    }
    
    return {
        incidentRay,
        reflectionRay,
        refractionRay,
        isRefracted,
        isTotalReflection
    };
}

// 绘制光线
function drawRay(ctx, ray, color, lineWidth, dashed = false) {
    ctx.beginPath();
    ctx.moveTo(ray.start.x, ray.start.y);
    ctx.lineTo(ray.end.x, ray.end.y);
    
    if (dashed) {
        ctx.setLineDash([5, 5]);
    }
    
    // 创建渐变
    const gradient = ctx.createLinearGradient(ray.start.x, ray.start.y, ray.end.x, ray.end.y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    
    if (dashed) {
        ctx.setLineDash([]);
    }
    
    // 绘制箭头
    const headLength = 10;
    const angle = Math.atan2(ray.end.y - ray.start.y, ray.end.x - ray.start.x);
    
    ctx.beginPath();
    ctx.moveTo(ray.end.x, ray.end.y);
    ctx.lineTo(
        ray.end.x - headLength * Math.cos(angle - Math.PI / 6),
        ray.end.y - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        ray.end.x - headLength * Math.cos(angle + Math.PI / 6),
        ray.end.y - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// 绘制角度标注
function drawAngleAnnotation(ctx, x, y, angleRad, radius, color, text, orientation = 'incident') {
    if (!text || angleRad <= 0) {
        return;
    }

    let startAngle;
    let endAngle;
    let anticlockwise;
    let textAngle;

    switch (orientation) {
        case 'reflection':
            startAngle = -Math.PI / 2;
            endAngle = startAngle + angleRad;
            anticlockwise = false;
            textAngle = startAngle + angleRad / 2;
            break;
        case 'refraction':
            startAngle = Math.PI / 2;
            endAngle = startAngle - angleRad;
            anticlockwise = true;
            textAngle = startAngle - angleRad / 2;
            break;
        default:
            startAngle = -Math.PI / 2;
            endAngle = startAngle - angleRad;
            anticlockwise = true;
            textAngle = startAngle - angleRad / 2;
            break;
    }

    ctx.beginPath();
    ctx.arc(x, y, radius, startAngle, endAngle, anticlockwise);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    const labelRadius = radius + (orientation === 'refraction' ? 26 : 20);
    let textX = x + labelRadius * Math.cos(textAngle);
    let textY = y + labelRadius * Math.sin(textAngle);

    let textAlign = 'center';
    let textBaseline = 'middle';
    let horizontalShift = 0;
    let verticalShift = 0;

    switch (orientation) {
        case 'reflection':
            textAlign = 'left';
            textBaseline = 'bottom';
            horizontalShift = 6;
            verticalShift = -6;
            break;
        case 'refraction':
            textAlign = 'center';
            textBaseline = 'top';
            verticalShift = 8;
            break;
        default:
            textAlign = 'right';
            textBaseline = 'bottom';
            horizontalShift = -6;
            verticalShift = -6;
            break;
    }

    textX += horizontalShift;
    textY += verticalShift;

    ctx.fillStyle = color;
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = textAlign;
    ctx.textBaseline = textBaseline;
    ctx.fillText(text, textX, textY);
}

// 创建粒子
function createParticles(ray, color, count) {
    for (let i = 0; i < count; i++) {
        // 在光线上随机位置创建粒子
        const t = Math.random();
        const x = ray.start.x + t * (ray.end.x - ray.start.x);
        const y = ray.start.y + t * (ray.end.y - ray.start.y);
        
        particles.push({
            x,
            y,
            color,
            size: Math.random() * 2 + 1,
            speed: Math.random() * 0.5 + 0.5,
            progress: t
        });
    }
}

// 更新粒子
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        
        // 更新粒子位置
        particle.progress += particle.speed * 0.01;
        if (particle.progress > 1) {
            particles.splice(i, 1);
            continue;
        }
        
        // 根据粒子所属光线类型更新位置
        if (particle.rayType === 'incident') {
            const { incidentRay } = calculateRays();
            particle.x = incidentRay.start.x + particle.progress * (incidentRay.end.x - incidentRay.start.x);
            particle.y = incidentRay.start.y + particle.progress * (incidentRay.end.y - incidentRay.start.y);
        } else if (particle.rayType === 'reflection') {
            const { reflectionRay } = calculateRays();
            particle.x = reflectionRay.start.x + particle.progress * (reflectionRay.end.x - reflectionRay.start.x);
            particle.y = reflectionRay.start.y + particle.progress * (reflectionRay.end.y - reflectionRay.start.y);
        } else if (particle.rayType === 'refraction') {
            const { refractionRay } = calculateRays();
            if (refractionRay) {
                particle.x = refractionRay.start.x + particle.progress * (refractionRay.end.x - refractionRay.start.x);
                particle.y = refractionRay.start.y + particle.progress * (refractionRay.end.y - refractionRay.start.y);
            }
        }
    }
}

// 绘制粒子
function drawParticles(ctx) {
    particles.forEach(particle => {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        // 创建渐变
        const gradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
        );
        gradient.addColorStop(0, particle.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fill();
    });
}

// 更新模拟
function updateSimulation() {
    // 清除粒子
    particles = [];
    
    // 重置动画进度
    rayAnimationProgress = 0;
    
    // 更新实时数据显示
    updateDataDisplay();
    
    // 重新绘制
    draw();
}

// 更新实时数据显示
function updateDataDisplay() {
    // 计算折射角
    let refractionAngle = 0;
    let isTotalReflection = false;
    
    const sinRefraction = (n1 / n2) * Math.sin(incidentAngle * Math.PI / 180);
    
    if (Math.abs(sinRefraction) > 1 && n1 > n2) {
        isTotalReflection = true;
    } else {
        refractionAngle = Math.asin(sinRefraction) * 180 / Math.PI;
    }
    
    // 计算临界角
    let criticalAngle = '-';
    if (n1 > n2) {
        criticalAngle = Math.asin(n2 / n1) * 180 / Math.PI;
        criticalAngle = criticalAngle.toFixed(1) + '°';
    }
    
    // 确定现象
    let phenomenon = '折射';
    if (isTotalReflection) {
        phenomenon = '全反射';
    } else if (Math.abs(incidentAngle) < 0.1) {
        phenomenon = '垂直入射';
    }
    
    const incidentAngleText = `${incidentAngle.toFixed(1)}°`;
    const refractionAngleText = isTotalReflection ? '-' : `${refractionAngle.toFixed(1)}°`;

    // 更新显示
    document.getElementById('displayIncidentAngle').textContent = incidentAngleText;
    document.getElementById('displayReflectionAngle').textContent = incidentAngleText;
    document.getElementById('displayRefractionAngle').textContent = refractionAngleText;
    document.getElementById('displayCriticalAngle').textContent = criticalAngle;
    document.getElementById('displayPhenomenon').textContent = phenomenon;

    // 记录当前角度标注
    currentAngleLabels.incident = `入射角 θᵢ = ${incidentAngleText}`;
    currentAngleLabels.reflection = `反射角 θᵣ = ${incidentAngleText}`;
    if (isTotalReflection) {
        currentAngleLabels.hasRefraction = false;
        currentAngleLabels.refraction = '折射角 θₜ = -';
    } else {
        currentAngleLabels.hasRefraction = true;
        currentAngleLabels.refraction = `折射角 θₜ = ${refractionAngleText}`;
    }
}

// 绘制函数
function draw() {
    // 清除Canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制介质边界
    ctx.beginPath();
    ctx.moveTo(0, mediaBoundaryY);
    ctx.lineTo(canvasWidth, mediaBoundaryY);
    ctx.strokeStyle = colors.mediaBoundary;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 绘制法线
    ctx.beginPath();
    ctx.moveTo(normalLineX, mediaBoundaryY - 100);
    ctx.lineTo(normalLineX, mediaBoundaryY + 100);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = colors.normalLine;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 计算光线
    const { incidentRay, reflectionRay, refractionRay, isRefracted, isTotalReflection } = calculateRays();
    
    // 绘制入射光线
    if (rayAnimationProgress < 1) {
        // 动画进行中，绘制部分入射光线
        const animatedIncidentRay = {
            start: incidentRay.start,
            end: {
                x: incidentRay.start.x + rayAnimationProgress * (incidentRay.end.x - incidentRay.start.x),
                y: incidentRay.start.y + rayAnimationProgress * (incidentRay.end.y - incidentRay.start.y)
            },
            angle: incidentRay.angle
        };
        drawRay(ctx, animatedIncidentRay, colors.incidentRay, 2);
        
        // 添加入射光粒子
        if (Math.random() < 0.3 && rayAnimationProgress > 0.1) {
            createParticles(animatedIncidentRay, colors.particleIncident, 1);
        }
    } else {
        // 动画完成，绘制完整入射光线
        drawRay(ctx, incidentRay, colors.incidentRay, 2);
        
        // 绘制反射光线
        if (rayAnimationProgress < 2) {
            // 反射动画进行中，绘制部分反射光线
            const reflectionProgress = rayAnimationProgress - 1;
            const animatedReflectionRay = {
                start: reflectionRay.start,
                end: {
                    x: reflectionRay.start.x + reflectionProgress * (reflectionRay.end.x - reflectionRay.start.x),
                    y: reflectionRay.start.y + reflectionProgress * (reflectionRay.end.y - reflectionRay.start.y)
                },
                angle: reflectionRay.angle
            };
            drawRay(ctx, animatedReflectionRay, colors.reflectionRay, 2);
            
            // 添加反射光粒子
            if (Math.random() < 0.3 && reflectionProgress > 0.1) {
                createParticles(animatedReflectionRay, colors.particleReflection, 1);
            }
        } else {
            // 反射动画完成，绘制完整反射光线
            drawRay(ctx, reflectionRay, colors.reflectionRay, 2);
            
            // 绘制折射光线（如果存在）
            if (isRefracted && !isTotalReflection) {
                if (rayAnimationProgress < 3) {
                    // 折射动画进行中，绘制部分折射光线
                    const refractionProgress = rayAnimationProgress - 2;
                    const animatedRefractionRay = {
                        start: refractionRay.start,
                        end: {
                            x: refractionRay.start.x + refractionProgress * (refractionRay.end.x - refractionRay.start.x),
                            y: refractionRay.start.y + refractionProgress * (refractionRay.end.y - refractionRay.start.y)
                        },
                        angle: refractionRay.angle
                    };
                    drawRay(ctx, animatedRefractionRay, colors.refractionRay, 2);
                    
                    // 添加折射光粒子
                    if (Math.random() < 0.3 && refractionProgress > 0.1) {
                        createParticles(animatedRefractionRay, colors.particleRefraction, 1);
                    }
                } else {
                    // 折射动画完成，绘制完整折射光线
                    drawRay(ctx, refractionRay, colors.refractionRay, 2);
                    
                    // 如果正在播放，重置动画进度
                    if (isPlaying) {
                        rayAnimationProgress = 0;
                        
                        // 清除粒子
                        particles = [];
                    }
                }
            } else if (isTotalReflection) {
                // 绘制全反射提示
                ctx.fillStyle = '#F59E0B';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('全反射', incidentPoint.x + 50, incidentPoint.y - 20);
                
                // 如果正在播放，重置动画进度
                if (isPlaying) {
                    rayAnimationProgress = 0;
                    
                    // 清除粒子
                    particles = [];
                }
            } else {
                // 如果正在播放，重置动画进度
                if (isPlaying) {
                    rayAnimationProgress = 0;
                    
                    // 清除粒子
                    particles = [];
                }
            }
        }
    }
    
    // 绘制角度标注
    if (rayAnimationProgress >= 1) {
        drawAngleAnnotation(ctx, incidentPoint.x, incidentPoint.y, incidentRay.angle, 30, colors.angleArcIncident, currentAngleLabels.incident, 'incident');
        
        if (rayAnimationProgress >= 2) {
            drawAngleAnnotation(ctx, incidentPoint.x, incidentPoint.y, reflectionRay.angle, 30, colors.angleArcReflection, currentAngleLabels.reflection, 'reflection');
            
            if (isRefracted && !isTotalReflection && rayAnimationProgress >= 2 && currentAngleLabels.hasRefraction) {
                drawAngleAnnotation(ctx, incidentPoint.x, incidentPoint.y, Math.abs(refractionRay.angle), 30, colors.angleArcRefraction, currentAngleLabels.refraction, 'refraction');
            }
        }
    }
    
    // 绘制粒子
    drawParticles(ctx);
}

// 动画循环
function animate() {
    // 更新动画进度
    if (isPlaying) {
        rayAnimationProgress += rayAnimationSpeed;
        
        // 更新粒子
        updateParticles();
    }
    
    // 绘制
    draw();
    
    // 请求下一帧
    animationId = requestAnimationFrame(animate);
}

// 页面加载完成后初始化
window.addEventListener('load', init);