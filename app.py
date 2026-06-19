import urllib.request
import xml.etree.ElementTree as ET
import re
import time
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
cache = {
    "data": None,
    "timestamp": 0
}
CACHE_DURATION = 300 # 5 minutes cache

def fetch_and_parse_feed():
    req = urllib.request.Request(
        FEED_URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    )
    with urllib.request.urlopen(req) as response:
        xml_data = response.read()
        
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    entries = root.findall('atom:entry', ns)
    
    updates = []
    for entry in entries:
        title = entry.find('atom:title', ns)
        title_text = title.text if title is not None else ""
        
        updated = entry.find('atom:updated', ns)
        updated_text = updated.text if updated is not None else ""
        
        id_val = entry.find('atom:id', ns)
        id_text = id_val.text if id_val is not None else ""
        
        link = entry.find('atom:link', ns)
        link_href = link.attrib.get('href') if link is not None else ""
        
        content_element = entry.find('atom:content', ns)
        content_text = content_element.text if content_element is not None else ""
        
        # Split entry by h3 tags to isolate individual release updates
        parts = re.split(r'<h3>(.*?)</h3>', content_text)
        if len(parts) <= 1:
            updates.append({
                'id': f"{id_text}_0",
                'date': title_text,
                'iso_date': updated_text,
                'type': 'Update',
                'content': content_text,
                'link': link_href
            })
        else:
            for idx, i in enumerate(range(1, len(parts), 2)):
                utype = parts[i].strip()
                ucontent = parts[i+1].strip() if i+1 < len(parts) else ""
                updates.append({
                    'id': f"{id_text}_{idx}",
                    'date': title_text,
                    'iso_date': updated_text,
                    'type': utype,
                    'content': ucontent,
                    'link': link_href
                })
    return updates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    now = time.time()
    
    if force_refresh or cache["data"] is None or (now - cache["timestamp"]) > CACHE_DURATION:
        try:
            data = fetch_and_parse_feed()
            cache["data"] = data
            cache["timestamp"] = now
            return jsonify({
                "status": "success",
                "source": "live",
                "timestamp": now,
                "data": data
            })
        except Exception as e:
            if cache["data"] is not None:
                return jsonify({
                    "status": "warning",
                    "message": f"Failed to fetch live data ({str(e)}). Showing cached release notes.",
                    "source": "cache",
                    "timestamp": cache["timestamp"],
                    "data": cache["data"]
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": f"Failed to fetch release notes: {str(e)}",
                    "data": []
                }), 500
                
    return jsonify({
        "status": "success",
        "source": "cache",
        "timestamp": cache["timestamp"],
        "data": cache["data"]
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
