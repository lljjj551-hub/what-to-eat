@echo off
cd /d C:\Users\NEU\what-to-eat
echo ============================
echo   今天吃什么 - 局域网服务
echo ============================
echo.
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4" ^| findstr /v "127.0.0.1"') do (
    echo 手机打开: http:%%a:3000
)
echo.
echo 按 Ctrl+C 停止
echo ============================
npx http-server out -p 3000 -a 0.0.0.0
pause
