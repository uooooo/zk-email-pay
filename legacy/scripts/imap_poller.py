#!/usr/bin/env python3
import imaplib
import os
import email
import requests

IMAP_HOST=os.environ.get('IMAP_HOST','127.0.0.1')
IMAP_PORT=int(os.environ.get('IMAP_PORT','3143'))
IMAP_USER=os.environ.get('IMAP_USER','test@localhost')
IMAP_PASS=os.environ.get('IMAP_PASS','password')
RELAYER_ENDPOINT=os.environ.get('RELAYER_ENDPOINT','http://127.0.0.1:4500/api/receiveEmail')

def main():
    M = imaplib.IMAP4(host=IMAP_HOST, port=IMAP_PORT)
    M.login(IMAP_USER, IMAP_PASS)
    M.select('INBOX')
    typ, data = M.search(None, 'ALL')
    if typ != 'OK':
        print('No messages found')
        return
    ids = data[0].split()
    if not ids:
        print('No messages in INBOX')
        return
    for num in ids:
        typ, msg_data = M.fetch(num, '(RFC822)')
        if typ != 'OK':
            continue
        raw = msg_data[0][1]
        # forward raw MIME to relayer
        try:
            r = requests.post(RELAYER_ENDPOINT, data=raw, headers={'Content-Type':'text/plain'}, timeout=10)
            print('Posted', num.decode(), r.status_code)
        except Exception as e:
            print('Post error', e)
    M.logout()

if __name__ == '__main__':
    main()
