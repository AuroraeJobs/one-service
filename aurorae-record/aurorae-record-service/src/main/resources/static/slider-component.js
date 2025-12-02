// 滑块组件类
class SliderComponent {
    constructor(options = {}) {
        this.startSlider = null;
        this.endSlider = null;
        this.startValue = null;
        this.endValue = null;
        this.maxValue = options.maxValue || 1000;
        this.defaultStart = options.defaultStart || 1;
        this.defaultEnd = options.defaultEnd || this.maxValue;
        this.onChange = options.onChange || function() {};
        
        // 初始化组件
        this.init();
    }
    
    // 初始化组件
    init() {
        // 获取DOM元素
        this.startSlider = document.getElementById('startSlider');
        this.endSlider = document.getElementById('endSlider');
        this.startValue = document.getElementById('startValue');
        this.endValue = document.getElementById('endValue');
        
        // 验证DOM元素是否存在
        if (!this.startSlider || !this.endSlider || !this.startValue || !this.endValue) {
            console.error('Slider component DOM elements not found');
            return;
        }
        
        // 设置滑块最大值
        this.startSlider.max = this.maxValue;
        this.endSlider.max = this.maxValue;
        
        // 设置初始值
        this.startSlider.value = this.defaultStart;
        this.endSlider.value = this.defaultEnd;
        this.startValue.textContent = this.defaultStart;
        this.endValue.textContent = this.defaultEnd;
        
        // 更新滑块值位置
        this.updateSliderValuePosition(this.startSlider, this.startValue);
        this.updateSliderValuePosition(this.endSlider, this.endValue);
        
        // 添加事件监听器
        this.addEventListeners();
    }
    
    // 更新滑块值位置
    updateSliderValuePosition(slider, valueElement) {
        const min = slider.min;
        const max = slider.max;
        const value = slider.value;
        
        // 计算滑块值的百分比位置
        const percentage = ((value - min) / (max - min)) * 100;
        
        // 更新滑块值的位置
        valueElement.style.left = `${percentage}%`;
        valueElement.style.transform = `translateX(-50%)`;
    }
    
    // 添加事件监听器
    addEventListeners() {
        // 开始滑块事件
        this.startSlider.addEventListener('input', () => {
            this.handleSliderChange(this.startSlider, this.endSlider);
        });
        
        // 结束滑块事件
        this.endSlider.addEventListener('input', () => {
            this.handleSliderChange(this.endSlider, this.startSlider);
        });
    }
    
    // 处理滑块变化事件
    handleSliderChange(changedSlider, otherSlider) {
        let start = parseInt(this.startSlider.value);
        let end = parseInt(this.endSlider.value);
        
        // 只确保开始滑块不超过结束滑块，不自动调整另一个滑块的值
        if (start > end) {
            if (changedSlider === this.startSlider) {
                // 如果拖动的是开始滑块，且超过了结束滑块，将开始滑块调整为结束滑块值
                start = end;
                this.startSlider.value = start;
            } else {
                // 如果拖动的是结束滑块，且小于开始滑块，将结束滑块调整为开始滑块值
                end = start;
                this.endSlider.value = end;
            }
        }
        
        // 更新显示值
        this.startValue.textContent = start;
        this.endValue.textContent = end;
        
        // 更新滑块值位置
        this.updateSliderValuePosition(this.startSlider, this.startValue);
        this.updateSliderValuePosition(this.endSlider, this.endValue);
        
        // 调用回调函数
        this.onChange(start, end);
    }
    
    // 设置滑块最大值
    setMaxValue(maxValue) {
        this.maxValue = maxValue;
        this.startSlider.max = maxValue;
        this.endSlider.max = maxValue;
        
        // 获取当前值
        let start = parseInt(this.startSlider.value);
        let end = parseInt(this.endSlider.value);
        
        // 确保结束值不超过最大值
        if (end > maxValue) {
            end = maxValue;
        }
        
        // 确保开始值不小于1
        if (start < 1) {
            start = 1;
        }
        
        // 确保开始值不大于结束值
        if (start > end) {
            start = end;
        }
        
        // 更新滑块值
        this.startSlider.value = start;
        this.endSlider.value = end;
        this.startValue.textContent = start;
        this.endValue.textContent = end;
        
        // 更新滑块值位置
        this.updateSliderValuePosition(this.startSlider, this.startValue);
        this.updateSliderValuePosition(this.endSlider, this.endValue);
        
        // 调用回调函数
        this.onChange(start, end);
    }
    
    // 设置默认值
    setDefaultValues(start, end) {
        // 确保开始行号是结束行号减7
        let adjustedStart = end - 7;
        
        // 确保开始行号不小于1
        if (adjustedStart < 1) {
            adjustedStart = 1;
        }
        
        this.defaultStart = adjustedStart;
        this.defaultEnd = end;
        this.startSlider.value = adjustedStart;
        this.endSlider.value = end;
        this.startValue.textContent = adjustedStart;
        this.endValue.textContent = end;
        this.updateSliderValuePosition(this.startSlider, this.startValue);
        this.updateSliderValuePosition(this.endSlider, this.endValue);
        this.onChange(adjustedStart, end);
    }
    
    // 获取当前值
    getCurrentValues() {
        return {
            start: parseInt(this.startSlider.value),
            end: parseInt(this.endSlider.value)
        };
    }
    
    // 设置滑块主题颜色
    setTheme(theme) {
        // 移除所有主题类
        this.startSlider.classList.remove('red-theme', 'blue-theme');
        this.endSlider.classList.remove('red-theme', 'blue-theme');
        this.startValue.classList.remove('red-theme', 'blue-theme');
        this.endValue.classList.remove('red-theme', 'blue-theme');
        
        // 添加新主题类
        this.startSlider.classList.add(theme + '-theme');
        this.endSlider.classList.add(theme + '-theme');
        this.startValue.classList.add(theme + '-theme');
        this.endValue.classList.add(theme + '-theme');
    }
}

// 导出组件，支持多种模块系统
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SliderComponent;
} else if (typeof define === 'function' && define.amd) {
    define([], function() {
        return SliderComponent;
    });
} else {
    window.SliderComponent = SliderComponent;
}