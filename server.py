import http.server
import socketserver
import json
import csv
import os
from datetime import datetime

PORT = 8080
LOG_FILE = "login_logs.csv"

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/log-login":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data.decode('utf-8'))
                email = data.get("email", "")
                lat = data.get("lat", "")
                lon = data.get("lon", "")
                location_name = data.get("locationName", "")
                weather_time = data.get("weatherTime", "")
                
                # Get current server date and time
                now = datetime.now()
                date_str = now.strftime("%Y-%m-%d")
                day_str = now.strftime("%A")
                time_str = now.strftime("%I:%M:%S %p")
                
                # Check if file exists to write header
                file_exists = os.path.isfile(LOG_FILE)
                
                # Append to private CSV file (opens directly in Excel)
                with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    if not file_exists:
                        # Write headers
                        writer.writerow(["Email", "Login Date", "Login Day", "Login Time", "Latitude", "Longitude", "GPS Location Name", "Weather Report Local Time"])
                    
                    writer.writerow([email, date_str, day_str, time_str, lat, lon, location_name, weather_time])
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"status": "success", "message": "Login logged successfully"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f"[AUTH LOG] Logged login for {email} at {date_str} {time_str}")
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                print(f"[AUTH LOG ERROR] {e}")
        else:
            self.send_response(404)
            self.end_headers()

# Start Custom Server
handler = CustomHandler
# Allow port reuse to prevent address-already-in-use errors on restart
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), handler) as httpd:
    print(f"Serving weather application with login logging on port {PORT}...")
    httpd.serve_forever()
