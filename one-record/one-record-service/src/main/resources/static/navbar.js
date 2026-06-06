// 动态加载导航栏
function loadNavbar() {
    fetch('navbar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            // 在body的开头插入导航栏
            document.body.insertAdjacentHTML('afterbegin', data);
        })
        .catch(error => {
            console.error('Failed to load navbar:', error);
        });
}

// 页面加载完成后加载导航栏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadNavbar);
} else {
    loadNavbar();
}