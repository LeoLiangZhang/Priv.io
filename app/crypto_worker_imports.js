//#import lib/crypto/cryptico.js
//#import lib/crypto/cpabe.interface.js

// These two libs should import in some order, because I found that if
// cpabe is import before cryptico, it increases Google Chrome
// time to make a cpabe key, adds at lease 10s.