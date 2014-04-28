from gevent import monkey; monkey.patch_all()

from bottle import route, run, request, response
import json, urllib2, httplib

SERVER_PREFIX = "http://localhost:8888/"

class CaseInsensitiveDict(dict):
    def __setitem__(self, key, value):
        super(CaseInsensitiveDict, self).__setitem__(key.lower(), value)

    def __getitem__(self, key):
        return super(CaseInsensitiveDict, self).__getitem__(key.lower())

class CacheItem(object):
    def __init__(self, headers, body):
        self.item = {}
        self.item["headers"] = headers
        self.item["body"] = body
        
    def headers(self):
        return self.item["headers"]
    
    def body(self):
        return self.item["body"]
                  

class CacheStore(object):
    def __init__(self):
        self.store = {}
    
    def save(self, uri, headers, body):
        print "Saving:", uri
        citem = CacheItem(headers, body)
        self.store[uri] = citem
        return citem
        
    def load(self, uri):
        citem = self.store.get(uri, None)
        print "Loading:", uri, not not citem
        return citem
    
    def clear(self):
        cache_store.store = {}

cache_store = CacheStore()

@route("/:path#.*#")
def cache(path):
    if path == "clean_privio_cache":
        cache_store.clear()
        return "CACHE CLEAR\n"
    print "======== Request Begin =========="
    q = "?"+request.query_string if request.query_string else ''
    path_query = path+q
    citem = cache_store.load(path_query)
    if not citem:
        url = SERVER_PREFIX+path_query
        print "Requesting:", url
        
        # req = urllib2.Request(url)
        # resp = urllib2.urlopen(req)
        # info = resp.info();
        # length = info.getheader('content-length')
        # body = ''
        # while True:
        #     data = resp.read()
        #     if not data: #len(body) == int(length):
        #         break
        #     body += data
        #     print "Body size:", len(body)
        # print "Fetched:", len(body)
        # print "Headers:", info.items()
        # headers = CaseInsensitiveDict(info.items())

        conn = httplib.HTTPConnection("localhost", 8888)
        conn.request("GET", "/"+path_query)
        r = conn.getresponse()
        headers = r.getheaders()
        print "Headers:", headers
        headers = CaseInsensitiveDict(headers)
        body = ''
        while True:
            data = r.read()
            if not data:
                break
            body += data
            print "Body size:", len(body)
        print "Fetched:", len(body)
        citem = cache_store.save(path_query, headers, body)
#    ctype = resp.info().getheader('Content-Type')
    ctype = citem.headers().get('Content-Type'.lower())
    response.set_header('Content-Type', ctype)
    response.set_header('Access-Control-Allow-Origin', '*')
    return citem.body()

run(host="localhost", port=8801, server="gevent")

