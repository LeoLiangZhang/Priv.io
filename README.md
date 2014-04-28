# Building Confederated Web-based Services with Priv.io

http://www.ccs.neu.edu/home/liang/paper/Privio-COSN-13/Privio-COSN.pdf

## Output JavaScript Description (app folder js)

	crypto_worker_imports.js	Imported by worker thread for crypto, RSA and CPABE.
	privio.crypto.cpabe.js		Init js for the worker.

	privio.share.js				Share library.
	privio.remote.js			The remote iframe base.

	privio.js 					The main.
	privio.crypto.js			Share crypto libs, AES, md5 etc.
	privio.app.js				The import file for APP iframe.


TODO:
* Move privio.s3.js from privio.share.js to privio.js;
* Tidy up privio.crypto.js, clean redundant features, e.g. MD5