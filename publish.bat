@echo off
chcp 65001 >nul

git add .
git commit -m "update"

@REM 参数 -p 表示推送代码到远程仓库
if "%~1"=="-p" (
git remote add origin https://github.com/rachelos/daf.git
git push -u origin main
)