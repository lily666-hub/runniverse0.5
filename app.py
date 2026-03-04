"""
上海跑步社区 - Runniverse
使用 http.server 服务预构建的 React 静态文件
"""

import os
import http.server
import socketserver

PORT = 7860
DIRECTORY = "dist"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """支持 SPA 路由的静态文件服务"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # 尝试直接服务文件
        file_path = os.path.join(DIRECTORY, self.path.lstrip('/'))
        if os.path.isfile(file_path):
            super().do_GET()
        elif '.' not in os.path.basename(self.path):
            # SPA 路由：非文件请求返回 index.html
            self.path = '/index.html'
            super().do_GET()
        else:
            super().do_GET()

if __name__ == '__main__':
    print(f"启动服务器: http://0.0.0.0:{PORT}")
    print(f"服务目录: {DIRECTORY}")
    with socketserver.TCPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
        httpd.serve_forever()
