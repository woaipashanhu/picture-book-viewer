#!/usr/bin/env python3
"""
绘本部署后自动检查脚本
在每次部署后运行，验证音频、pageTexts、页面功能等关键项
"""
import json, paramiko, os, sys, subprocess
from datetime import datetime

# SSH 配置
KEY_PATH = "/Users/liuzhen/Desktop/项目/claw.pem"
SERVER_HOST = "47.99.101.168"
SERVER_USER = "root"
REMOTE_BASE = "/var/www/picture-books/"

# 绘本列表（检查全部）
BOOKS = [
    "25-我和爸爸读书",
    "26-沙坪坝是山东话",
    "27-偶爱你又香又干净",
    "28-感应电梯",
    "29-省会城市的地铁可多了",
    "30-骗人的故事",
]

results = []
errors = []

def log(msg, level="INFO"):
    print(f"[{level}] {msg}")

# 1. SSH 连接
key = paramiko.RSAKey.from_private_key_file(KEY_PATH)
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(hostname=SERVER_HOST, username=SERVER_USER, pkey=key)
sftp = ssh.open_sftp()

# 2. 检查 books.json 中 pageTexts
log("检查 books.json 中的 pageTexts...")
try:
    with sftp.open(REMOTE_BASE + "books.json") as f:
        books = json.load(f)
    for b in books:
        if b["id"] in BOOKS:
            has_texts = "pageTexts" in b and b["pageTexts"] and len(b["pageTexts"]) > 0
            if has_texts:
                log(f"  {b['id']}: pageTexts 存在 ({len(b['pageTexts'])} 条)")
                results.append(f"{b['id']}: pageTexts OK")
            else:
                log(f"  {b['id']}: pageTexts 缺失！", "ERROR")
                errors.append(f"{b['id']}: pageTexts 缺失")
except Exception as e:
    log(f"books.json 读取失败: {e}", "ERROR")
    errors.append(f"books.json 读取失败: {e}")

# 3. 检查音频文件
log("检查服务器上的音频文件...")
for book_id in BOOKS:
    audio_dir = REMOTE_BASE + f"audio/{book_id}"
    try:
        files = sftp.listdir(audio_dir)
        mp3s = [f for f in files if f.endswith('.mp3')]
        if mp3s:
            log(f"  {book_id}: {len(mp3s)} 个 mp3 文件")
            results.append(f"{book_id}: audio OK ({len(mp3s)} files)")
        else:
            log(f"  {book_id}: 没有 mp3 文件！", "ERROR")
            errors.append(f"{book_id}: audio missing")
    except Exception as e:
        log(f"  {book_id}: 音频目录不存在: {e}", "ERROR")
        errors.append(f"{book_id}: audio dir missing: {e}")

# 4. 检查本地 BookViewer.tsx 关键代码
log("检查 BookViewer.tsx 关键代码...")
bv_path = os.path.expanduser("~/Documents/picture-book-viewer/src/components/BookViewer.tsx")
with open(bv_path) as f:
    bv = f.read()

checks = [
    ("toggleAutoPlay 开启 voiceOn", "if (next && !voiceOn)"),
    ("toggleAutoPlay 绑定 ended", "audio.addEventListener('ended'"),
    ("toggleAutoPlay 播放 audio", "audio.play()"),
    ("useEffect 绑定 ended", "audio.addEventListener('ended', goNext)"),
    ("useEffect 防重复检查", "audioRef.current && !audioRef.current.paused"),
    ("pageChangeLockRef", "pageChangeLockRef"),
]

for name, pattern in checks:
    if pattern in bv:
        log(f"  {name}: OK")
        results.append(f"BookViewer: {name} OK")
    else:
        log(f"  {name}: 缺失！", "ERROR")
        errors.append(f"BookViewer: {name} missing")

# 5. 检查本地 dist/audio 是否有文件
log("检查本地 dist/audio...")
dist_audio = os.path.expanduser("~/Documents/picture-book-viewer/dist/audio")
if os.path.exists(dist_audio):
    for book_id in BOOKS:
        d = os.path.join(dist_audio, book_id)
        if os.path.exists(d):
            mp3s = [f for f in os.listdir(d) if f.endswith('.mp3')]
            log(f"  {book_id}: dist/audio 有 {len(mp3s)} 个 mp3")
            results.append(f"dist/audio: {book_id} OK")
        else:
            log(f"  {book_id}: dist/audio 目录不存在！", "ERROR")
            errors.append(f"dist/audio: {book_id} missing")
else:
    log("dist/audio 不存在！", "ERROR")
    errors.append("dist/audio missing")

sftp.close()
ssh.close()

# 6. 打印报告
print("\n" + "="*60)
print(f"部署检查报告 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("="*60)
print(f"\n通过项: {len(results)}")
for r in results:
    print(f"  [OK] {r}")
print(f"\n失败项: {len(errors)}")
for e in errors:
    print(f"  [FAIL] {e}")
print("\n" + "="*60)

if errors:
    print("\n[结果] 检查未通过！请修复上述错误项后再部署。")
    sys.exit(1)
else:
    print("\n[结果] 全部检查通过！部署成功。")
    sys.exit(0)
