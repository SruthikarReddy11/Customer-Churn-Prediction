import http.server
import socketserver
import webbrowser
import threading
import time
import os
import sys

# Find a free port starting at 8000
def find_free_port(start_port=8000, max_tries=100):
    import socket
    port = start_port
    for _ in range(max_tries):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return port
        except OSError:
            port += 1
    return start_port

def main():
    # Setup working directory to workspace root (one folder up from dashboard folder, or script dir parent)
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.dirname(script_dir)
    os.chdir(workspace_root)
    
    print(f"Starting server from workspace root: {workspace_root}")
    
    port = find_free_port(8000)
    handler = http.server.SimpleHTTPRequestHandler
    
    # Thread function to run server
    def serve_forever(httpd):
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
            
    # Set up TCP server
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/dashboard/"
        print(f"\n=======================================================")
        print(f" Sales Performance Dashboard is running!")
        print(f" Serving at: {url}")
        print(f" Press Ctrl+C in terminal to stop the server.")
        print(f"=======================================================\n")
        
        # Open browser in a separate thread after a small delay
        def open_browser():
            time.sleep(1)
            print("Opening web browser...")
            webbrowser.open(url)
            
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == "__main__":
    main()
