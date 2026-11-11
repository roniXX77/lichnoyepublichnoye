"""HTTP byte-range contract used by film seeking and language resume."""
import http.client
import sys
from pathlib import Path
import tempfile
from threading import Thread
from http.server import ThreadingHTTPServer
from functools import partial
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from serve import MediaHandler

class QuietHandler(MediaHandler):
    def log_message(self, *_): pass

class MediaRanges(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        (Path(cls.temp.name) / 'sample.m4a').write_bytes(b'0123456789')
        cls.server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=cls.temp.name))
        cls.thread = Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown(); cls.server.server_close(); cls.thread.join(); cls.temp.cleanup()

    def request(self, range_header=None):
        connection = http.client.HTTPConnection(*self.server.server_address)
        connection.request('GET', '/sample.m4a', headers={'Range': range_header} if range_header else {})
        response = connection.getresponse()
        result = response.status, dict(response.headers), response.read()
        connection.close()
        return result

    def test_complete_file_advertises_seeking(self):
        status, headers, data = self.request()
        self.assertEqual((status, data), (200, b'0123456789'))
        self.assertEqual(headers['Accept-Ranges'], 'bytes')

    def test_bounded_and_suffix_ranges(self):
        status, headers, data = self.request('bytes=2-5')
        self.assertEqual((status, data), (206, b'2345'))
        self.assertEqual(headers['Content-Range'], 'bytes 2-5/10')
        self.assertEqual(self.request('bytes=-3')[2], b'789')
        self.assertEqual(self.request('bytes=8-')[2], b'89')

    def test_invalid_range_is_empty_416(self):
        status, headers, data = self.request('bytes=99-')
        self.assertEqual((status, data), (416, b''))
        self.assertEqual(headers['Content-Range'], 'bytes */10')

if __name__ == '__main__': unittest.main()
