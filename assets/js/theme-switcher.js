// 根据主题自动切换头像和logo
(function() {
  // 配置图片路径
  const images = {
    avatar: {
      light: '/images/cys-light-trimmed.gif',
      dark: '/images/cys-dark-trimmed.gif'
    },
    logo: {
      light: '/favicon-light/web-app-manifest-192x192.png',
      dark: '/favicon-dark/web-app-manifest-192x192.png'
    },
    // 浏览器标签页 favicon
    favicon: {
      browserDark: '/favicon-dark/favicon-96x96.png',
      browserLight: '/favicon-light/favicon-96x96.png'
    }
  };

  // 切换浏览器标签页 favicon（根据浏览器/系统的颜色方案）
  function switchFavicon() {
    // 检测浏览器/系统是否为 dark 模式
    const isBrowserDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    const faviconPath = isBrowserDark ? images.favicon.browserDark : images.favicon.browserLight;

    // 查找或创建 favicon link 标签
    let faviconLink = document.querySelector('link[rel="icon"]');
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    }

    // 更新 favicon
    faviconLink.href = faviconPath;
  }

  // 切换图片的函数
  function switchImages() {
    // 从 document.body 获取当前主题，确保获取最新的主题状态
    const isDark = document.body.getAttribute('theme') !== 'light';

    // 切换主页头像
    const avatarImg = document.querySelector('.profile-avatar img') || document.querySelector('.home-avatar img');
    if (avatarImg) {
      const newSrc = isDark ? images.avatar.dark : images.avatar.light;
      avatarImg.src = newSrc;
    }

    // 切换header logo（桌面版）
    const desktopLogo = document.querySelector('#header-desktop .header-title img');
    if (desktopLogo) {
      const newSrc = isDark ? images.logo.dark : images.logo.light;
      desktopLogo.src = newSrc;
    }

    // 切换header logo（移动版）
    const mobileLogo = document.querySelector('#header-mobile .header-title img');
    if (mobileLogo) {
      const newSrc = isDark ? images.logo.dark : images.logo.light;
      mobileLogo.src = newSrc;
    }
  }

  // 注册主题切换事件监听器（轮询等待 switchThemeEventSet 初始化）
  function registerThemeListener() {
    if (window.switchThemeEventSet) {
      window.switchThemeEventSet.add(switchImages);
    } else {
      // 如果还没初始化，50ms 后重试
      setTimeout(registerThemeListener, 50);
    }
  }

  // 初始化函数
  function init() {
    // 首次执行切换
    switchImages();
    switchFavicon();

    // 注册主题切换事件监听器（用于网站主题变化）
    registerThemeListener();

    // 监听浏览器/系统颜色方案变化
    if (window.matchMedia) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      // 使用 addEventListener（现代浏览器）或 addListener（旧版浏览器）
      if (darkModeMediaQuery.addEventListener) {
        darkModeMediaQuery.addEventListener('change', function(e) {
          switchFavicon();
        });
      } else if (darkModeMediaQuery.addListener) {
        darkModeMediaQuery.addListener(function() {
          switchFavicon();
        });
      }
    }

    // 使用 MutationObserver 作为备用方案，监听 body 的 theme 属性变化（用于网站主题变化）
    if (document.body) {
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'theme') {
            switchImages();
          }
        });
      });

      // 监听 body 的属性变化
      observer.observe(document.body, {
        attributes: true,
        attributeFilter: ['theme']
      });
    }
  }

  // 确保在 DOM 准备好后执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
