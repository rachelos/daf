call yarn build
rmdir /S /Q "..\pkg\embed\web"
xcopy /E /I /Y ".\dist" "..\pkg\embed\web"