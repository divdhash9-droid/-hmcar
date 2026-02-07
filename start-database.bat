@echo off
echo Starting MongoDB for HM Car Auction...
echo Data directory: c:\car-auction\database-data
echo.
echo Please keep this window OPEN while working on the project.
echo.
"C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "c:\car-auction\database-data"
pause
