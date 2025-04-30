// 检查登录状态
if (!localStorage.getItem('isLoggedIn')) {
    window.location.href = 'login.html';
}

// 显示用户名
document.getElementById('username').textContent = localStorage.getItem('username') || '用户';

// 退出登录
document.getElementById('logoutButton').addEventListener('click', function() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('username');
    window.location.href = 'login.html';
});

let port;
let keepReading = true;
const maxDataPoints = 20;
const historyData = {
    timestamps: [],
    temperature: [],
    humidity: [],
    formaldehyde: [],
    pm25: []
};

// 添加连接状态相关变量
let connectionStartTime = null;
let lastDataTime = null;
let dataCount = 0;
let dataFrequency = 0;
let connectionTimer = null;

// 模态框相关
const modal = document.getElementById('historyModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
let currentHistoryChart = null;

// 关闭模态框
modalClose.addEventListener('click', () => {
    modal.style.display = 'none';
    if (currentHistoryChart) {
        currentHistoryChart.destroy();
        currentHistoryChart = null;
    }
});

// 点击卡片显示历史数据
document.getElementById('tempHumidCard').addEventListener('click', () => {
    showHistoryChart('温湿度历史数据', [
        {
            label: '温度',
            data: historyData.temperature,
            borderColor: '#ff9a9e',
            tension: 0.4
        },
        {
            label: '湿度',
            data: historyData.humidity,
            borderColor: '#a8e6cf',
            tension: 0.4
        }
    ]);
});

document.getElementById('formaldehydeCard').addEventListener('click', () => {
    showHistoryChart('甲醛历史数据', [{
        label: '甲醛',
        data: historyData.formaldehyde,
        borderColor: '#dcedc1',
        tension: 0.4
    }]);
});

document.getElementById('pm25Card').addEventListener('click', () => {
    showHistoryChart('PM2.5历史数据', [{
        label: 'PM2.5',
        data: historyData.pm25,
        borderColor: '#ffd3b6',
        tension: 0.4
    }]);
});

// 显示历史数据图表
function showHistoryChart(title, datasets) {
    modalTitle.textContent = title;
    modal.style.display = 'flex';
    
    if (currentHistoryChart) {
        currentHistoryChart.destroy();
    }
    
    currentHistoryChart = new Chart(
        document.getElementById('historyChart'),
        {
            type: 'line',
            data: {
                labels: historyData.timestamps,
                datasets: datasets
            },
            options: {
                responsive: true,
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        titleColor: '#4a4a4a',
                        bodyColor: '#4a4a4a',
                        borderColor: '#ff9a9e',
                        borderWidth: 1,
                        padding: 10,
                        displayColors: true
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                            modifierKey: 'ctrl'
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                                modifierKey: 'ctrl'
                            },
                            pinch: {
                                enabled: true
                            },
                            mode: 'x',
                            drag: {
                                enabled: true,
                                backgroundColor: 'rgba(255, 154, 158, 0.1)',
                                borderColor: '#ff9a9e',
                                borderWidth: 1
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: '时间'
                        },
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: '数值'
                        },
                        grid: {
                            color: 'rgba(0,0,0,0.05)'
                        }
                    }
                }
            }
        }
    );
}

// 图表配置
const chartConfig = {
    type: 'line',
    options: {
        responsive: true,
        animation: {
            duration: 500,
            easing: 'easeInOutQuart'
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#4a4a4a',
                bodyColor: '#4a4a4a',
                borderColor: '#ff9a9e',
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toFixed(2);
                        }
                        return label;
                    }
                }
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                    modifierKey: 'ctrl'
                },
                zoom: {
                    wheel: {
                        enabled: true,
                        modifierKey: 'ctrl'
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'x',
                    drag: {
                        enabled: true,
                        backgroundColor: 'rgba(255, 154, 158, 0.1)',
                        borderColor: '#ff9a9e',
                        borderWidth: 1
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0,0,0,0.05)'
                }
            }
        },
        elements: {
            line: {
                tension: 0.4
            },
            point: {
                radius: 3,
                hoverRadius: 5,
                hoverBorderWidth: 2
            }
        }
    }
};

// 初始化实时图表
const tempHumidChart = new Chart(
    document.getElementById('tempHumidChart'),
    {
        ...chartConfig,
        data: {
            labels: Array(maxDataPoints).fill(''),
            datasets: [
                {
                    label: '温度',
                    data: [],
                    borderColor: '#ff9a9e',
                    backgroundColor: 'rgba(255, 154, 158, 0.1)',
                    fill: true
                },
                {
                    label: '湿度',
                    data: [],
                    borderColor: '#a8e6cf',
                    backgroundColor: 'rgba(168, 230, 207, 0.1)',
                    fill: true
                }
            ]
        }
    }
);

const formaldehydeChart = new Chart(
    document.getElementById('formaldehydeChart'),
    {
        ...chartConfig,
        data: {
            labels: Array(maxDataPoints).fill(''),
            datasets: [{
                label: '甲醛',
                data: [],
                borderColor: '#dcedc1',
                backgroundColor: 'rgba(220, 237, 193, 0.1)',
                fill: true
            }]
        }
    }
);

const pm25Chart = new Chart(
    document.getElementById('pm25Chart'),
    {
        ...chartConfig,
        data: {
            labels: Array(maxDataPoints).fill(''),
            datasets: [{
                label: 'PM2.5',
                data: [],
                borderColor: '#ffd3b6',
                backgroundColor: 'rgba(255, 211, 182, 0.1)',
                fill: true
            }]
        }
    }
);

// 更新图表数据
function updateChart(chart, value) {
    chart.data.datasets[0].data.push(value);
    if (chart.data.datasets[0].data.length > maxDataPoints) {
        chart.data.datasets[0].data.shift();
    }
    chart.update('none');
}

// 更新温湿度图表
function updateTempHumidChart(temperature, humidity) {
    tempHumidChart.data.datasets[0].data.push(temperature);
    tempHumidChart.data.datasets[1].data.push(humidity);
    
    if (tempHumidChart.data.datasets[0].data.length > maxDataPoints) {
        tempHumidChart.data.datasets[0].data.shift();
        tempHumidChart.data.datasets[1].data.shift();
    }
    tempHumidChart.update('none');
}

// 更新历史数据
function updateHistoryData(data) {
    const timestamp = new Date().toLocaleTimeString();
    
    // 添加新数据
    historyData.timestamps.push(timestamp);
    if (data.temperature !== undefined) historyData.temperature.push(data.temperature);
    if (data.humidity !== undefined) historyData.humidity.push(data.humidity);
    if (data.formaldehyde !== undefined) historyData.formaldehyde.push(data.formaldehyde);
    if (data.pm25 !== undefined) historyData.pm25.push(data.pm25);
    
    // 保持最近100个数据点
    const maxHistoryPoints = 100;
    if (historyData.timestamps.length > maxHistoryPoints) {
        historyData.timestamps.shift();
        historyData.temperature.shift();
        historyData.humidity.shift();
        historyData.formaldehyde.shift();
        historyData.pm25.shift();
    }
    
    // 如果历史图表正在显示，更新它
    if (currentHistoryChart) {
        currentHistoryChart.update();
    }
    
    // 更新统计数据
    updateStatistics();
}

// 更新统计数据
function updateStatistics() {
    // 温度统计
    if (historyData.temperature.length > 0) {
        const avgTemp = historyData.temperature.reduce((a, b) => a + b, 0) / historyData.temperature.length;
        document.getElementById('avgTemp').textContent = avgTemp.toFixed(1);
    }
    
    // 湿度统计
    if (historyData.humidity.length > 0) {
        const avgHumid = historyData.humidity.reduce((a, b) => a + b, 0) / historyData.humidity.length;
        document.getElementById('avgHumid').textContent = avgHumid.toFixed(1);
    }
    
    // 甲醛统计
    if (historyData.formaldehyde.length > 0) {
        const avgFormaldehyde = historyData.formaldehyde.reduce((a, b) => a + b, 0) / historyData.formaldehyde.length;
        const maxFormaldehyde = Math.max(...historyData.formaldehyde);
        document.getElementById('avgFormaldehyde').textContent = avgFormaldehyde.toFixed(2);
        document.getElementById('maxFormaldehyde').textContent = maxFormaldehyde.toFixed(2);
    }
    
    // PM2.5统计
    if (historyData.pm25.length > 0) {
        const avgPM25 = historyData.pm25.reduce((a, b) => a + b, 0) / historyData.pm25.length;
        const maxPM25 = Math.max(...historyData.pm25);
        document.getElementById('avgPM25').textContent = avgPM25.toFixed(0);
        document.getElementById('maxPM25').textContent = maxPM25.toFixed(0);
    }
}

const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const statusDiv = document.getElementById('status');

// 添加数据更新提示元素
const dataUpdateToast = document.createElement('div');
dataUpdateToast.className = 'data-update-toast';
document.body.appendChild(dataUpdateToast);

// 显示数据更新提示
function showDataUpdateToast(message) {
    dataUpdateToast.textContent = message;
    dataUpdateToast.classList.add('show');
    setTimeout(() => {
        dataUpdateToast.classList.remove('show');
    }, 2000);
}

// 显示通知
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.getElementById('notificationContainer').appendChild(notification);
    
    // 显示通知
    setTimeout(() => notification.classList.add('show'), 100);
    
    // 3秒后移除通知
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 显示/隐藏加载动画
function toggleLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

// 更新连接状态详情
function updateConnectionDetails() {
    const connectionTime = document.getElementById('connectionTime');
    const dataFrequency = document.getElementById('dataFrequency');
    const lastUpdate = document.getElementById('lastUpdate');
    
    if (connectionStartTime) {
        const duration = Math.floor((new Date() - connectionStartTime) / 1000);
        connectionTime.textContent = `${duration}秒`;
    }
    
    dataFrequency.textContent = `${dataFrequency.toFixed(1)}次/秒`;
    lastUpdate.textContent = new Date().toLocaleTimeString();
}

// 修改连接设备函数
connectButton.addEventListener('click', async () => {
    try {
        toggleLoading(true);
        showNotification('正在连接设备...', 'info');
        
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 115200 });
        
        connectionStartTime = new Date();
        dataCount = 0;
        dataFrequency = 0;
        lastDataTime = null;
        
        // 启动连接状态更新定时器
        connectionTimer = setInterval(updateConnectionDetails, 1000);
        
        connectButton.textContent = '已连接';
        connectButton.disabled = true;
        disconnectButton.style.display = 'inline-block';
        statusDiv.textContent = '设备已连接';
        statusDiv.className = 'status connected';
        
        // 添加数据接收动画
        statusDiv.classList.add('data-receiving');
        
        keepReading = true;
        readData();
        
        showNotification('设备连接成功', 'success');
    } catch (error) {
        console.error('连接错误:', error);
        showNotification('连接设备失败: ' + error.message, 'warning');
    } finally {
        toggleLoading(false);
    }
});

// 修改断开连接函数
async function disconnectDevice() {
    try {
        keepReading = false;
        if (port) {
            try {
                await port.close();
                port = null;
            } catch (closeError) {
                console.error('关闭端口错误:', closeError);
                statusDiv.textContent = '断开连接失败';
                statusDiv.className = 'status error';
                setTimeout(() => {
                    statusDiv.textContent = '设备已连接';
                    statusDiv.className = 'status connected';
                }, 3000);
                return;
            }
        }
        
        // 移除数据接收动画
        statusDiv.classList.remove('data-receiving');
        
        // 清除连接状态更新定时器
        if (connectionTimer) {
            clearInterval(connectionTimer);
            connectionTimer = null;
        }
        
        connectionStartTime = null;
        lastDataTime = null;
        dataCount = 0;
        dataFrequency = 0;
        
        connectButton.textContent = '连接设备';
        connectButton.disabled = false;
        disconnectButton.style.display = 'none';
        statusDiv.textContent = '等待连接...';
        statusDiv.className = 'status disconnected';
        
        showDataUpdateToast('设备已断开连接');
        
        // 清空数据显示
        document.getElementById('temperature').textContent = '--';
        document.getElementById('humidity').textContent = '--';
        document.getElementById('formaldehyde').textContent = '--';
        document.getElementById('pm25').textContent = '--';
        
        // 重置图表数据
        tempHumidChart.data.datasets[0].data = [];
        tempHumidChart.data.datasets[1].data = [];
        tempHumidChart.update();
        
        formaldehydeChart.data.datasets[0].data = [];
        formaldehydeChart.update();
        
        pm25Chart.data.datasets[0].data = [];
        pm25Chart.update();
        
        // 清空历史数据
        historyData.timestamps = [];
        historyData.temperature = [];
        historyData.humidity = [];
        historyData.formaldehyde = [];
        historyData.pm25 = [];
        
        // 重置统计数据
        document.getElementById('avgTemp').textContent = '--';
        document.getElementById('avgHumid').textContent = '--';
        document.getElementById('avgFormaldehyde').textContent = '--';
        document.getElementById('maxFormaldehyde').textContent = '--';
        document.getElementById('avgPM25').textContent = '--';
        document.getElementById('maxPM25').textContent = '--';
        
    } catch (error) {
        console.error('断开连接错误:', error);
        statusDiv.textContent = '断开连接失败';
        statusDiv.className = 'status error';
        setTimeout(() => {
            statusDiv.textContent = '设备已连接';
            statusDiv.className = 'status connected';
        }, 3000);
    }
}

// 添加断开连接按钮事件监听
disconnectButton.addEventListener('click', disconnectDevice);

async function readData() {
    const textDecoder = new TextDecoder();
    
    while (port && keepReading) {
        try {
            const reader = port.readable.getReader();
            
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                
                const text = textDecoder.decode(value);
                
                try {
                    const data = JSON.parse(text);
                    updateDisplay(data);
                } catch (e) {
                    console.error('数据解析错误:', e);
                }
            }
            
            reader.releaseLock();
        } catch (error) {
            console.error('读取错误:', error);
            statusDiv.textContent = '连接断开';
            statusDiv.className = 'status disconnected';
        }
    }
}

// 添加数值变化动画类
function addValueChangeAnimation(element, value, unit) {
    element.classList.add('value-changing');
    element.textContent = value + unit;
    setTimeout(() => {
        element.classList.remove('value-changing');
    }, 1000);
}

// 修改数据更新函数
function updateValueWithColor(element, newValue, oldValue, unit) {
    if (oldValue === '--') {
        element.textContent = newValue + unit;
        return;
    }

    const diff = newValue - parseFloat(oldValue);
    if (Math.abs(diff) > 0.1) {
        element.classList.add('value-updating');
        if (diff > 0) {
            element.classList.add('value-increasing');
        } else {
            element.classList.add('value-decreasing');
        }
        element.textContent = newValue + unit;
        setTimeout(() => {
            element.classList.remove('value-updating', 'value-increasing', 'value-decreasing');
        }, 500);
    } else {
        element.textContent = newValue + unit;
    }
}

// 添加阈值检查函数
function checkThresholds(data) {
    const thresholds = {
        temperature: { min: 18, max: 28, unit: '°C' },
        humidity: { min: 30, max: 70, unit: '%' },
        formaldehyde: { max: 0.08, unit: 'mg/m³' },
        pm25: { max: 75, unit: 'μg/m³' }
    };

    let warnings = [];

    // 检查温度
    if (data.temperature < thresholds.temperature.min) {
        warnings.push(`温度过低：${data.temperature}${thresholds.temperature.unit}，建议适当提高室内温度`);
    } else if (data.temperature > thresholds.temperature.max) {
        warnings.push(`温度过高：${data.temperature}${thresholds.temperature.unit}，建议适当降低室内温度`);
    }

    // 检查湿度
    if (data.humidity < thresholds.humidity.min) {
        warnings.push(`湿度过低：${data.humidity}${thresholds.humidity.unit}，建议使用加湿器`);
    } else if (data.humidity > thresholds.humidity.max) {
        warnings.push(`湿度过高：${data.humidity}${thresholds.humidity.unit}，建议使用除湿器`);
    }

    // 检查甲醛
    if (data.formaldehyde > thresholds.formaldehyde.max) {
        warnings.push(`甲醛超标：${data.formaldehyde}${thresholds.formaldehyde.unit}，建议立即开窗通风`);
    }

    // 检查PM2.5
    if (data.pm25 > thresholds.pm25.max) {
        warnings.push(`PM2.5超标：${data.pm25}${thresholds.pm25.unit}，建议开启空气净化器`);
    }

    return warnings;
}

// 添加警报弹窗函数
function showAlert(warnings) {
    if (warnings.length === 0) return;

    // 创建警报弹窗
    const alertModal = document.createElement('div');
    alertModal.className = 'alert-modal';
    alertModal.innerHTML = `
        <div class="alert-content">
            <div class="alert-header">
                <i class="ri-alarm-warning-line"></i>
                <h3>环境异常警报</h3>
            </div>
            <div class="alert-body">
                ${warnings.map(warning => `<p>${warning}</p>`).join('')}
            </div>
            <div class="alert-footer">
                <button class="alert-close-btn">我知道了</button>
            </div>
        </div>
    `;

    // 添加警报样式
    const style = document.createElement('style');
    style.textContent = `
        .alert-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }

        .alert-content {
            background: white;
            border-radius: 15px;
            padding: 25px;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
            animation: slideIn 0.3s ease;
        }

        .alert-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 20px;
            color: #e74c3c;
        }

        .alert-header i {
            font-size: 24px;
        }

        .alert-header h3 {
            margin: 0;
            font-size: 20px;
        }

        .alert-body {
            margin-bottom: 20px;
        }

        .alert-body p {
            margin: 10px 0;
            color: #2c3e50;
            line-height: 1.5;
        }

        .alert-footer {
            text-align: right;
        }

        .alert-close-btn {
            background: #4ecdc4;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        .alert-close-btn:hover {
            background: #45b7af;
            transform: translateY(-2px);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideIn {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        .value-warning {
            animation: warningPulse 1s infinite;
        }

        @keyframes warningPulse {
            0% { color: inherit; }
            50% { color: #e74c3c; }
            100% { color: inherit; }
        }
    `;
    document.head.appendChild(style);

    // 添加到页面
    document.body.appendChild(alertModal);

    // 添加关闭事件
    const closeBtn = alertModal.querySelector('.alert-close-btn');
    closeBtn.addEventListener('click', () => {
        alertModal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(alertModal);
        }, 300);
    });

    // 播放警报声音
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play();
}

// 修改数据更新函数
function updateData(data) {
    // 检查阈值并获取警告信息
    const warnings = checkThresholds(data);
    
    // 如果有警告，显示警报
    if (warnings.length > 0) {
        showAlert(warnings);
    }

    // 更新各个数值显示
    document.getElementById('temperature').textContent = data.temperature.toFixed(1);
    document.getElementById('humidity').textContent = data.humidity.toFixed(1);
    document.getElementById('formaldehyde').textContent = data.formaldehyde.toFixed(2);
    document.getElementById('pm25').textContent = data.pm25.toFixed(1);

    // 更新图表
    updateCharts(data);

    // 更新环境质量评分
    updateEnvironmentScore(data);

    // 添加警告样式
    const elements = {
        temperature: document.getElementById('temperature'),
        humidity: document.getElementById('humidity'),
        formaldehyde: document.getElementById('formaldehyde'),
        pm25: document.getElementById('pm25')
    };

    // 移除所有警告样式
    Object.values(elements).forEach(el => el.classList.remove('value-warning'));

    // 为超出阈值的值添加警告样式
    warnings.forEach(warning => {
        if (warning.includes('温度')) elements.temperature.classList.add('value-warning');
        if (warning.includes('湿度')) elements.humidity.classList.add('value-warning');
        if (warning.includes('甲醛')) elements.formaldehyde.classList.add('value-warning');
        if (warning.includes('PM2.5')) elements.pm25.classList.add('value-warning');
    });
}

// 修改updateDisplay函数
function updateDisplay(data) {
    // 更新数据接收统计
    const now = new Date();
    if (lastDataTime) {
        const timeDiff = (now - lastDataTime) / 1000;
        if (timeDiff < 1) {
            dataCount++;
        } else {
            dataFrequency = dataCount / timeDiff;
            dataCount = 1;
            
            if (dataFrequency > 0) {
                showDataUpdateToast(`数据更新频率: ${dataFrequency.toFixed(1)}次/秒`);
            }
        }
    } else {
        dataCount = 1;
    }
    lastDataTime = now;
    
    // 检查数据是否超出阈值
    checkThresholds(data);
    
    // 更新评分
    updateScore(data);
    
    // 更新数值显示
    if (data.temperature !== undefined) {
        const oldTemp = document.getElementById('temperature').textContent;
        updateValueWithColor(document.getElementById('temperature'), data.temperature.toFixed(1), oldTemp, '°C');
    }
    if (data.humidity !== undefined) {
        const oldHumid = document.getElementById('humidity').textContent;
        updateValueWithColor(document.getElementById('humidity'), data.humidity.toFixed(1), oldHumid, '%');
    }
    if (data.formaldehyde !== undefined) {
        const oldForm = document.getElementById('formaldehyde').textContent;
        updateValueWithColor(document.getElementById('formaldehyde'), data.formaldehyde.toFixed(2), oldForm, 'mg/m³');
    }
    if (data.pm25 !== undefined) {
        const oldPM25 = document.getElementById('pm25').textContent;
        updateValueWithColor(document.getElementById('pm25'), data.pm25.toFixed(0), oldPM25, 'μg/m³');
    }
    
    // 更新实时图表
    if (data.temperature !== undefined && data.humidity !== undefined) {
        updateTempHumidChart(data.temperature, data.humidity);
    }
    if (data.formaldehyde !== undefined) {
        updateChart(formaldehydeChart, data.formaldehyde);
    }
    if (data.pm25 !== undefined) {
        updateChart(pm25Chart, data.pm25);
    }
    
    // 更新历史数据
    updateHistoryData(data);
}

// 页面关闭时清理
window.addEventListener('beforeunload', async () => {
    keepReading = false;
    if (port) {
        await port.close();
    }
});

// 添加帮助提示功能
document.querySelectorAll('.help-icon').forEach(icon => {
    icon.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        const tooltipId = icon.getAttribute('data-tooltip');
        const tooltip = document.getElementById(tooltipId);
        
        // 关闭其他打开的提示
        document.querySelectorAll('.help-tooltip.show').forEach(t => {
            if (t.id !== tooltipId) {
                t.classList.remove('show');
            }
        });
        
        // 切换当前提示的显示状态
        const isShowing = tooltip.classList.contains('show');
        if (!isShowing) {
            // 计算提示框位置
            const rect = icon.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            // 设置提示框位置
            tooltip.style.top = `${rect.bottom + scrollTop + 10}px`;
            tooltip.style.left = `${rect.left + scrollLeft}px`;
            
            // 检查是否超出右边界
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
            }
            
            // 检查是否超出下边界
            if (tooltipRect.bottom > window.innerHeight) {
                tooltip.style.top = `${rect.top + scrollTop - tooltipRect.height - 10}px`;
            }
        }
        
        tooltip.classList.toggle('show');
    });
});

// 点击其他地方关闭提示
document.addEventListener('click', (e) => {
    if (!e.target.closest('.help-icon') && !e.target.closest('.help-tooltip')) {
        document.querySelectorAll('.help-tooltip.show').forEach(tooltip => {
            tooltip.classList.remove('show');
        });
    }
});

// 窗口大小改变时重新定位提示框
window.addEventListener('resize', () => {
    document.querySelectorAll('.help-tooltip.show').forEach(tooltip => {
        const icon = document.querySelector(`[data-tooltip="${tooltip.id}"]`);
        if (icon) {
            const rect = icon.getBoundingClientRect();
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
            
            tooltip.style.top = `${rect.bottom + scrollTop + 10}px`;
            tooltip.style.left = `${rect.left + scrollLeft}px`;
            
            // 检查边界
            const tooltipRect = tooltip.getBoundingClientRect();
            if (tooltipRect.right > window.innerWidth) {
                tooltip.style.left = `${window.innerWidth - tooltipRect.width - 20}px`;
            }
            if (tooltipRect.bottom > window.innerHeight) {
                tooltip.style.top = `${rect.top + scrollTop - tooltipRect.height - 10}px`;
            }
        }
    });
});

// 页面加载时显示欢迎提示
window.addEventListener('load', () => {
    showDataUpdateToast('欢迎使用环境小卫士！点击问号图标查看各项数据的说明和安全范围。');
});

// 用户信息交互
const userInfo = document.getElementById('userInfo');
const userDetails = document.getElementById('userDetails');
const detailUsername = document.getElementById('detailUsername');
const loginTime = document.getElementById('loginTime');
const deviceStatus = document.getElementById('deviceStatus');
const userAvatar = document.querySelector('.user-avatar');

// 显示用户信息详情
userAvatar.addEventListener('click', (e) => {
    e.stopPropagation(); // 阻止事件冒泡
    const isVisible = userDetails.style.display === 'block';
    userDetails.style.display = isVisible ? 'none' : 'block';
    
    // 更新用户信息
    detailUsername.textContent = document.getElementById('username').textContent;
    loginTime.textContent = new Date().toLocaleString();
    deviceStatus.textContent = statusDiv.textContent;
});

// 点击其他地方关闭用户信息详情
document.addEventListener('click', (event) => {
    if (!userAvatar.contains(event.target) && !userDetails.contains(event.target)) {
        userDetails.style.display = 'none';
    }
});

// 更新设备状态时同步更新用户信息中的设备状态
const originalUpdateConnectionStatus = updateConnectionStatus;
updateConnectionStatus = function() {
    originalUpdateConnectionStatus();
    if (userDetails.style.display === 'block') {
        deviceStatus.textContent = statusDiv.textContent;
    }
};

// 添加图表交互功能
function enhanceChartInteraction(chart) {
    chart.options.plugins.zoom = {
        pan: {
            enabled: true,
            mode: 'x',
            modifierKey: 'ctrl'
        },
        zoom: {
            wheel: {
                enabled: true,
                modifierKey: 'ctrl'
            },
            pinch: {
                enabled: true
            },
            mode: 'x',
            drag: {
                enabled: true,
                backgroundColor: 'rgba(255, 154, 158, 0.1)',
                borderColor: '#ff9a9e',
                borderWidth: 1
            }
        }
    };
    
    chart.options.plugins.tooltip = {
        enabled: true,
        mode: 'index',
        intersect: false,
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += context.parsed.y.toFixed(2);
                }
                return label;
            }
        }
    };
}

// 应用图表增强功能
enhanceChartInteraction(tempHumidChart);
enhanceChartInteraction(formaldehydeChart);
enhanceChartInteraction(pm25Chart);

// 添加连接状态点击事件
statusDiv.addEventListener('click', () => {
    const details = document.getElementById('connectionDetails');
    details.classList.toggle('show');
});

// 点击其他地方关闭连接详情
document.addEventListener('click', (event) => {
    if (!statusDiv.contains(event.target)) {
        document.getElementById('connectionDetails').classList.remove('show');
    }
}); 