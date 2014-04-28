'''
Logging format.

LogEntry     ::= [ ServerInfo, ClientInfo ]
ServerInfo   ::= [ IP, server_time, UserAgent ]
ClientInfo   ::= [ client_time, Username, type OptionalArgs ]
OptionalArgs ::= , String OptionalArgs
Username     ::= null | "" | String

*
If Username==null, then it comes from Pio.log, not new Pio().log;

e.g.
[ [ "127.0.0.1", "2012-09-07T12:26:12.044 EDT-0400 1347035172044", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_1) AppleWebKit/537.1 (KHTML, like Gecko) Chrome/21.0.1180.89 Safari/537.1"],
  [ "2012-09-07T12:26:12.044 EDT-0400 1347035172044", null, "login", "arg1" ] ]

Types of ClientInfo
crypto              => type time comments
                       'cpabe_get_private_key' time policy
                       'cpabe_enc'             time policy
                       'cpabe_dec'             time enc_key.length
Pio_loadObject      => path time size
Pio_saveObject      => path time size
initiateFriendShi   => friendid time policy                      # time, the time to generate keys and send message
acceptFriendShip    => friendid time policy                      # time, the time to generate keys and send message
refreshPendingFriends => friendid time
saveObjectEx        => path time data_size cipher_size all_size  # time, the time to encrypt and save
loadFeeds           => time #feed #msg #pullmsg                  # pullmsg, pullMessages from friends
finishFirstFeedLoad => time [loadFeeds event args list]          # almost exact as loadFeeds, but the time is ticking when user click login.
'''

from bottle import route, run, request
import json, time, datetime

LOG_FILENAME = 'log/client-' + datetime.datetime.now().isoformat().replace(':', '-') +'.log'

LOG_FILE = open(LOG_FILENAME, "w+")

@route('/log', method='POST')
def do_log():

    print
    print '======= Header ======='
    for k, v in request.headers.iteritems():
        print k, v
    print '=======  END  ========'

    user_agent = request.headers.get('User-Agent', '');

    body = request.body.getvalue()
    log_entries = json.loads(body)
    for client_info in log_entries:
        server_info = [request.headers.get('X-Forwarded-For', ''),
                       time.strftime("%Y-%m-%dT%H:%M:%S %Z%z", time.localtime()),
                       request.headers.get('User-Agent', '')
                       ]
        log_entry = [server_info, client_info]
        print log_entry
        print >> LOG_FILE, json.dumps(log_entry)
    LOG_FILE.flush()
    return str(len(log_entries))

@route('/hello/:name')
def index(name='World'):
    return '<script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.1/jquery.min.js"></script><b>Hello %s!</b>' % name

run(host='localhost', port=8081)