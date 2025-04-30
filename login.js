document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // 这里可以添加实际的用户验证逻辑
    // 目前使用简单的演示账号
    if (username === 'admin' && password === 'admin123') {
        // 登录成功，存储登录状态
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', username);
        // 跳转到主页面
        window.location.href = 'index.html';
    } else {
        // 显示错误信息
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.style.display = 'block';
    }
}); 