#!/usr/bin/env python3
"""Wrap the single-file game into web/index.html with PWA, share and favicon tags, and stamp the service worker.

Usage: python3 tools/build_web.py <path to kunphon-samkok.html>
"""
import hashlib, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parent.parent
web = root / 'web'
body = pathlib.Path(sys.argv[1]).read_text()
build = hashlib.sha1(body.encode()).hexdigest()[:10]
url = 'https://niasmin.github.io/samkok/web/'
head = f'''<!doctype html><html lang="th"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>ขุนพลสามก๊ก</title>
<meta name="description" content="เกมจัดทัพขุนพลสามก๊กบนเว็บ รวมขุนพล 64 คน ตีด่าน ประลองกับผู้เล่นจริง เล่นฟรี">
<meta name="theme-color" content="#4b150f">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="ขุนพลสามก๊ก">
<meta property="og:type" content="website">
<meta property="og:title" content="ขุนพลสามก๊ก">
<meta property="og:description" content="รวมขุนพล 64 คน จัดทัพ ตีด่าน ประลองกับผู้เล่นจริง เล่นฟรีบนเว็บ">
<meta property="og:image" content="{url}og.jpg">
<meta property="og:url" content="{url}">
<meta name="twitter:card" content="summary_large_image">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0;font:14px system-ui,sans-serif}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
<script>if('serviceWorker' in navigator && location.protocol==='https:') addEventListener('load',()=>navigator.serviceWorker.register('sw.js?b={build}').catch(()=>{{}}));</script>
</head><body>'''
(web / 'index.html').write_text(head + body + '</body></html>')
sw = (web / 'sw.js').read_text()
(web / 'sw.js').write_text(re.sub(r"const BUILD='[^']*'", f"const BUILD='{build}'", sw))
print('built', build)
