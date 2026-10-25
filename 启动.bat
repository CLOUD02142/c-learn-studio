@echo off
chcp 65001 >nul
cd /d "%~dp0"
title C-Learn Studio

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   [错误] 没有找到 Node.js
  echo   请先安装 Node.js ^(https://nodejs.org^) 再运行本程序。
  echo.
  pause
  exit /b 1
)

echo.
echo   正在启动 C-Learn Studio ...
echo   浏览器会自动打开。端口被占用时服务会自动往后换一个，并打开正确的地址。
echo   关掉这个黑窗口就是退出程序。
echo.

node server.js
pause
