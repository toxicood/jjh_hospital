# LAPTOP BAND HONE KE BAAD — KAISE VAAPIS SHURU KAREIN (Resume Guide)

Sabhi files **C:\Users\BABLU\jjh_hospital** mein save hain (Desktop par `jjsirsa`
shortcut isi se juda hai). Band hone se kuch nahi mita. Sirf ye 3 cheezein
band hone par ruk jaati hain jo neeche ke steps se vapas chalu hoti hain:

## 1. MySQL database server start karo (sabse pehle)

Windows PowerShell kholo aur chalao:

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --basedir="C:\Program Files\MySQL\MySQL Server 8.4" --datadir="C:\Users\BABLU\MySQLData" --console
```

Ye window khuli rakhni hai (Ctrl+C band karega). Dobara punar-chalit ho jayega.
Login: root / JjH_root_2026 (password `.env` aur `README.md` mein likha hai)

## 2. npm install agar beech mein ruka tha

```powershell
cd C:\Users\BABLU\jjh_hospital
npm install --no-fund --no-audit
```

jab ye "added XXX packages" bole, tab step 3.

## 3. Project ke table banao (ek baar, agar pehle nahi kiya):

```powershell
npx prisma db push
npx prisma db seed
```

## 4. Website chalu karo

```powershell
npm run dev
```

Browser mein kholo: **http://localhost:3000**
- Patient site / booking: http://localhost:3000
- Admin panel: http://localhost:3000/admin
- Admin default login: `admin@jjh.in` / password `.env` ke `ADMIN_PASSWORD` se (analysis version dev `Admin@1234`)

## IMPORTANT — OneDrive use na karein

Yahi project Desktop (OneDrive) ke andar rakhne par `npm install` hang ho
jata hai — isliye real files `C:\Users\BABLU\jjh_hospital` mein hain aur
Desktop `jjsirsa` sirf ek junction (pointer) hai. Junction ko hatana ya
OneDrive se files ko bhoolna nahi. Elekt kar ya zaroorat ho to junction
dobara banane ka command:

```powershell
cmd /c mklink /J "C:\Users\BABLU\OneDrive\Desktop\jjsirsa" "C:\Users\BABLU\jjh_hospital"
```
