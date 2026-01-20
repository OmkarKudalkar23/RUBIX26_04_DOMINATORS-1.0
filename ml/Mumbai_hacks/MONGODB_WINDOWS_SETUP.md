# MongoDB Setup Without Docker for Windows

## Option 1: Use MongoDB Atlas (Cloud - Easiest)
Go to https://www.mongodb.com/cloud/atlas/register
1. Create free account
2. Create free cluster
3. Get connection string from Atlas dashboard
4. Update .env with: MONGODB_URL=your_atlas_connection_string

## Option 2: Install MongoDB Community Server (Local)
1. Download from: https://www.mongodb.com/try/download/community
2. Select Windows version
3. Run installer with "Complete" setup
4. Install as Windows service
5. MongoDB runs on mongodb://localhost:27017/

## Option 3: Use Chocolatey (Package Manager)
```powershell
# Install Chocolatey (if not installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install MongoDB
choco install mongodb

# Start MongoDB service
net start MongoDB
```

## Option 4: Use Portable MongoDB
1. Download portable MongoDB from: https://www.mongodb.org/dl/win32/x86_64
2. Extract to C:\mongodb
3. Create data directories:
   mkdir C:\mongodb\data\db
   mkdir C:\mongodb\data\log
4. Start MongoDB:
   C:\mongodb\bin\mongod.exe --dbpath C:\mongodb\data\db

## After Installation
Test connection:
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017/').admin.command('ping'))"
