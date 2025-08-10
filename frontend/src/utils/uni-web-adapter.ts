/**
 * UniApp Web Adapter
 * 临时解决方案：将UniApp组件映射到Web标准元素
 */
import { App } from 'vue'

// 定义基础UniApp组件的Web实现
const UniWebComponents = {
  // view -> div
  'view': {
    name: 'view',
    template: '<div :class="$attrs.class" :style="$attrs.style" v-bind="$attrs"><slot /></div>'
  },
  
  // text -> span
  'text': {
    name: 'text',
    template: '<span :class="$attrs.class" :style="$attrs.style" v-bind="$attrs"><slot /></span>'
  },
  
  // scroll-view -> 可滚动的div
  'scroll-view': {
    name: 'scroll-view',
    template: `
      <div 
        :class="['uni-scroll-view', $attrs.class]" 
        :style="[$attrs.style, scrollStyle]"
        v-bind="$attrs"
        @scroll="handleScroll"
      >
        <slot />
      </div>
    `,
    props: {
      scrollX: Boolean,
      scrollY: {
        type: Boolean,
        default: true
      },
      showScrollbar: {
        type: Boolean,
        default: true
      }
    },
    computed: {
      scrollStyle() {
        return {
          overflow: this.scrollX ? 'auto' : (this.scrollY ? 'auto' : 'hidden'),
          whiteSpace: this.scrollX ? 'nowrap' : 'normal',
          ...(this.scrollX && { display: 'flex', flexDirection: 'row' })
        }
      }
    },
    methods: {
      handleScroll(e: Event) {
        this.$emit('scroll', e)
      }
    }
  },
  
  // uni-popup -> 简单弹窗实现
  'uni-popup': {
    name: 'uni-popup',
    template: `
      <teleport to="body">
        <div v-if="show" class="uni-popup-mask" :class="maskClass" @click="handleMaskClick">
          <div class="uni-popup-container" :class="containerClass" @click.stop>
            <slot />
          </div>
        </div>
      </teleport>
    `,
    props: {
      type: {
        type: String,
        default: 'center' // center, bottom, top
      },
      maskClick: {
        type: Boolean,
        default: true
      }
    },
    data() {
      return {
        show: false
      }
    },
    computed: {
      maskClass() {
        return [`uni-popup-${this.type}`]
      },
      containerClass() {
        return [`uni-popup-${this.type}-container`]
      }
    },
    methods: {
      open() {
        this.show = true
        this.$emit('change', { show: true, type: this.type })
      },
      close() {
        this.show = false
        this.$emit('change', { show: false, type: this.type })
      },
      handleMaskClick() {
        if (this.maskClick) {
          this.close()
        }
      }
    },
    expose: ['open', 'close']
  }
}

// 样式定义
const uniWebStyles = `
.uni-scroll-view {
  position: relative;
}

.uni-popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uni-popup-center {
  align-items: center;
  justify-content: center;
}

.uni-popup-bottom {
  align-items: flex-end;
  justify-content: center;
}

.uni-popup-top {
  align-items: flex-start;
  justify-content: center;
}

.uni-popup-container {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
}

.uni-popup-bottom-container {
  width: 100%;
  border-radius: 16px 16px 0 0;
  margin: 0;
}

.uni-popup-center-container {
  margin: 20px;
}

.uni-popup-top-container {
  width: 100%;
  border-radius: 0 0 16px 16px;
  margin: 0;
}
`

// 注入样式
function injectStyles() {
  if (typeof document !== 'undefined' && !document.querySelector('#uni-web-adapter-styles')) {
    const style = document.createElement('style')
    style.id = 'uni-web-adapter-styles'
    style.textContent = uniWebStyles
    document.head.appendChild(style)
  }
}

// 插件安装函数
export function installUniWebAdapter(app: App) {
  // 注入样式
  injectStyles()
  
  // 注册组件
  Object.entries(UniWebComponents).forEach(([name, component]) => {
    app.component(name, component)
  })
  
  console.log('[UniWebAdapter] UniApp Web适配器已安装')
}

export default {
  install: installUniWebAdapter
}